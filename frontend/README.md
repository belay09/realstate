# Belay Properties frontend

Vite + React 19 + TypeScript + Tailwind CSS v4 + React Router + TanStack Query + Axios.

## Run locally

1. Start the API (e.g. `docker compose up` from the repo root so Postgres and the API run, with CORS allowing `http://localhost:5173`).
2. Copy env and install:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

3. Open `http://localhost:5173`. Public listings use `GET /public/listings`; admin uses JWT from `POST /auth/login`.

## Build

```bash
npm run build
```

Output in `dist/`, suitable for static hosting or Nginx in front of the API.
