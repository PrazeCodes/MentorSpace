# MentorSpace Frontend (Next.js + TypeScript)

Next.js 14 (App Router) + TypeScript + Tailwind CSS + Zustand + STOMP/SockJS + Monaco.

## Prerequisites

- **Node.js 18.18+** (Node 20 recommended)
- **Yarn** (preferred — Emergent stack convention)

## Setup

1. Copy `.env.example` to `.env.local` and fill in:

   ```bash
   cp .env.example .env.local
   ```

   - `NEXT_PUBLIC_API_URL=http://localhost:8080` (your Spring Boot backend)
   - `NEXT_PUBLIC_WS_URL=http://localhost:8080/ws`
   - `NEXT_PUBLIC_TURN_URL=…` (optional — for users on different networks)

2. Install + run:

   ```bash
   yarn
   yarn dev
   ```

   App opens at `http://localhost:3000`.

## Build

```bash
yarn build
yarn start
```

## Structure

```
app/
  layout.tsx              ← root html + font preconnect
  page.tsx                ← landing + auth (login/signup)
  dashboard/page.tsx      ← create / join session, list past sessions
  session/[id]/page.tsx   ← 4-panel room (video | code / chat)
  globals.css             ← Tailwind + design tokens
components/
  AuthForm.tsx
  Header.tsx
  SessionList.tsx
  VideoPanel.tsx          ← local + remote <video>
  CodeEditor.tsx          ← Monaco, dynamic import (ssr: false)
  ChatPanel.tsx
hooks/
  useStomp.ts             ← single STOMP/SockJS client, auto-reconnect
  useChat.ts              ← history + live, dedupes by message id
  useCodeSync.ts          ← 300 ms debounce; ignores own echoes
  useWebRTC.ts            ← peer connection, signaling via /app/signal
lib/
  api.ts                  ← Axios instance + JWT interceptor + 401 logout
  store.ts                ← Zustand auth store, persisted in localStorage
types/index.ts            ← Shared API/WS types
```

## Connecting to the backend

- Auth: `POST /api/auth/signup` and `/api/auth/login` return `{ token, refreshToken, user }`.
  Token is stored in localStorage by Zustand `persist`.
- All `api` calls send `Authorization: Bearer <jwt>`. A 401 triggers logout + redirect to `/`.
- WebSocket: `useStomp` connects to `${NEXT_PUBLIC_WS_URL}?token=<jwt>` via SockJS.
  Server validates the token at handshake.

## STOMP topics & destinations

| Direction | Destination | Notes |
|---|---|---|
| → server | `/app/chat`   | `{ sessionId, content }` — persists + broadcasts |
| → server | `/app/code`   | `{ sessionId, content }` — broadcasts every keystroke (debounced 300 ms client-side); server debounces DB writes |
| → server | `/app/signal` | WebRTC SDP / ICE — relay only |
| → server | `/app/join`   | presence announce |
| ← server | `/topic/session/{id}/chat` | new messages |
| ← server | `/topic/session/{id}/code` | remote code updates (carries `senderId`) |
| ← server | `/topic/session/{id}/signal` | WebRTC SDP / ICE |
| ← server | `/topic/session/{id}/presence` | join / leave events |

## WebRTC

- STUN: `stun:stun.l.google.com:19302`
- For users on different networks, add a TURN entry by setting `NEXT_PUBLIC_TURN_URL`, `NEXT_PUBLIC_TURN_USERNAME`, `NEXT_PUBLIC_TURN_PASSWORD`. Use a hosted TURN provider (e.g. Open Relay / Metered).

## Notes

- The Monaco editor is imported with `dynamic(() => import('@monaco-editor/react'), { ssr: false })` to avoid SSR issues.
- Every interactive element has a `data-testid` for end-to-end testing.
