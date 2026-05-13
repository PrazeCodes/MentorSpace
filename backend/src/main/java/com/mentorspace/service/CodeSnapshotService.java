package com.mentorspace.service;

import com.mentorspace.entity.CodeSnapshot;
import com.mentorspace.repository.CodeSnapshotRepository;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

/**
 * Code snapshot persistence with **trailing-edge** debounce.
 *
 * - Every incoming code frame updates an in-memory `latest` cache (instantly visible to
 *   late joiners via {@link #getContent}).
 * - The first update for a given session schedules a single flush after `debounceMs`;
 *   subsequent updates do not re-schedule but always overwrite `latest`. When the timer
 *   fires it writes whatever is in `latest` to the DB.
 * - This ensures the trailing keystroke (after the user stops typing) is always saved,
 *   while still bounding writes to at most one per `debounceMs` per session.
 */
@Service
public class CodeSnapshotService {

    private final CodeSnapshotRepository repo;
    private final TransactionTemplate tx;
    private final long debounceMs;

    private final ConcurrentHashMap<UUID, String> latest = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<UUID, ScheduledFuture<?>> pending = new ConcurrentHashMap<>();

    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "code-snapshot-flusher");
        t.setDaemon(true);
        return t;
    });

    public CodeSnapshotService(CodeSnapshotRepository repo,
                               TransactionTemplate tx,
                               @Value("${app.ws.code-debounce-ms:5000}") long debounceMs) {
        this.repo = repo;
        this.tx = tx;
        this.debounceMs = debounceMs;
    }

    public Optional<String> getContent(UUID sessionId) {
        String mem = latest.get(sessionId);
        if (mem != null) return Optional.of(mem);
        Optional<String> fromDb = repo.findBySessionId(sessionId).map(CodeSnapshot::getContent);
        fromDb.ifPresent(s -> latest.putIfAbsent(sessionId, s));
        return fromDb;
    }

    public void upsertIfDebounced(UUID sessionId, String content) {
        latest.put(sessionId, content == null ? "" : content);
        pending.computeIfAbsent(sessionId, sid ->
                scheduler.schedule(() -> flush(sid), debounceMs, TimeUnit.MILLISECONDS));
    }

    private void flush(UUID sid) {
        try {
            tx.executeWithoutResult(status -> {
                String content = latest.get(sid);
                if (content == null) return;
                CodeSnapshot existing = repo.findBySessionId(sid).orElse(null);
                if (existing == null) {
                    repo.save(CodeSnapshot.builder()
                            .sessionId(sid)
                            .content(content)
                            .updatedAt(Instant.now())
                            .build());
                } else {
                    existing.setContent(content);
                    repo.save(existing);
                }
            });
        } finally {
            pending.remove(sid);
        }
    }

    @PreDestroy
    public void shutdown() {
        scheduler.shutdown();
        try {
            scheduler.awaitTermination(2, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
