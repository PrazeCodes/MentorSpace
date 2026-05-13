'use client';

import { useEffect, useRef, useState } from 'react';
import type { Stomp } from './useStomp';
import type { CodeFrame } from '@/types';
import { api } from '@/lib/api';

/**
 * Two-way code sync:
 *  - GET /api/sessions/{id}/code → initial content
 *  - Outbound: publish /app/code on every change, debounced 300 ms
 *  - Inbound: subscribe /topic/session/{id}/code; ignore messages where senderId == myUserId
 */
export function useCodeSync(stomp: Stomp, sessionId: string, myUserId: string) {
  const [content, setContent] = useState<string>('');
  const [loaded, setLoaded] = useState(false);
  const ignoreNextEcho = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    api.get<{ content: string }>(`/api/sessions/${sessionId}/code`)
      .then((r) => {
        if (cancelled) return;
        setContent(r.data?.content ?? '');
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Subscribe to remote updates
  useEffect(() => {
    if (!stomp.connected) return;
    const unsub = stomp.subscribe(`/topic/session/${sessionId}/code`, (frame) => {
      try {
        const f = JSON.parse(frame.body) as CodeFrame;
        if (f.senderId && f.senderId === myUserId) return; // ignore own echo
        ignoreNextEcho.current = true;
        setContent(f.content ?? '');
      } catch {
        /* ignore */
      }
    });
    return () => unsub();
  }, [stomp.connected, sessionId, myUserId]);

  const onLocalChange = (next: string) => {
    setContent(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      stomp.publish('/app/code', { sessionId, content: next });
    }, 300);
  };

  return { content, setContent, loaded, onLocalChange, ignoreNextEcho };
}
