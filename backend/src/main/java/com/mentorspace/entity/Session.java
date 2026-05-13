package com.mentorspace.entity;

import com.mentorspace.enums.SessionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sessions", indexes = {
        @Index(name = "idx_sessions_join_code", columnList = "join_code", unique = true),
        @Index(name = "idx_sessions_mentor", columnList = "mentor_id"),
        @Index(name = "idx_sessions_student", columnList = "student_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "mentor_id", nullable = false, columnDefinition = "uuid")
    private UUID mentorId;

    @Column(name = "student_id", columnDefinition = "uuid")
    private UUID studentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SessionStatus status;

    @Column(name = "join_code", nullable = false, length = 6, unique = true)
    private String joinCode;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (status == null) status = SessionStatus.WAITING;
    }
}
