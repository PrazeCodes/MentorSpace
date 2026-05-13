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

### Production TURN — checklist

> **Do not ship Open Relay credentials.** Open Relay (`openrelay.metered.ca`) is free, public, and rate-limited — fine for dev, not for production traffic.

Choose **one** of:

**Option A — Metered.ca paid plan (fastest path)**
1. Sign up at <https://www.metered.ca/tools/openrelay/> → pick a plan.
2. Create a TURN credential set (a `username` + `password`).
3. Put them in your deploy platform's secret store (Vercel/Netlify/Railway/etc.) — **not** in source control.
4. At deploy time, set:
   ```
   NEXT_PUBLIC_TURN_URL=turn:<your-subdomain>.metered.live:443
   NEXT_PUBLIC_TURN_USERNAME=<rotating-username>
   NEXT_PUBLIC_TURN_PASSWORD=<rotating-password>
   ```
5. Rotate credentials on a schedule (the Metered dashboard supports static long-term and short-lived REST-auth tokens).

**Option B — self-hosted coturn (cheapest, full control)**
1. Provision a VM with a public IP (e.g. 1 vCPU / 1 GB) and open UDP/TCP 3478, 5349, and a relay port range (default 49152–65535).
2. Install coturn:
   ```bash
   sudo apt-get install -y coturn
   sudo systemctl enable coturn
   ```
3. Minimal `/etc/turnserver.conf`:
   ```ini
   listening-port=3478
   tls-listening-port=5349
   fingerprint
   lt-cred-mech
   realm=yourdomain.com
   user=mentorspace:STRONG_RANDOM_PASSWORD
   no-cli
   no-loopback-peers
   no-multicast-peers
   cert=/etc/letsencrypt/live/turn.yourdomain.com/fullchain.pem
   pkey=/etc/letsencrypt/live/turn.yourdomain.com/privkey.pem
   ```
4. (Recommended) Switch to short-lived REST-auth credentials so passwords never end up in `NEXT_PUBLIC_*` long-term: add `use-auth-secret` + `static-auth-secret=...` to `turnserver.conf`, then expose a small `/api/turn-credentials` endpoint in Spring that returns `{ urls, username, credential }` minted from the secret. Update `useWebRTC.ts` to fetch this endpoint instead of reading the `NEXT_PUBLIC_*` env vars. (Not in MVP scope — happy to wire it up on request.)
5. Set `NEXT_PUBLIC_TURN_URL=turn:turn.yourdomain.com:5349?transport=tcp` in your platform's secret store.

### Rotation & secret hygiene

- `frontend/.env.local` is gitignored (`.env*.local` pattern). Never `git add -f` it.
- Anything prefixed `NEXT_PUBLIC_` is inlined into the client bundle at build time and is therefore **public**. Treat TURN creds as low-trust shared credentials and rotate frequently, or move to ephemeral REST-auth (Option B step 4).
- For production environments, store all values in your deploy platform's encrypted secrets, not on disk.

## Notes

- The Monaco editor is imported with `dynamic(() => import('@monaco-editor/react'), { ssr: false })` to avoid SSR issues.
- Every interactive element has a `data-testid` for end-to-end testing.
