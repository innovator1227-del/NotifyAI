# NotifyAI

NotifyAI is a MERN app organized as a React/Vite client and an Express/Mongoose API. The client uses Tailwind CSS, and JWT authentication protects workspace and AI endpoints.

## Project layout

- `client/src/App.jsx` — session verification and authenticated app entry.
- `client/src/pages/` — authentication, inbox, analytics, rules, summaries, integrations, settings, and help screens.
- `client/src/components/` — reusable dashboard, quick-add, notification details, and inbox components.
- `client/src/services/api.js` — shared Axios client with JWT handling.
- `server/src/routes/`, `controllers/`, `middleware/`, `models/`, `services/`, and `config/` — API modules grouped by responsibility.
- `client/legacy-converted/` — original TanStack Start/Supabase migration reference. Its product features have been migrated to the Vite client and Express API; TanStack/Supabase runtime files remain archived and are not imported.

## Requirements

- Node.js 20 or newer
- MongoDB running locally or a MongoDB connection string

## Install and configure

From the project root:

```bash
npm install
npm install --prefix client
npm install --prefix server
```

Copy `server/.env.example` to `server/.env`. Set `MONGODB_URI`, and a unique JWT secret of at least 32 characters. Set `OPENAI_API_KEY` to enable provider-powered AI. Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Optionally copy `client/.env.example` to `client/.env` and set `VITE_API_URL` if the API is not reached through the Vite `/api` proxy. To change the proxy target, set `VITE_PROXY_TARGET` for the Vite process.

## Run and build

Start the API and client together from the project root:

```bash
npm run dev
```

The client runs at `http://localhost:5173` (or Vite's next available port), and the API health endpoint is `http://localhost:5000/api/health`. MongoDB must be available before starting the API. The Vite development server proxies `/api` requests to the backend.

Run either side separately with `npm run dev:client` or `npm run dev:server`. Build the production client with `npm run build`.

Create an account from the sign-in screen; registration and sign-in return a JWT, and the dashboard loads only after `/api/auth/me` validates the session. Signing out or receiving an expired/invalid token clears the client session.

The migrated workspace includes notification search/detail/bulk actions, priority inbox, analytics, reusable automation rules, notification digests, demo-provider data sync, account preferences, and JSON data export. Demo integrations intentionally do not claim to connect live social accounts; real OAuth integrations require provider credentials and approval.

AI triage, natural-language search, and digests use `OPENAI_API_KEY` on the server when configured. Without a key, triage and digest generation use an explicitly labeled local-rule fallback, and smart search uses keyword matching. Notification content is only sent to the configured AI provider from the server; provider keys never go to the browser.

## API routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (JWT required)
- `GET /api/notifications` (JWT required; supports `q`, `platform`, `category`, `priority`, `status`, `page`, `limit`)
- `POST /api/notifications` (JWT required)
- `PATCH /api/notifications/:id` (JWT required)
- `DELETE /api/notifications/:id` (JWT required)
- `GET /api/notifications/stats` (JWT required)
- `PATCH /api/notifications/bulk` (JWT required)
- `GET /api/ai/status` (JWT required)
- `POST /api/ai/classify` (JWT required)
- `POST /api/ai/triage` (JWT required; analyzes up to 25 recent notifications)
- `POST /api/ai/search` (JWT required; interprets a natural-language inbox query)
- `GET /api/ai/digests` and `POST /api/ai/digests` (JWT required)
- `/api/rules` — authenticated rule CRUD, preview, and apply endpoints
- `/api/integrations` — authenticated demo-provider listing and sync
- `/api/settings` — authenticated preferences and JSON export
- `PATCH /api/auth/me` (JWT required; updates profile name)

Never commit `.env` files or publish API keys.
