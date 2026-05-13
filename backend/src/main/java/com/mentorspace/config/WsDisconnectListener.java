package com.mentorspace.config;

import com.mentorspace.controller.PresenceWsController;
import com.mentorspace.dto.PresencePayload;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;
import java.util.UUID;

@Component
public class WsDisconnectListener {

    private final SimpMessagingTemplate broker;

    public WsDisconnectListener(SimpMessagingTemplate broker) {
        this.broker = broker;
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        String wsId = event.getSessionId();
        Map<String, Object> info = PresenceWsController.WS_SESSIONS.remove(wsId);
        if (info == null) return;

        UUID userId = (UUID) info.get("userId");
        UUID sessionRoomId = (UUID) info.get("sessionRoomId");
        String userName = (String) info.get("userName");
        if (sessionRoomId == null || userId == null) return;

        PresencePayload out = new PresencePayload(sessionRoomId, userId, userName, "leave");
        broker.convertAndSend("/topic/session/" + sessionRoomId + "/presence", out);
    }
}
