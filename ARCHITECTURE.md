# Conversational AI Service — Architecture

High level (HLD) and low level (LLD)

## Overview

- Fastify + TypeScript application with ESM (NodeNext) modules.
- Primary domains: Tenants, Agents, Sessions, Messages, Analytics/Usage, Auth.
- MongoDB (Mongoose) as the data store, with support for per-tenant databases.
- HTTP API organized into routes and services, with “provider” adapters for Generative AI.
- Observability via request-scoped requestId propagated using AsyncLocalStorage.
- Frontend SPA built with React + Vite; developed via Vite dev server and served in production from Nginx (container) as static assets.
- Frontend communicates with the API over HTTP (default http://localhost:3000), using fetch with credentials; CORS on the API permits the SPA origin.

---

## HLD

**Components**

- **API Layer:** Fastify server built in src/app/index.ts, routes under src/routes. Key routes: tenant, agents, session, message, auth, public, analytics, health.
- **Plugins:** Env, Cookie, CORS, Helmet, Sensible in src/plugins. These configure environment, security headers, cookies, and cross-origin settings.
- **Hooks:** Prehandler authorization and request context in src/hooks/prehandler.hook.ts. Sets x-request-id and injects req.context.
- **Services:** Business logic in src/services per domain (tenant, agent, session, message, auth, usage, generativeAI).
- **Models/Repositories:** Mongoose schemas and repository pattern in src/models, including base entity support and tenant-aware connections. Can be extended to govern RBAC at document level as well.
- **Generative AI Providers:** Adapter abstraction for external LLM providers (OpenAI, Claude, Gemini) under src/services/generativeAI. Provider tests under tests/unit.
- **Database:** MongoDB connection management in src/database/mongoConnection.ts. Per-tenant DB selection via Mongoose useDb.
- **Utilities:** Auth/JWT, request ID, logging, retry helpers in src/utils.

**Tenancy Isolation**

- **Context-carried tenant identity:** tenantId in src/interfaces/context.interface.ts, set during auth in src/utils/auth.ts.
- **Per-tenant database selection:** Repositories derive tenant-specific connections using Mongoose useDb(dbName) (see base model utilities in src/models/base).
- **Data partitioning:** Each tenant’s data is stored in its own MongoDB database (or schema namespace), minimizing cross-tenant access and easing data lifecycle/retention.

**Scaling Plan**

- **Stateless API instances:** Horizontal scale Fastify across pods/VMs; externalize state to MongoDB. Keep instance-local caches minimal.
- **MongoDB:** Use replica sets in production for HA. Scale reads via secondaries where appropriate; write scaling via sharding if necessary.
- **Async provider calls:** Enforce timeouts and concurrency controls for external LLMs; scale instances to increase parallelism. Consider queue-based decoupling for long-running tasks.
- **Infra:** Containerize (Docker), orchestrate (Kubernetes), add liveness/readiness probes; autoscale API and database appropriately.

**Failure Handling**

- **Graceful shutdown:** Signal handling closes Fastify and Mongo in src/server.ts, ensuring clean exit.
- **Retries with backoff:** External calls utilize retry helpers (src/utils/retry.ts) with capped attempts and jitter (configurable by operation).
- **Provider fallback:** Generative AI adapters support failover to alternate providers when the primary fails.
- **Input validation:** Fastify AJV options enable coercion and schema defaults at the edge; reject invalid requests quickly.
- **Authorization early exit:** Prehandler denies unauthorized requests before hitting business logic.

**Observability**

- **Request tracing:** requestId generated per request (from x-request-id or UUID) via src/utils/request.ts, persisted with AsyncLocalStorage in src/utils/requestContext.ts and logged in src/utils/logger.ts.
- **Structured logs:** Winston logger provides timestamped logs including req:<id> prefix, aiding correlation across services.

**RBAC (Scopes & Roles)**

- **Roles:** Currently supported `admin` and `user`
- **Scopes:** Enforced via prehandler; `user` can configure agents and converse while `admin` can manage users and view usage analytics as well. Scopes are encoded in auth tokens and also exposed via authorized `/me` route
- **Authorization flow:** JWT is validated, scopes extracted and added to context; request context carries `scopes ` for decisions.
- **Route Restrictions:** On client side, `scopes` are used from `/me` request for restrictive route access.

---

## LLD

**Data Schemas (Indicative)**

- **Base Entity:** Common fields like \_id, createdAt, updatedAt; repository utilities in src/models/base.
- **Tenant:** Holds domain and metadata for tenant; used to derive per-tenant DB selection.
- **Agent:** Configuration for generative AI usage (provider, model, status), ownership, and runtime settings.
- **Session:** Links tenantId, agentId, and user; tracks session lifecycle and context.
- **Message:** Conversation messages linked to sessionId, with sender (user/agent), content, token counts; may include uniqKey for idempotency.
- **Usage/Analytics:** Records cost, token counts, provider, dimensions; power analytics queries.

Note: Exact schema files are under src/models. Some fields are inferred from usage in services and tests.

**Adapter Interfaces**

- **Provider (Generative AI):** A normalized interface (e.g., converse() / generate()) to call different provider SDKs behind a common contract. Each provider implements the interface (OpenAI, Claude, Gemini) and maps results to internal DTOs. Tests in tests/unit validate provider behavior and abstraction consistency.
- **Repository Pattern:** Base repositories expose CRUD and query helpers per entity, wrapping Mongoose models with tenant-aware connections.

**Retry & Fallback Logic**

- **Retries:** For external API calls (LLMs), apply exponential backoff with jitter (via src/utils/retry.ts); bound the max attempts and fail fast on non-retryable errors (e.g., 4xx).
- **Fallback chain:** If the primary provider fails or times out, attempt a secondary provider with the same input; record and surface the chosen provider in usage analytics.
- **Timeouts:** Per-call timeouts to prevent resource exhaustion; configurable by operation.

**Idempotency Approach**

- **UniqKey per conversation operation:** When sending messages, a uniqKey can be passed to deduplicate operations in src/services/message/message.service.ts. If a message exists with the same key, return it instead of re-executing.
- **Database constraint/index:** Use a unique index on (sessionId, uniqKey) to enforce idempotency at the storage layer; repository methods perform upsert-or-return patterns.
- **At-least-once semantics:** Combined with idempotency keys, retries avoid duplicated effects on success paths.

**Request Context & Authorization**

- **Context fields:** requestId, tenantId, userId, optional sessionId (src/interfaces/context.interface.ts).
- **Auth prehandler:** src/hooks/prehandler.hook.ts authorizes requests and injects req.context; public endpoints (e.g., /public/\*) bypass auth but still receive a minimal context with requestId.
- **JWT:** Token verification in src/utils/jwt.ts, with AccessType in src/enums/accessType.enum.ts to differentiate public vs. private access.

**Configuration & Runtime**

- **Environment:** Typed env schema in src/config/env.ts; loaded via @fastify/env and dotenv. Server also loads .env early in src/server.ts.
- **CORS/Cookies/Security:** Configured in src/plugins; CORS origin reflection for credentials, cookies for public tokens, Helmet for security headers.
- **ESM & Jest:** NodeNext ESM setup; ts-jest preset with moduleNameMapper to strip .js suffixes in TypeScript imports; global setup/teardown in tests ensure clean suite lifecycle.

**Failure Handling (LLD Details)**

- **Graceful shutdown:** Signal handlers in src/server.ts call closeMongoDBConnection() and app.close().
- **Error logging:** Centralized logger includes request ID; errors are captured with context.
- **Resilience:** Provider calls guarded by retries/timeouts; fallback provider path logged and measured.

---

**Generic Analytics**

- **Overview:** A single, generic analytics input (`UsageAnalyticInput`) drives database aggregation, avoiding many specialized endpoints while supporting flexible queries.
- **Filters:** `filters.startDate` / `filters.endDate` constrain the time window for results.
- **Dimension:** `dimension?: 'createdAt' | 'agentId' | 'provider'` selects the grouping key (e.g., by day, by agent, by provider).
- **Metrics:** `metrics: Metric[]` specifies which measures to compute (e.g., `total_sessions`, `total_cost`, `total_tokens`). Multiple metrics can be computed in one pass.
- **TopN:** `topN?: { property: Metric; n: number }` limits output to the top-N entries sorted by the chosen metric.
- **Aggregation Pipeline:** Match by filters → group by dimension → compute requested metrics → optional sort/limit for `topN` → shape to `GetUsageAnalyticsResponse`.
- **Response:** `GetUsageAnalyticsResponse` returns an array of dimension-keyed rows with the requested metric fields.

## Scaling & Operations

**Horizontal Scale**

- Run multiple Fastify instances behind a load balancer; keep request-scoped context in AsyncLocalStorage only, avoid instance-shared state.

**Database**

- Use MongoDB replica sets for HA. For read-heavy workloads, consider read preferences; for high scale, introduce sharding with per-tenant routing strategies.

**Observability**

- Enrich logs with requestId for correlation. Consider adding structured JSON logs and centralized log aggregation.
- Add metrics (latency, error rate, provider-level metrics) and tracing (OpenTelemetry) for deeper insight.

---

## Optimizations

**Realtime Delivery (WebSockets/SSE)**

- Replace client-side long polling with server push using WebSockets (e.g., Fastify WebSocket or Socket.IO). The server emits generative message updates as they are produced, reducing latency and request overhead.
- Provide an SSE fallback for environments where WebSockets are constrained; keep a single connection per client to multiplex sessions.

**Redis Caching (Sessions/Messages)**

- Cache the last 10 sessions per tenant/user and the last 20 messages per session to reduce DB roundtrips on hot paths.
- Proposed key patterns:
  - `tenant:{tenantId}:user:{userId}:sessions:recent` → a bounded list (max 10) of session summaries.
  - `tenant:{tenantId}:session:{sessionId}:messages:recent` → a bounded list (max 20) of messages.

**Cursor-Based Pagination**

- Adopt cursor pagination over offset-based to avoid `skip` performance degradation and shifting windows.
- Ordering and tie-breakers:
  - Use a stable sort on `createdAt` descending with a secondary tie-breaker on `_id` (ObjectId) to disambiguate equal timestamps.

## Future Enhancements

- **Voice Conversation:** Add speech capability via client-side microphone capture and server-side TTS/STT pipeline (e.g., WebSocket streaming (WebRTC would be heavy for this kind of system) + provider STT like Whisper/Gemini + TTS output). Maintain session continuity and transcript storage. Need to focus on chunking strategy which would be critical in healthcare domain.
- **Tooling (MCPs):** Integrate Model Context Protocol servers to expose domain-specific tools for agentic workflows. Configure per-tenant tool registries; enable agents to call tools securely with audit trails.
- **Caching:** Response/token caching for repeated prompts; schema-level indexes tuned for hot paths.
- **Queueing:** Background processing for long-running tasks with retryable DLQs.
- **Observability:** Structured logs + distributed tracing + dashboards.
- **Interactive Cancellation:** Allow users to stop AI response generation mid-stream. Surface server-side cancel tokens (per request/session); ensure cleanup of partial state and consistent usage accounting.
- **Edit & Regenerate:** Enable editing a prior user message and regenerating the agent response. Track message versions (e.g., `prevMessageId`/`revision`), preserve idempotency via per-revision keys.
- **Rate Limiting:** Tenant/user-level quotas and rate controls.
- **Circuit Breakers:** Add breaker patterns around flaky providers to prevent cascading failures.
