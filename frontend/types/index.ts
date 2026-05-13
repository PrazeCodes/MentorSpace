export type Role = 'MENTOR' | 'STUDENT';
export type SessionStatus = 'WAITING' | 'ACTIVE' | 'ENDED';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt?: string | null;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: AppUser;
}

export interface SessionDto {
  id: string;
  mentorId: string;
  studentId: string | null;
  status: SessionStatus;
  joinCode: string;
  createdAt: string;
  endedAt: string | null;
}

export interface MessageDto {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export interface ChatOutbound {
  sessionId: string;
  content: string;
}

export interface CodeFrame {
  sessionId: string;
  content: string;
  senderId?: string;
}

export interface SignalFrame {
  sessionId: string;
  senderId?: string;
  type: 'offer' | 'answer' | 'ice-candidate';
  sdp?: RTCSessionDescriptionInit | unknown;
  candidate?: RTCIceCandidateInit | unknown;
}

export interface PresenceFrame {
  sessionId: string;
  userId: string;
  userName: string;
  event: 'join' | 'leave';
}
