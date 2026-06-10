# Queue Cure '26

Real-time clinic queue management for the Wooble Hackathon 2026 — Full Stack Track.

Replace paper token slips with a live digital queue. Receptionists register patients and call tokens; the patient waiting room updates instantly via WebSockets.

## PRD Coverage

| Requirement | Status |
|-------------|--------|
| Register patient (name + phone) | ✅ |
| Auto-assign token, call next, avg time | ✅ |
| Live waiting list + statuses | ✅ |
| Reset queue for new day | ✅ |
| Patient NOW SERVING display | ✅ |
| Token lookup, tokens ahead, ETA | ✅ |
| WebSocket sync (no polling) | ✅ |
| Receptionist PIN protection | ✅ |
| Printable token slip | ✅ |
| Daily analytics dashboard | ✅ |
| SQLite + REST API | ✅ |
| Deploy configs (Railway/Render) | ✅ |

## Architecture

```
Call Next → POST /api/queue/next → SQLite → WS broadcast → all clients update
```

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | SQLite |
| Realtime | WebSockets (`ws`) |

## Quick Start

```bash
npm install
npm run dev
```

| Screen | URL | Auth |
|--------|-----|------|
| Receptionist | http://localhost:5173 | PIN: `1234` (default) |
| Patient display | http://localhost:5173/patient | Public |

## API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/verify` | — | Verify receptionist PIN |
| POST | `/api/patients` | PIN | Register patient |
| GET | `/api/queue` | — | Current queue state |
| POST | `/api/queue/next` | PIN | Advance queue + broadcast |
| POST | `/api/queue/settings` | PIN | Update avg consultation time |
| GET | `/api/patients/:token` | — | Patient lookup + ETA |
| POST | `/api/queue/reset` | PIN | Reset for new day |
| GET | `/api/analytics` | PIN | Daily stats |
| WS | `/queue/live` | — | Live queue push |

Protected routes require header: `X-Receptionist-Pin: <pin>`

## Environment

Copy `.env.example` and set:

```bash
PORT=3001
DATABASE_PATH=server/data/queuecure.db
RECEPTIONIST_PIN=1234
```

## Scripts

```bash
npm run dev          # API :3001 + Vite :5173
npm run build        # Production frontend
npm start            # Serve API + built frontend
npm test             # Queue service unit tests
```

## Deploy (single service)

**Railway / Render** — build frontend, run Express:

```bash
npm install && npm run build && npm start
```

Configs included: `railway.toml`, `render.yaml`

For separate frontend deploy (Vercel/Netlify), proxy `/api` and `/queue/live` to your backend URL.

## Demo Flow

1. Open Receptionist View → enter PIN `1234`
2. Register patients → print token slip
3. Open `/patient` on a second screen (no PIN needed)
4. Enter token on patient view → see ETA
5. Click **Call Next** → both screens update instantly
6. Check **Today's Analytics** for patients seen and peak hour

## License

Wooble Hackathon 2026 submission.
