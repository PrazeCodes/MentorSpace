'use client';

import { useEffect, useRef, useState } from 'react';
import type { Stomp } from './useStomp';
import type { MessageDto, ChatOutbound } from '@/types';
import { api } from '@/lib/api';

export function useChat(stomp: Stomp, sessionId: string, myUserId: string) {
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const seenIds = useRef<Set<string>>(new Set());

  // Load history
  useEffect(() => {
    let cancelled = false;
    api.get<MessageDto[]>(`/api/sessions/${sessionId}/messages`)
      .then((r) => {
        if (cancelled) return;
        seenIds.current = new Set(r.data.map((m) => m.id));
        setMessages(r.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Subscribe to live chat
  useEffect(() => {
    if (!stomp.connected) return;
    const unsub = stomp.subscribe(`/topic/session/${sessionId}/chat`, (frame) => {
      try {
        const m = JSON.parse(frame.body) as MessageDto;
        if (seenIds.current.has(m.id)) return;
        seenIds.current.add(m.id);
        setMessages((prev) => [...prev, m]);
      } catch {
        /* ignore */
      }
    });
    return () => unsub();
  }, [stomp.connected, sessionId]);

  const send = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const payload: ChatOutbound = { sessionId, content: trimmed };
    stomp.publish('/app/chat', payload);
  };

  return { messages, send, myUserId };
}
