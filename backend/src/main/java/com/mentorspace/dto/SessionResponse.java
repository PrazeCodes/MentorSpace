package com.mentorspace.dto;

import com.mentorspace.entity.Session;
import com.mentorspace.enums.SessionStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SessionResponse {
    private UUID id;
    private UUID mentorId;
    private UUID studentId;
    private SessionStatus status;
    private String joinCode;
    private Instant createdAt;
    private Instant endedAt;

    public static SessionResponse from(Session s) {
        return new SessionResponse(
                s.getId(), s.getMentorId(), s.getStudentId(),
                s.getStatus(), s.getJoinCode(), s.getCreatedAt(), s.getEndedAt());
    }
}
