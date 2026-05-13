package com.mentorspace.repository;

import com.mentorspace.entity.CodeSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CodeSnapshotRepository extends JpaRepository<CodeSnapshot, UUID> {

    Optional<CodeSnapshot> findBySessionId(UUID sessionId);
}
