# Queue Cure '26

Real-time clinic queue management for the Wooble Hackathon 2026 (Full Stack Track).

Replace paper token slips with a digital queue that keeps the **Receptionist View** and **Patient Waiting Room View** in sync within seconds.

## Features

- **Receptionist View** (`/`) — add patients, call next token, set average consultation time, live queue list
- **Patient View** (`/patient`) — large NOW SERVING display, optional token lookup, ETA, queue stats
- **Real-time sync** — polls shared storage every 2 seconds (cross-tab / cross-device on Wooble)
- **Persistent state** — survives page refresh via `window.storage` (Wooble) or `localStorage` (local dev)

## Tech Stack

- React (functional components + hooks)
- Tailwind CSS
- React Router
- `window.storage` API with `localStorage` fallback

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) for the Receptionist View and [http://localhost:5173/patient](http://localhost:5173/patient) for the Patient View.

For local testing, open both URLs in separate browser tabs — they sync via `localStorage`.

## Build

```bash
npm run build
npm run preview
```

## Demo Script

1. Open Receptionist View and set average consultation time (e.g. 8 min).
2. Add 3–4 patients quickly.
3. Open Patient View in a second tab or on another device.
4. Enter a token number on the Patient View to see ETA.
5. Press **Call Next Token** on the Receptionist View — both screens update within 2 seconds.
6. Refresh either tab — queue state persists.

## Data Model

State is stored under `queuecure:state`:

```json
{
  "clinicName": "Queue Cure Clinic",
  "currentToken": 0,
  "nextTokenNumber": 1,
  "avgConsultationTime": 10,
  "queue": [{ "tokenNumber": 1, "patientName": "Ramesh", "addedAt": "..." }],
  "lastUpdated": "2026-06-11T10:00:00.000Z"
}
```

## License

Hackathon submission — Wooble 2026.
