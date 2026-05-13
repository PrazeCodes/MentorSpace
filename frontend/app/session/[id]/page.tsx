'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Copy, DoorOpen } from 'lucide-react';
import axios from 'axios';
import Header from '@/components/Header';
import VideoPanel from '@/components/VideoPanel';
import CodeEditor from '@/components/CodeEditor';
import ChatPanel from '@/components/ChatPanel';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useStomp } from '@/hooks/useStomp';
import { useChat } from '@/hooks/useChat';
import { useCodeSync } from '@/hooks/useCodeSync';
import { useWebRTC } from '@/hooks/useWebRTC';
import type { PresenceFrame, SessionDto } from '@/types';

export default function SessionRoomPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sessionId = params.id;
  const { token, user } = useAuthStore();

  const [session, setSession] = useState<SessionDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [presence, setPresence] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // 1) auth guard
  useEffect(() => {
    if (!token) router.replace('/');
  }, [token, router]);

  // 2) load session
  useEffect(() => {
    if (!token || !sessionId) return;
    api.get<SessionDto>(`/api/sessions/${sessionId}`)
      .then((r) => setSession(r.data))
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          setLoadError(err.response?.data?.message || err.message);
        } else {
          setLoadError('Could not load session');
        }
      });
  }, [token, sessionId]);

  // 3) Stomp client + hooks (always called in same order)
  const stomp = useStomp(token);
  const myUserId = user?.id ?? '';
  const myName = user?.name ?? 'You';

  const chat = useChat(stomp, sessionId, myUserId);
  const code = useCodeSync(stomp, sessionId, myUserId);
  const rtc = useWebRTC(stomp, sessionId, myUserId);

  // 4) Presence: announce join + subscribe to leave/join
  useEffect(() => {
    if (!stomp.connected || !sessionId) return;
    const unsub = stomp.subscribe(`/topic/session/${sessionId}/presence`, (frame) => {
      try {
        const p = JSON.parse(frame.body) as PresenceFrame;
        if (p.userId === myUserId) return;
        setPresence(`${p.userName ?? 'Peer'} ${p.event === 'join' ? 'joined' : 'left'} the room`);
        setTimeout(() => setPresence(''), 3500);
      } catch {
        /* ignore */
      }
    });
    stomp.publish('/app/join', { sessionId });
    return () => unsub();
  }, [stomp.connected, sessionId, myUserId, stomp]);

  const isMentor = useMemo(() => session && user && session.mentorId === user.id, [session, user]);

  const endSession = async () => {
    if (!session) return;
    if (!confirm('End this session for everyone? This can\'t be undone.')) return;
    try {
      await api.post(`/api/sessions/${session.id}/end`);
      router.push('/dashboard');
    } catch (err) {
      alert(axios.isAxiosError(err) ? err.response?.data?.message ?? err.message : 'Could not end session');
    }
  };

  const copyJoinCode = async () => {
    if (!session) return;
    try {
      await navigator.clipboard.writeText(session.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen flex-col bg-ink-50" data-testid="session-room">
      <Header />

      <div className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-8 py-3">
          <div className="flex items-center gap-4">
            <div>
              <div className="codey text-[10px] uppercase tracking-widest text-ink-500">
                Session
              </div>
              <div className="font-display text-xl">
                Room <span className="codey">{session?.joinCode ?? '······'}</span>
              </div>
            </div>
            {session && (
              <button
                onClick={copyJoinCode}
                className="btn-outline"
                data-testid="copy-code-btn"
              >
                <Copy className="h-4 w-4" /> {copied ? 'Copied!' : 'Copy join code'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="codey text-xs text-ink-500" data-testid="stomp-status">
              {stomp.connected ? '● Connected' : '○ Connecting…'}
            </span>
            {isMentor && session?.status !== 'ENDED' && (
              <button
                onClick={endSession}
                className="btn-outline border-accent text-accent hover:bg-accent-soft"
                data-testid="end-session-btn"
              >
                <DoorOpen className="h-4 w-4" /> End session
              </button>
            )}
          </div>
        </div>
        {presence && (
          <div
            className="border-t border-ink-200 bg-ink-100 px-8 py-1 text-center text-xs text-ink-700"
            data-testid="presence-banner"
          >
            {presence}
          </div>
        )}
      </div>

      {loadError ? (
        <div className="m-8 card max-w-lg p-6 text-sm text-ink-700" data-testid="session-error">
          {loadError}
        </div>
      ) : (
        <div className="grid flex-1 grid-rows-[1fr_320px]" data-testid="session-grid">
          <div className="grid grid-cols-2">
            <VideoPanel
              localStream={rtc.localStream}
              remoteStream={rtc.remoteStream}
              phase={rtc.phase}
              error={rtc.error}
              onStart={() => rtc.startLocalMedia().catch(() => {})}
              onCall={() => rtc.callPeer().catch(() => {})}
            />
            <CodeEditor
              value={code.content}
              loaded={code.loaded}
              onChange={code.onLocalChange}
            />
          </div>
          <ChatPanel
            messages={chat.messages}
            myUserId={myUserId}
            myName={myName}
            onSend={chat.send}
          />
        </div>
      )}
    </div>
  );
}
