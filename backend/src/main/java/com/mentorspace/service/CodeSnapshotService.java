package com.mentorspace.service;

import com.mentorspace.entity.CodeSnapshot;
import com.mentorspace.repository.CodeSnapshotRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Debounced code snapshot persistence:
 * - Broadcasts happen in the WS controller (every keystroke message).
 * - DB writes only occur if more than `debounceMs` have passed since the last write
 *   for a given session. Latest content always wins; intermediate writes are skipped.
 */
@Service
public class CodeSnapshotService {

    private final CodeSnapshotRepository repo;
    private final long debounceMs;

    private final ConcurrentHashMap<UUID, Long> lastWriteAt = new ConcurrentHashMap<>();

    public CodeSnapshotService(CodeSnapshotRepository repo,
                               @Value("${app.ws.code-debounce-ms:5000}") long debounceMs) {
        this.repo = repo;
        this.debounceMs = debounceMs;
    }

    public Optional<String> getContent(UUID sessionId) {
        return repo.findBySessionId(sessionId).map(CodeSnapshot::getContent);
    }

    @Transactional
    public void upsertIfDebounced(UUID sessionId, String content) {
        long now = System.currentTimeMillis();
        Long last = lastWriteAt.get(sessionId);
        if (last != null && (now - last) < debounceMs) return;

        lastWriteAt.put(sessionId, now);
        CodeSnapshot existing = repo.findBySessionId(sessionId).orElse(null);
        if (existing == null) {
            CodeSnapshot snap = CodeSnapshot.builder()
                    .sessionId(sessionId)
                    .content(content == null ? "" : content)
                    .updatedAt(Instant.now())
                    .build();
            repo.save(snap);
        } else {
            existing.setContent(content == null ? "" : content);
            repo.save(existing);
        }
    }
}
