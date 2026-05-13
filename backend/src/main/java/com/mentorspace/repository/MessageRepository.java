package com.mentorspace.repository;

import com.mentorspace.entity.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message> findBySessionIdOrderByTimestampDesc(UUID sessionId, Pageable pageable);
}
