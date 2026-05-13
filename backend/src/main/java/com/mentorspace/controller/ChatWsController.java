package com.mentorspace.controller;

import com.mentorspace.dto.ChatPayload;
import com.mentorspace.dto.MessageResponse;
import com.mentorspace.entity.Message;
import com.mentorspace.repository.MessageRepository;
import com.mentorspace.service.SessionService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.Instant;
import java.util.UUID;

@Controller
public class ChatWsController {

    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate broker;
    private final SessionService sessionService;

    public ChatWsController(MessageRepository messageRepository,
                            SimpMessagingTemplate broker,
                            SessionService sessionService) {
        this.messageRepository = messageRepository;
        this.broker = broker;
        this.sessionService = sessionService;
    }

    @MessageMapping("/chat")
    public void onChat(@Payload ChatPayload payload, SimpMessageHeaderAccessor headers) {
        UUID userId = (UUID) headers.getSessionAttributes().get("userId");
        if (userId == null || payload.getSessionId() == null) return;
        if (payload.getContent() == null || payload.getContent().isBlank()) return;
        if (payload.getContent().length() > 4000) return;

        // Authorization: only participants can send chat in this session
        sessionService.loadAndCheckParticipant(payload.getSessionId(), userId);

        Message m = Message.builder()
                .sessionId(payload.getSessionId())
                .senderId(userId)
                .content(payload.getContent())
                .timestamp(Instant.now())
                .build();
        m = messageRepository.save(m);

        broker.convertAndSend("/topic/session/" + payload.getSessionId() + "/chat",
                MessageResponse.from(m));
    }
}
