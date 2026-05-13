package com.mentorspace.controller;

import com.mentorspace.dto.SignalPayload;
import com.mentorspace.service.SessionService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.UUID;

/**
 * WebRTC signaling relay. Backend NEVER persists or processes media.
 */
@Controller
public class SignalWsController {

    private final SimpMessagingTemplate broker;
    private final SessionService sessionService;

    public SignalWsController(SimpMessagingTemplate broker, SessionService sessionService) {
        this.broker = broker;
        this.sessionService = sessionService;
    }

    @MessageMapping("/signal")
    public void onSignal(@Payload SignalPayload payload, SimpMessageHeaderAccessor headers) {
        UUID userId = (UUID) headers.getSessionAttributes().get("userId");
        if (userId == null || payload.getSessionId() == null || payload.getType() == null) return;

        sessionService.loadAndCheckParticipant(payload.getSessionId(), userId);

        payload.setSenderId(userId);
        broker.convertAndSend("/topic/session/" + payload.getSessionId() + "/signal", payload);
    }
}
