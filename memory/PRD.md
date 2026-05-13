# MentorSpace — Product Requirements Document

## Original problem statement (user's choices)

Build a full-stack 1-on-1 mentorship web application called "MentorSpace" using:

- **Backend:** Java Spring Boot + PostgreSQL + Spring Security + Spring WebSocket
- **Frontend:** Next.js (TypeScript) + Tailwind + Zustand + STOMP/SockJS + Monaco
- **WebRTC TURN:** Free TURN provider (Open Relay / Metered) — STUN only by default; TURN via env vars
- **Auth:** JWT (custom, bcrypt + access + refresh tokens)
- **Supabase placeholders:** included in `.env.example` for future use

## Architecture

```
┌──────────────────────────────┐         ┌────────────────────────────────┐
│   Next.js 14 (App Router)    │  REST   │   Spring Boot 3.2 (Java 17)   │
│   • Tailwind                 │ ──────► │   • Spring Security (JWT)     │
│   • Zustand (persisted)      │ ◄────── │   • Spring Data JPA            │
│   • @stomp/stompjs + SockJS  │  STOMP  │   • Spring WebSocket (STOMP)   │
│   • Monaco editor            │ ◄─────► │   • Bucket4j rate limit        │
│   • Plain WebRTC             │ signal  │   • PostgreSQL                 │
└──────────────────────────────┘         └────────────────────────────────┘
                                                   │
                                                   ▼
                                              PostgreSQL
                                  (users, sessions, messages, code_snapshots)
```

## User personas

- **Mentor** — creates sessions, gets a 6-char join code to share, can end the session.
- **Student** — joins an existing session via a 6-char join code.

## Core MVP requirements (static)

1. User signup/login with JWT (role: MENTOR or STUDENT)
2. Mentor creates session → gets 6-char alphanumeric join code (unique)
3. Student joins session via join code (state transitions WAITING → ACTIVE)
4. Real-time chat (WebSocket; messages persisted; history endpoint returns last 200 chronologically)
5. Shared code editor (Monaco, WS sync at 300 ms debounce; DB upsert debounced to 5 s server-side)
6. WebRTC 1-on-1 video (offer/answer/ICE relayed by `/app/signal`, **never persisted**)
7. End session (mentor only) → status ENDED, ended_at set

## Security

- BCrypt strength 12; JWT HS256, access 1 h + refresh 7 d
- `JWT_SECRET` ≥ 32 chars (validated at startup)
- Rate limit on `/api/auth/login` & `/api/auth/signup` — 5 / min / IP (Bucket4j in-memory)
- CORS restricted to configured origins (no wildcards)
- Method-level `@PreAuthorize("hasRole('MENTOR')")` on mentor-only endpoints
- Every WebSocket frame re-validates session participation (`SessionService.loadAndCheckParticipant`)
- WebRTC backend never sees media — signaling only
- Input validation with `jakarta.validation` annotations
- JPA parameterized queries; no string SQL anywhere
- Global `@ControllerAdvice` returns sanitized error responses

## Implemented (as of 2026-02-13)

### Backend (43 Java files)

- Entities: `User`, `Session`, `Message`, `CodeSnapshot` (UUID PKs, JPA)
- Repositories: 4 Spring Data JPA interfaces
- Security: `JwtService`, `JwtAuthFilter`, `JwtHandshakeInterceptor`, `RateLimitFilter`, `SecurityConfig`, `CustomUserDetailsService`
- REST: `AuthController` (signup/login/refresh/me), `SessionController` (create/join/get/end/my/messages/code), `HealthController`
- WebSocket: `WebSocketConfig`, `ChatWsController`, `CodeWsController`, `SignalWsController`, `PresenceWsController`, `WsDisconnectListener`
- Service layer: `AuthService`, `SessionService`, `CodeSnapshotService` (with 5 s debounce)
- DTOs: 11 request/response/payload classes
- Exceptions: `ApiException`, `GlobalExceptionHandler`

### Frontend (Next.js TS)

- App Router: `/`, `/dashboard`, `/session/[id]`
- Components: `AuthForm`, `Header`, `SessionList`, `VideoPanel`, `CodeEditor` (Monaco dynamic import), `ChatPanel`
- Hooks: `useStomp`, `useChat`, `useCodeSync`, `useWebRTC`
- Lib: `api` (axios + JWT interceptor + 401 logout), `store` (Zustand persisted auth)
- Types: shared TS types matching backend DTOs
- Tailwind theme: paper-and-ink palette (Fraunces display, Geist sans, JetBrains Mono)
- All interactive elements have `data-testid`
- Builds clean: 5 routes, no errors, 1 minor font preconnect warning

## Verified

- ✅ `mvn compile` — 48 classes generated, 0 errors
- ✅ `yarn build` — 5 routes built, 0 errors
- ✅ `yarn lint` — clean (1 minor font warning, non-blocking)
- ✅ `npx tsc --noEmit` — clean
- ✅ **End-to-end smoke test against running stack**:
  - PostgreSQL 15 + Spring Boot on :8082 + Next.js dev on :3000
  - Mentor signup → JWT issued; bad password → 401; rate limit triggers at 6th attempt → 429
  - Mentor creates session → 6-char code (verified: `8I17FK`, `DLKTNE`, etc.); student joins → ACTIVE
  - Student trying to create → 403; wrong join code → 404; invalid role enum → 400
  - Chat: real-time send / receive in both directions; history persisted; visible across two browser contexts
  - Monaco code editor: mentor types → renders with syntax highlighting; **trailing-edge debounce flushes to DB**; student joining later loads persisted code; subsequent typing syncs both ways in real time (echo skipped via senderId)
  - Presence: "X joined the room" banner shown on the other tab
  - End session: mentor only; status flips to `ENDED`; dashboard shows badge
  - **WebRTC signaling relay (Node STOMP harness)**: offer + ICE candidate relayed with server-stamped `senderId`; backend never persists signal payloads (verified `/code` endpoint stays empty)

## Bug fixed during smoke test

- `CodeSnapshotService`: original throttle-style debounce dropped the trailing keystrokes, so a late-joining student fetched an empty snapshot. Rewrote to **trailing-edge debounce + in-memory cache**:
  - Every code frame updates a `ConcurrentHashMap<UUID,String> latest` cache.
  - The first frame schedules a single `ScheduledFuture` `debounceMs` in the future; subsequent frames don't re-schedule but always overwrite `latest`.
  - When the timer fires, it writes the **latest** value to the DB and removes the pending entry.
  - `getContent()` reads cache-first, falling back to DB, so late joiners see the latest state immediately without waiting for the flush.
- `GlobalExceptionHandler`: added handler for `HttpMessageNotReadableException` — invalid JSON / unknown enum now returns 400 instead of 500.

## Next action items (prioritized backlog)

P1 (when user runs locally):
- Provision PostgreSQL, fill `backend/.env`, run `mvn spring-boot:run`
- Run `yarn dev` in `frontend/`
- Test signup/login → create/join session → chat / code / video flow

P2 (post-MVP enhancements):
- Email verification (templates + Resend or SendGrid)
- Password reset flow with one-time tokens
- File upload in chat (object storage)
- TURN server credentials provisioning UI
- Multiple students per session / breakout rooms
- Session recording (capture WebRTC stream)
- Mobile responsive layout
- Dark / light theme toggle
- E2E tests with Playwright

P3 (productization):
- Stripe checkout + paid mentor scheduling
- Public mentor directory with availability
- Admin dashboard

## Files & paths

```
/app
├── backend/        # Spring Boot Maven project (.env.example present, .env required)
└── frontend/       # Next.js 14 TS project (.env.example present, .env.local required)
```
