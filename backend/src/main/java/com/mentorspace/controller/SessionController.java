package com.mentorspace.controller;

import com.mentorspace.dto.JoinRequest;
import com.mentorspace.dto.MessageResponse;
import com.mentorspace.dto.SessionResponse;
import com.mentorspace.repository.MessageRepository;
import com.mentorspace.security.CustomUserDetails;
import com.mentorspace.service.CodeSnapshotService;
import com.mentorspace.service.SessionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final SessionService sessionService;
    private final MessageRepository messageRepository;
    private final CodeSnapshotService codeSnapshotService;

    public SessionController(SessionService sessionService,
                             MessageRepository messageRepository,
                             CodeSnapshotService codeSnapshotService) {
        this.sessionService = sessionService;
        this.messageRepository = messageRepository;
        this.codeSnapshotService = codeSnapshotService;
    }

    @PostMapping("/create")
    @PreAuthorize("hasRole('MENTOR')")
    public ResponseEntity<SessionResponse> create(@AuthenticationPrincipal CustomUserDetails me) {
        return ResponseEntity.ok(sessionService.createSession(me.getId(), me.getRole()));
    }

    @PostMapping("/join")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<SessionResponse> join(@AuthenticationPrincipal CustomUserDetails me,
                                                @Valid @RequestBody JoinRequest req) {
        return ResponseEntity.ok(sessionService.joinSession(me.getId(), me.getRole(), req.getJoinCode()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SessionResponse> get(@AuthenticationPrincipal CustomUserDetails me,
                                               @PathVariable UUID id) {
        return ResponseEntity.ok(sessionService.getSession(id, me.getId()));
    }

    @PostMapping("/{id}/end")
    @PreAuthorize("hasRole('MENTOR')")
    public ResponseEntity<SessionResponse> end(@AuthenticationPrincipal CustomUserDetails me,
                                               @PathVariable UUID id) {
        return ResponseEntity.ok(sessionService.endSession(id, me.getId(), me.getRole()));
    }

    @GetMapping("/my")
    public ResponseEntity<List<SessionResponse>> mine(@AuthenticationPrincipal CustomUserDetails me) {
        return ResponseEntity.ok(sessionService.mySessions(me.getId()));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<MessageResponse>> messages(@AuthenticationPrincipal CustomUserDetails me,
                                                          @PathVariable UUID id) {
        sessionService.loadAndCheckParticipant(id, me.getId());
        var desc = messageRepository
                .findBySessionIdOrderByTimestampDesc(id, PageRequest.of(0, 200))
                .stream()
                .map(MessageResponse::from)
                .collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));
        // reverse to chronological order
        java.util.Collections.reverse(desc);
        return ResponseEntity.ok(desc);
    }

    @GetMapping("/{id}/code")
    public ResponseEntity<Map<String, String>> code(@AuthenticationPrincipal CustomUserDetails me,
                                                    @PathVariable UUID id) {
        sessionService.loadAndCheckParticipant(id, me.getId());
        return ResponseEntity.ok(Map.of("content",
                codeSnapshotService.getContent(id).orElse("")));
    }
}
