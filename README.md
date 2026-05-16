# MentorSpace

A 1-on-1 mentorship web application: a shared code editor, real-time chat, and 1-on-1 WebRTC video — joined by a single 6-character code.

- **Backend:** Java 21 · Spring Boot 3.2 · PostgreSQL · Spring Security (JWT) · Spring WebSocket (STOMP / SockJS)
- **Frontend:** Next.js 14 (App Router, TypeScript) · Tailwind CSS · Zustand · `@stomp/stompjs` + `sockjs-client` · `@monaco-editor/react`

## Quick start

```bash
# 1. Backend (Spring Boot)
cd backend
cp .env.example .env       # fill DATABASE_URL, DATABASE_USERNAME, DATABASE_PASSWORD, JWT_SECRET
set -a && source .env && set +a
mvn spring-boot:run        # http://localhost:8080

# 2. Frontend (Next.js)
cd frontend
cp .env.example .env.local # set NEXT_PUBLIC_API_URL=http://localhost:8080
yarn
yarn dev                   # http://localhost:3000
```

See [`backend/README.md`](backend/README.md) and [`frontend/README.md`](frontend/README.md) for full details on routes, WebSocket destinations, and configuration.

## MVP scope

- ✅ User signup/login with JWT (role: MENTOR or STUDENT)
- ✅ Mentor creates session → gets 6-char join code
- ✅ Student joins via join code
- ✅ Real-time chat (WebSocket, persisted)
- ✅ Shared code editor (Monaco + WebSocket sync)
- ✅ WebRTC 1-on-1 video (signaling via WebSocket, STUN; TURN optional)
- ✅ End session (mentor only)

## Security defaults

- BCrypt (strength 12) password hashing
- HS256 JWT access (1 h) + refresh (7 d), secret from `JWT_SECRET`
- Rate limit on `/api/auth/login` & `/api/auth/signup` — 5 / min / IP
- CORS restricted to `CORS_ALLOWED_ORIGINS`
- Method-level `@PreAuthorize` enforces mentor-only endpoints
- Every WebSocket frame re-validates the session participant
- WebRTC: backend relays SDP/ICE only — never sees media bytes

## TURN server — dev vs production

| | Use | Where to set |
|---|---|---|
| Dev / local testing | Open Relay (`turn:openrelay.metered.ca:443`, `openrelayproject` / `openrelayproject`) | `frontend/.env.local` (already gitignored) |
| Production | **Swap to your own coturn or a paid Metered.ca plan** and rotate credentials. Anything prefixed `NEXT_PUBLIC_` is baked into the client bundle and therefore public — treat the values as low-trust and rotate frequently, or move to ephemeral REST-auth credentials minted by a `/api/turn-credentials` endpoint on the backend. | Your deploy platform's encrypted secret store (Vercel, Railway, Fly, etc.) — **never commit** |

Full setup instructions in [`frontend/README.md`](frontend/README.md#production-turn--checklist), including a coturn `turnserver.conf` template and the path to ephemeral REST-auth credentials.

## Repo layout

```
/app
├── backend/               # Spring Boot (Maven)
│   ├── pom.xml
│   ├── .env.example
│   └── src/main/java/com/mentorspace/...
└── frontend/              # Next.js (TypeScript)
    ├── package.json
    ├── .env.example
    ├── app/
    ├── components/
    ├── hooks/
    ├── lib/
    └── types/
```
