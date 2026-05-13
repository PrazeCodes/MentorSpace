# MentorSpace Backend (Spring Boot)

Spring Boot 3.2 + Java 17 + PostgreSQL + Spring Security (JWT) + Spring WebSocket (STOMP/SockJS).

## Prerequisites

- **Java 17+**
- **Maven 3.9+** (or use the IDE's bundled Maven)
- **PostgreSQL 13+** running locally (or any reachable instance)

## Setup

1. **Create the database:**
   ```bash
   createdb mentorspace
   ```

2. **Copy `.env.example` to `.env` and fill in your values:**
   ```bash
   cp .env.example .env
   ```

   At minimum set:
   - `DATABASE_URL` (e.g. `jdbc:postgresql://localhost:5432/mentorspace`)
   - `DATABASE_USERNAME`, `DATABASE_PASSWORD`
   - `JWT_SECRET` — generate with `openssl rand -base64 64` (must be ≥ 32 chars)
   - `CORS_ALLOWED_ORIGINS=http://localhost:3000`

3. **Export env vars and run:**
   ```bash
   set -a; source .env; set +a
   ./mvnw spring-boot:run
   # or:
   mvn spring-boot:run
   ```

The server starts on `http://localhost:8080`.

JPA `ddl-auto=update` will auto-create tables on first run.

## REST API

All `/api/**` routes require `Authorization: Bearer <jwt>` **except**:
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET  /api/health`

| Method | Path | Notes |
|---|---|---|
| POST | /api/auth/signup | `{email,name,password,role}` → `{token,refreshToken,user}` |
| POST | /api/auth/login | `{email,password}` → `{token,refreshToken,user}` |
| POST | /api/auth/refresh | `{refreshToken}` → new tokens |
| GET  | /api/auth/me | current user from JWT |
| POST | /api/sessions/create | MENTOR only |
| POST | /api/sessions/join | STUDENT only — `{joinCode}` |
| GET  | /api/sessions/{id} | participants only |
| POST | /api/sessions/{id}/end | mentor of session only |
| GET  | /api/sessions/my | sessions for current user |
| GET  | /api/sessions/{id}/messages | last 200 (chronological) |
| GET  | /api/sessions/{id}/code | latest code snapshot |

## WebSocket (STOMP over SockJS)

- Endpoint: `ws://localhost:8080/ws?token=<JWT>` (SockJS URL: `http://localhost:8080/ws`)
- Token must be passed as **query param**; validated in `JwtHandshakeInterceptor`.

### Client → server destinations

| Destination | Payload | Behavior |
|---|---|---|
| `/app/chat` | `{ sessionId, content }` | persists Message; broadcasts on `/topic/session/{id}/chat` |
| `/app/code` | `{ sessionId, content }` | broadcasts on `/topic/session/{id}/code` (every keystroke); DB upsert debounced to once / 5 s per session |
| `/app/signal` | `{ sessionId, type, sdp?, candidate? }` | **never persisted** — relayed on `/topic/session/{id}/signal` |
| `/app/join` | `{ sessionId }` | broadcasts presence "join" on `/topic/session/{id}/presence` |

The server stamps each outbound payload with `senderId` so clients can skip their own echoes.

On WebSocket disconnect, server emits `{ event: "leave" }` on the presence topic.

## Security

- **BCrypt** password hashing (strength 12)
- **JWT** access token (1 h) + **refresh token** (7 d) signed HS256
- Stateless sessions, role-based authorization (`ROLE_MENTOR` / `ROLE_STUDENT`)
- **Rate limiting** on `/api/auth/login` and `/api/auth/signup` — 5 / min / IP (Bucket4j, in-memory)
- CORS restricted to configured origins; no wildcards in production
- Method-level `@PreAuthorize` on mentor-only endpoints
- Every WebSocket message authorizes the session participant before broadcast/persist
- WebRTC signaling is **relay-only** — backend never sees media bytes

## Notes

- For production, replace the in-memory `RateLimitFilter` with a distributed store (Redis).
- For users on different networks, configure a **TURN server** in the frontend (`useWebRTC.ts`) — env vars `NEXT_PUBLIC_TURN_URL`, `NEXT_PUBLIC_TURN_USERNAME`, `NEXT_PUBLIC_TURN_PASSWORD`.
