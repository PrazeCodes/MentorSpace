package com.mentorspace.service;

import com.mentorspace.dto.SessionResponse;
import com.mentorspace.entity.Session;
import com.mentorspace.enums.Role;
import com.mentorspace.enums.SessionStatus;
import com.mentorspace.exception.ApiException;
import com.mentorspace.repository.SessionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class SessionService {

    private static final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RND = new SecureRandom();

    private final SessionRepository sessionRepository;

    public SessionService(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    @Transactional
    public SessionResponse createSession(UUID mentorId, Role role) {
        if (role != Role.MENTOR) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only mentors can create sessions");
        }
        Session s = Session.builder()
                .mentorId(mentorId)
                .status(SessionStatus.WAITING)
                .joinCode(generateUniqueJoinCode())
                .build();
        return SessionResponse.from(sessionRepository.save(s));
    }

    @Transactional
    public SessionResponse joinSession(UUID studentId, Role role, String joinCode) {
        if (role != Role.STUDENT) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only students can join via join code");
        }
        Session s = sessionRepository.findByJoinCode(joinCode.toUpperCase())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invalid join code"));

        if (s.getStatus() == SessionStatus.ENDED) {
            throw new ApiException(HttpStatus.GONE, "This session has already ended");
        }
        if (s.getStudentId() != null && !s.getStudentId().equals(studentId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Session already has a student");
        }
        if (s.getMentorId().equals(studentId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mentor cannot join their own session as student");
        }
        s.setStudentId(studentId);
        s.setStatus(SessionStatus.ACTIVE);
        return SessionResponse.from(sessionRepository.save(s));
    }

    public SessionResponse getSession(UUID sessionId, UUID requesterId) {
        Session s = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Session not found"));
        ensureParticipant(s, requesterId);
        return SessionResponse.from(s);
    }

    @Transactional
    public SessionResponse endSession(UUID sessionId, UUID requesterId, Role role) {
        Session s = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Session not found"));
        if (role != Role.MENTOR || !s.getMentorId().equals(requesterId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the owning mentor can end this session");
        }
        s.setStatus(SessionStatus.ENDED);
        s.setEndedAt(Instant.now());
        return SessionResponse.from(sessionRepository.save(s));
    }

    public List<SessionResponse> mySessions(UUID userId) {
        return sessionRepository
                .findByMentorIdOrStudentIdOrderByCreatedAtDesc(userId, userId)
                .stream()
                .map(SessionResponse::from)
                .toList();
    }

    public void ensureParticipant(Session s, UUID userId) {
        boolean isMentor = s.getMentorId().equals(userId);
        boolean isStudent = s.getStudentId() != null && s.getStudentId().equals(userId);
        if (!isMentor && !isStudent) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not a participant of this session");
        }
    }

    public Session loadAndCheckParticipant(UUID sessionId, UUID userId) {
        Session s = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Session not found"));
        ensureParticipant(s, userId);
        return s;
    }

    private String generateUniqueJoinCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            char[] buf = new char[6];
            for (int i = 0; i < 6; i++) {
                buf[i] = ALPHABET.charAt(RND.nextInt(ALPHABET.length()));
            }
            String code = new String(buf);
            if (!sessionRepository.existsByJoinCode(code)) return code;
        }
        throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not generate unique join code");
    }
}
