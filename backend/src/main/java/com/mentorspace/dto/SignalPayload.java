package com.mentorspace.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

/**
 * Generic WebRTC signaling envelope. type ∈ {"offer", "answer", "ice-candidate"}.
 * Backend NEVER persists this — relay only.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SignalPayload {
    private UUID sessionId;
    private UUID senderId;
    private String type;
    private Object sdp;
    private Map<String, Object> candidate;
}
