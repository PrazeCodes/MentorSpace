package com.mentorspace.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PresencePayload {
    private UUID sessionId;
    private UUID userId;
    private String userName;
    private String event; // "join" | "leave"
}
