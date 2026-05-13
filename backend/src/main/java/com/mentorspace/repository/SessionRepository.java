package com.mentorspace.repository;

import com.mentorspace.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SessionRepository extends JpaRepository<Session, UUID> {

    Optional<Session> findByJoinCode(String joinCode);

    boolean existsByJoinCode(String joinCode);

    List<Session> findByMentorIdOrStudentIdOrderByCreatedAtDesc(UUID mentorId, UUID studentId);
}
