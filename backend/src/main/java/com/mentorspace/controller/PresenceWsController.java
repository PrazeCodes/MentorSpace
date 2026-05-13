package com.mentorspace.controller;

import com.mentorspace.dto.PresencePayload;
import com.mentorspace.entity.Session;
import com.mentorspace.repository.SessionRepository;
import com.mentorspace.service.SessionService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class PresenceWsController {

    private final SimpMessagingTemplate broker;
    private final SessionService sessionService;
    private final SessionRepository sessionRepository;

    // Maps wsSessionId -> { userId, sessionRoomId, userName }
    public static final Map<String, Map<String, Object>> WS_SESSIONS = new ConcurrentHashMap<>();

    public PresenceWsController(SimpMessagingTemplate broker,
                                SessionService sessionService,
                                SessionRepository sessionRepository) {
        this.broker = broker;
        this.sessionService = sessionService;
        this.sessionRepository = sessionRepository;
    }

    @MessageMapping("/join")
    public void onJoin(@Payload PresencePayload payload, SimpMessageHeaderAccessor headers) {
        UUID userId = (UUID) headers.getSessionAttributes().get("userId");
        String userName = (String) headers.getSessionAttributes().get("name");
        if (userId == null || payload.getSessionId() == null) return;

        Session s = sessionService.loadAndCheckParticipant(payload.getSessionId(), userId);

        // Track for disconnect handling
        Map<String, Object> info = new HashMap<>();
        info.put("userId", userId);
        info.put("sessionRoomId", s.getId());
        info.put("userName", userName);
        WS_SESSIONS.put(headers.getSessionId(), info);

        PresencePayload out = new PresencePayload(s.getId(), userId, userName, "join");
        broker.convertAndSend("/topic/session/" + s.getId() + "/presence", out);
    }
}
