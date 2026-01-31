## **Docker**

- **Production Image:** Multi-stage build compiles static assets with pnpm and serves via Nginx.
- **Compose:** Run locally on port `8080`.

### Build and Run (Docker)

- **Build:** `docker build -t conversational-ai-fe-app .`
- **Run:** `docker run --rm -p 8080:80 conversational-ai-fe-app`

### Build and Run (Compose)

- **Up:** `docker compose up --build`
- **Down:** `docker compose down`

### Files

- [Dockerfile](Dockerfile): Node build stage + Nginx runtime.
- [docker/nginx.conf](docker/nginx.conf): SPA routing (`try_files ... /index.html`).
- [docker-compose.yml](docker-compose.yml): Convenience runner exposing 8080.
- [.dockerignore](.dockerignore): Trim build context.

Open the app at http://localhost:8080

# Conversational AI

This app enables user to configure agents and converse using those agents

## Getting Started

### Install

Install dependencies.

```bash
pnpm install
```

Serve with hot reload at <http://localhost:5173>.

```bash
pnpm run dev
```

### Lint

```bash
pnpm run lint
```

### Typecheck

```bash
pnpm run typecheck
```

### Build

```bash
pnpm run build
```
