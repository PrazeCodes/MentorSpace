package com.mentorspace.dto;

import com.mentorspace.entity.Message;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private UUID id;
    private UUID sessionId;
    private UUID senderId;
    private String content;
    private Instant timestamp;

    public static MessageResponse from(Message m) {
        return new MessageResponse(m.getId(), m.getSessionId(), m.getSenderId(), m.getContent(), m.getTimestamp());
    }
}
