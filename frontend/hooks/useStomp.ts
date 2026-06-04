'use client';

import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useEffect, useRef, useState } from 'react';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'https://mentorspace-backend-bo6p.onrender.com/ws';

export interface Stomp {
  client: Client | null;
  connected: boolean;
  subscribe: (destination: string, handler: (msg: IMessage) => void) => () => void;
  publish: (destination: string, body: unknown) => void;
}

/**
 * Opens one STOMP-over-SockJS connection authenticated by JWT (query param).
 * Returns a Stomp helper. Auto-reconnects.
 */
export function useStomp(token: string | null): Stomp {
  const clientRef = useRef<Client | null>(null);
  const subsRef = useRef<Map<string, StompSubscription>>(new Map());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;
    const url = `${WS_URL}?token=${encodeURIComponent(token)}`;
    const client = new Client({
      webSocketFactory: () => new SockJS(url),
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
    });
    client.onConnect = () => setConnected(true);
    client.onDisconnect = () => setConnected(false);
    client.onWebSocketClose = () => setConnected(false);
    client.onStompError = () => setConnected(false);

    client.activate();
    clientRef.current = client;

    return () => {
      subsRef.current.forEach((s) => s.unsubscribe());
      subsRef.current.clear();
      client.deactivate().catch(() => {});
      clientRef.current = null;
      setConnected(false);
    };
  }, [token]);

  const subscribe = (destination: string, handler: (msg: IMessage) => void) => {
    const client = clientRef.current;
    if (!client || !client.connected) {
      // Defer subscription until connected
      const id = setInterval(() => {
        const c = clientRef.current;
        if (c && c.connected) {
          clearInterval(id);
          const sub = c.subscribe(destination, handler);
          subsRef.current.set(destination, sub);
        }
      }, 200);
      return () => {
        clearInterval(id);
        const existing = subsRef.current.get(destination);
        if (existing) {
          existing.unsubscribe();
          subsRef.current.delete(destination);
        }
      };
    }
    const sub = client.subscribe(destination, handler);
    subsRef.current.set(destination, sub);
    return () => {
      sub.unsubscribe();
      subsRef.current.delete(destination);
    };
  };

  const publish = (destination: string, body: unknown) => {
    const client = clientRef.current;
    if (!client || !client.connected) return;
    client.publish({ destination, body: JSON.stringify(body) });
  };

  return { client: clientRef.current, connected, subscribe, publish };
}
