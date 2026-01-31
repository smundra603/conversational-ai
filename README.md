# Conversational AI - Run

This repository contains:

- Backend API: Fastify-based service for tenants, users, agents, sessions, analytics — see [conversational-ai/README.md](conversational-ai/README.md).
- Frontend App: React + Vite SPA served by Nginx — see [conversational-ai-app/README.md](conversational-ai-app/README.md).

## Quick Start (Docker Compose)

Run backend, frontend, and MongoDB replica set with one command from the repo root:

```bash
docker compose up -d --build
```

- Frontend: http://localhost:8080
- Backend: http://localhost:3000

Stop all containers:

```bash
docker compose down
```

## Seed Data

On app start, two demo tenants are created along with agents configured with different providers and prompts.
Creds for each tenant is mentioned below:

Tenant A

```json
{
  "domain": "demo1.com",
  "apiKey": "apikey-1",
  "emailId": "admin@example.com"
}
```

Tenant B

```json
{
  "domain": "demo2.com",
  "apiKey": "apikey-2",
  "emailId": "admin@example.com"
}
```

## Bonus Points Covered

- Async Mode: Without queue — agent response generation calls are handled asynchronously per request without a queueing system. A single jobId/messageId is returned which is polled by FE. Can add Websocket or SSE support to avoid long polling.

- RBAC: scope-based access
  - Normal user: can configure agents and converse; cannot access user management or the usage dashboard.
  - Admin user: can manage users and view the usage dashboard along with normal user privileges.

- Observability: Request tracing via `requestId` (unique per request) enables tracking end-to-end flow; metrics not added yet.

## Services

- Backend (`backend`): builds from [conversational-ai](conversational-ai), exposes `3000`.
- Frontend (`frontend`): builds from [conversational-ai-app](conversational-ai-app), exposes `8080`.
- MongoDB replica set: three nodes + init job (`rs0`) used by the backend.

See the Compose file at [docker-compose.yml](docker-compose.yml).

## Environment

Backend environment is configured via Compose. Relevant variables include:

- `NODE_ENV`, `SERVICE_NAME`, `HOST`, `PORT`, `LOG_LEVEL`, `CORS_ORIGIN`
- `MONGO_URI` — already set to the local replica set inside Docker

For local (non-Docker) development, see [conversational-ai/README.md](conversational-ai/README.md#local-development).

Frontend calls the backend at `http://localhost:3000` by default (see its API modules). If you want to parameterize this at build time, add a `VITE_API_BASE_URL` and consume it in the app.

## Local Development

Backend (from [conversational-ai](conversational-ai)):

```bash
yarn install
yarn dev
```

Frontend (from [conversational-ai-app](conversational-ai-app)):

```bash
pnpm install
pnpm run dev
```

## Testing

- Backend tests: [conversational-ai/README.md](conversational-ai/README.md#testing-local)

## Repository Structure

```
conversational-ai/        # Backend API
conversational-ai-app/    # Frontend SPA
docker-compose.yml        # Unified dev stack (FE + BE + MongoDB)
```

## Troubleshooting

- Check container logs:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

- If Mongo replica set init fails, re-run:

```bash
docker compose up -d mongo1 mongo2 mongo3
docker compose up mongo-setup
docker compose up -d backend frontend
```
