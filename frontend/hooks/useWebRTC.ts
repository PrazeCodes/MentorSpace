'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Stomp } from './useStomp';
import type { SignalFrame } from '@/types';

const ICE_SERVERS: RTCIceServer[] = (() => {
  const list: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];
  const turn = process.env.NEXT_PUBLIC_TURN_URL;
  if (turn) {
    list.push({
      urls: turn,
      username: process.env.NEXT_PUBLIC_TURN_USERNAME || undefined,
      credential: process.env.NEXT_PUBLIC_TURN_PASSWORD || undefined,
    });
  }
  return list;
})();

type Phase = 'idle' | 'connecting' | 'connected' | 'failed' | 'closed';

export function useWebRTC(stomp: Stomp, sessionId: string, myUserId: string) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);

  const ensurePc = useCallback((): RTCPeerConnection => {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        const frame: SignalFrame = {
          sessionId,
          type: 'ice-candidate',
          candidate: e.candidate.toJSON(),
        };
        stomp.publish('/app/signal', frame);
      }
    };

    pc.ontrack = (e) => {
      const [stream] = e.streams;
      if (stream) setRemoteStream(stream);
    };

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === 'connected') setPhase('connected');
      else if (s === 'failed') setPhase('failed');
      else if (s === 'disconnected' || s === 'closed') setPhase('closed');
    };

    pcRef.current = pc;
    return pc;
  }, [sessionId, stomp]);

  const startLocalMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      const pc = ensurePc();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      return stream;
    } catch (e: any) {
      setError(e?.message || 'Could not access camera/microphone');
      throw e;
    }
  }, [ensurePc]);

  const callPeer = useCallback(async () => {
    setPhase('connecting');
    await startLocalMedia();
    const pc = ensurePc();
    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
    await pc.setLocalDescription(offer);
    const frame: SignalFrame = { sessionId, type: 'offer', sdp: offer };
    stomp.publish('/app/signal', frame);
  }, [ensurePc, sessionId, startLocalMedia, stomp]);

  // Subscribe to signaling
  useEffect(() => {
    if (!stomp.connected) return;
    const unsub = stomp.subscribe(`/topic/session/${sessionId}/signal`, async (frame) => {
      try {
        const sig = JSON.parse(frame.body) as SignalFrame;
        if (!sig || !sig.type) return;
        if (sig.senderId && sig.senderId === myUserId) return; // ignore own echo

        const pc = ensurePc();
        if (sig.type === 'offer') {
          setPhase('connecting');
          await startLocalMedia();
          await pc.setRemoteDescription(new RTCSessionDescription(sig.sdp as RTCSessionDescriptionInit));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          stomp.publish('/app/signal', { sessionId, type: 'answer', sdp: answer } as SignalFrame);
        } else if (sig.type === 'answer') {
          if (pc.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(sig.sdp as RTCSessionDescriptionInit));
          }
        } else if (sig.type === 'ice-candidate') {
          if (sig.candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(sig.candidate as RTCIceCandidateInit));
            } catch {
              /* ignore late ICE */
            }
          }
        }
      } catch (e) {
        // ignore malformed
      }
    });
    return () => unsub();
  }, [stomp.connected, sessionId, ensurePc, myUserId, startLocalMedia, stomp]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
      pcRef.current = null;
      localStreamRef.current = null;
    };
  }, []);

  return { localStream, remoteStream, phase, error, startLocalMedia, callPeer };
}
