# conversational-ai

Conversational AI Server to support

- `Tenant Creation`
- `User & Role Management`
- `User Authentication & Authorization`
- `Agent Management`
- `Session Management`
- `Agentic Conversation`
- `Analytics on Usages`

## Scripts

- `yarn run dev` - Start in watch mode
- `yarn run build` - Compile TypeScript to `dist/`
- `yarn start` - Run compiled server
- `yarn run typecheck` - Typecheck only
- `yarn run lint` - Lint
- `yarn run format` - Format

## Env

Copy `.env.example` to `.env` for local development.

## Local Development

- Prerequisites:
  - Node.js >= 20 (matches project engines)
  - Yarn (or npm)
  - Mongo >= 7 (required for mongoose and typegoose modules)

- Install dependencies:

```bash
yarn install
```

- Configure environment:
  - Copy `.env.example` → `.env` and adjust values
  - Set `MONGO_URI` to your local or hosted MongoDB
    - Local Docker replica set (recommended):
      ```bash
      export MONGO_URI="mongodb://localhost:27017,localhost:27018,localhost:27019/conversational_ai?replicaSet=rs0"
      ```
    - Atlas or single-node:
      ```bash
      export MONGO_URI="mongodb://<user>:<pass>@<host>:<port>/<db>"
      ```

- Start the app in watch mode:

```bash
yarn dev
```

- Optional debug:

```bash
yarn dev:debug
```

- The API is available at http://localhost:3000

## Docker Deployment

- Build and run with Compose (Node 20 + MongoDB 7):

```bash
docker compose up --build -d
```

- The app runs on http://localhost:3000 and connects to Mongo at `mongodb://mongo:27017/conversational_ai` inside the network.
- To view logs:

```bash
docker compose logs -f app
```

- To stop and remove:

```bash
docker compose down
```

## Docker: MongoDB Replica Set (Local)

This project includes a 3-node MongoDB replica set via Compose (`rs0`) and an init service to configure the set automatically.

- Start the replica set and app:

```bash
# One-shot
docker compose up -d

# Or step-by-step
docker compose up -d mongo1 mongo2 mongo3
docker compose up mongo-setup
docker compose up -d app
```

- Verify the replica set:

```bash
docker exec -it conversational-ai-mongo1 mongosh --quiet --eval "rs.status().ok"
```

- Connect from the app (inside Docker):

```bash
# Already configured via compose
MONGO_URI=mongodb://mongo1:27017,mongo2:27017,mongo3:27017/conversational_ai?replicaSet=rs0
```

- Connect from host (Mac/localhost, running the app outside Docker):

```bash
export MONGO_URI="mongodb://localhost:27017,localhost:27018,localhost:27019/conversational_ai?replicaSet=rs0"
```

- Tear down:

```bash
docker compose down
```

## Testing (Local)

- Unit tests (fast, no shared app):

```bash
yarn test:unit
```

- Integration tests (shared Fastify app, real Mongo):
  - Ensure `MONGO_URI` points to a running database (e.g., local replica set above)

```bash
export MONGO_URI="mongodb://localhost:27017,localhost:27018,localhost:27019/conversational_ai?replicaSet=rs0"
yarn test:integration
```

- All tests:

```bash
yarn test
```

- Troubleshooting:
  - Detect open handles:
    ```bash
    yarn test:integration --detectOpenHandles
    ```
  - Increase Jest verbosity:
    ```bash
    yarn test:integration --verbose
    ```

### Images and Versions

- Node runtime: node:20-alpine (matches engines.node >= 20).
- MongoDB: mongo:7.0 (compatible with modern MongoDB drivers and Mongoose v9).

### Environment Variables

- The container sets defaults via Compose. Override as needed:
  - SERVICE_NAME, HOST, PORT, LOG_LEVEL, CORS_ORIGIN
  - MONGO_URI (defaults to mongodb://mongo:27017/conversational_ai in Compose)

### Developer Utilities

- Typecheck:

```bash
yarn typecheck
```

- Lint:

```bash
yarn lint
```

- Format:

```bash
yarn format
```
