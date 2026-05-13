package com.mentorspace.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Inbound: { sessionId, content } from client.
 * Outbound (broadcast): { sessionId, content, senderId } so clients can skip echoes.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CodePayload {
    private UUID sessionId;
    private String content;
    private UUID senderId;
}
