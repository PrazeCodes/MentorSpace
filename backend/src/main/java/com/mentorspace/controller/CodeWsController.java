package com.mentorspace.controller;

import com.mentorspace.dto.CodePayload;
import com.mentorspace.service.CodeSnapshotService;
import com.mentorspace.service.SessionService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.UUID;

@Controller
public class CodeWsController {

    private final SimpMessagingTemplate broker;
    private final CodeSnapshotService codeSnapshotService;
    private final SessionService sessionService;

    public CodeWsController(SimpMessagingTemplate broker,
                            CodeSnapshotService codeSnapshotService,
                            SessionService sessionService) {
        this.broker = broker;
        this.codeSnapshotService = codeSnapshotService;
        this.sessionService = sessionService;
    }

    @MessageMapping("/code")
    public void onCode(@Payload CodePayload payload, SimpMessageHeaderAccessor headers) {
        UUID userId = (UUID) headers.getSessionAttributes().get("userId");
        if (userId == null || payload.getSessionId() == null) return;

        // Authorization: only participants can sync code in this session
        sessionService.loadAndCheckParticipant(payload.getSessionId(), userId);

        // Tag with senderId so clients skip their own echo.
        payload.setSenderId(userId);

        // Broadcast every update; clients filter by senderId.
        broker.convertAndSend("/topic/session/" + payload.getSessionId() + "/code", payload);

        // Debounced persistence (default: max once every 5 seconds per session).
        codeSnapshotService.upsertIfDebounced(payload.getSessionId(),
                payload.getContent() == null ? "" : payload.getContent());
    }
}
