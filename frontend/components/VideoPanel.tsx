'use client';

import { useEffect, useRef } from 'react';
import { Video as VideoIcon, MicOff } from 'lucide-react';
import type { MediaStreamLike } from '@/components/types-shim';

interface Props {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  phase: 'idle' | 'connecting' | 'connected' | 'failed' | 'closed';
  onStart: () => void;
  onCall: () => void;
  error: string | null;
}

export default function VideoPanel(props: Props) {
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (localRef.current && props.localStream) {
      localRef.current.srcObject = props.localStream as unknown as MediaProvider;
    }
  }, [props.localStream]);

  useEffect(() => {
    if (remoteRef.current && props.remoteStream) {
      remoteRef.current.srcObject = props.remoteStream as unknown as MediaProvider;
    }
  }, [props.remoteStream]);

  return (
    <div className="flex h-full flex-col bg-ink-900 text-ink-50">
      <div className="flex items-center justify-between border-b border-ink-700 px-4 py-2">
        <div className="codey text-[11px] uppercase tracking-widest text-ink-300">Video</div>
        <PhaseBadge phase={props.phase} />
      </div>

      <div className="grid flex-1 grid-cols-1 gap-2 p-2 sm:grid-cols-2">
        <Tile label="You" stream={props.localStream} videoRef={localRef} muted />
        <Tile label="Peer" stream={props.remoteStream} videoRef={remoteRef} />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-ink-700 px-4 py-3">
        <div className="text-xs text-ink-300">
          {props.error
            ? <span className="text-accent-soft">{props.error}</span>
            : 'P2P video via WebRTC · signaling over WebSocket'}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={props.onStart}
            className="btn-outline border-ink-700 bg-transparent text-ink-50 hover:bg-ink-700"
            data-testid="video-enable-btn"
          >
            <VideoIcon className="h-4 w-4" /> Enable camera
          </button>
          <button
            type="button"
            onClick={props.onCall}
            className="btn-accent"
            data-testid="video-call-btn"
          >
            Call peer
          </button>
        </div>
      </div>
    </div>
  );
}

function Tile({
  label,
  stream,
  videoRef,
  muted,
}: {
  label: string;
  stream: MediaStreamLike | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  muted?: boolean;
}) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-black" data-testid={`video-tile-${label.toLowerCase()}`}>
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={!!muted}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-ink-500">
          <div className="flex flex-col items-center gap-2">
            <MicOff className="h-6 w-6" />
            <span className="codey text-[11px] uppercase tracking-widest">No stream</span>
          </div>
        </div>
      )}
      <span className="codey absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] uppercase tracking-widest text-ink-50">
        {label}
      </span>
    </div>
  );
}

function PhaseBadge({ phase }: { phase: Props['phase'] }) {
  const map: Record<Props['phase'], { text: string; cls: string }> = {
    idle: { text: 'Idle', cls: 'bg-ink-700 text-ink-200' },
    connecting: { text: 'Connecting', cls: 'bg-accent-soft text-ink-900' },
    connected: { text: 'Live', cls: 'bg-moss-soft text-moss' },
    failed: { text: 'Failed', cls: 'bg-accent text-white' },
    closed: { text: 'Closed', cls: 'bg-ink-700 text-ink-200' },
  };
  const { text, cls } = map[phase];
  return (
    <span className={`codey rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-widest ${cls}`} data-testid="video-phase-badge">
      {text}
    </span>
  );
}
