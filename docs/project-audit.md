# M0 Alerts – System Safety & Modularity Audit

## Executive Summary
The current codebase delivers a functional OBS alert pipeline spanning a Vite-powered frontend, an Express webhook relay, and a forward-looking PostgreSQL schema. While the foundations are strong, operational risks remain around secret handling, validation, testing, and deployment hygiene. This audit inventories every layer, highlights strengths to preserve, pinpoints blocking gaps, and lays out an actionable roadmap so the next iteration is safer, more modular, and easier to scale.

## 1. Architectural Inventory
| Layer | Purpose | Current State | Notable Strengths | Key Gaps |
| --- | --- | --- | --- | --- |
| Frontend (React, Vite) | Dashboard controls, OBS overlay rendering | Routes split between `/` dashboard and `/overlay` browser source scene. Shared alert presets drive visuals/audio. | Unified alert definitions avoid drift; hooks encapsulate queue + socket behaviour.【F:src/components/StreamAlertBox.jsx†L1-L191】【F:src/components/AlertBoxDisplay.jsx†L1-L214】 | No runtime validation or sanitisation for inbound alert payloads; lacks automated UI tests. |
| Backend (Express + `ws`) | OAuth onboarding, EventSub/webhook ingestion, alert fan-out | Single `backend/server.js` file performs auth flows, webhook verification, and websocket broadcast. | Verifies Twitch signatures; already supports Twitch, YouTube, StreamLabs integrations.【F:backend/server.js†L1-L297】 | In-memory secrets/tokens, limited error handling, no auth on operator endpoints, no modular service separation. |
| Persistence (PostgreSQL) | Durable storage for accounts, alerts, goals, stats | Rich schema with indexes, triggers, archival routines already drafted.【F:database/schema.sql†L1-L298】 | Anticipates advanced analytics/goal features; triggers update goals/stats in real time. | Not yet wired into backend; migrations not automated; archiving strategy lacks retention policies. |
| Tooling & Ops | Developer workflows, quality gates | Vite scripts for dev/build, lint script exists but lacked config (added). | Simple onboarding via README, environment template available.【F:README.md†L1-L142】 | No lint/test automation, no formatting standards, environment values unchecked at boot, no CI.

## 2. Strengths Worth Preserving
1. **Shared alert catalog** keeps dashboard previews and overlay playback in sync while supporting per-alert gradients, emoji, and durations from one source of truth.【F:src/config/alertPresets.js†L1-L198】
2. **Reusable queue/socket hooks** encapsulate reconnection logic and deterministic playback order, dramatically reducing component-level state bugs.【F:src/hooks/useAlertQueue.js†L1-L82】【F:src/hooks/useAlertSocket.js†L1-L114】
3. **Comprehensive data model** anticipates customisation, analytics, and archival needs, preventing near-term schema churn.【F:database/schema.sql†L47-L298】
4. **Webhook signature verification** already blocks spoofed Twitch payloads, establishing a strong baseline for platform connectors.【F:backend/server.js†L136-L188】

## 3. Critical Gaps & Risks
### Security & Compliance
- **Ephemeral webhook secrets and tokens** disappear on restart, invalidating EventSub and risking hijacked sessions.【F:backend/server.js†L31-L36】
- **Unprotected operator endpoints** (`/api/test-alert`, websocket upgrades) accept any origin, enabling abuse from hostile clients.【F:backend/server.js†L183-L222】
- **No payload validation** between webhook ingestion and overlay rendering; malicious message bodies can inject markup or crash clients.【F:src/components/AlertBoxDisplay.jsx†L64-L186】

### Reliability & Observability
- **Single-file backend** mixes configuration, handlers, and transport concerns, making it difficult to add retries, rate limiting, or tests.【F:backend/server.js†L1-L297】
- **YouTube polling errors** are silently logged without retries or alerting, causing unnoticed alert gaps.【F:backend/server.js†L214-L282】
- **Queue persistence absent** despite schema support, so process restarts drop inflight alerts.【F:database/schema.sql†L132-L186】

### Developer Experience
- **Linting lacked configuration** until this change; no tests or formatting rules lead to style drift and hidden regressions.【F:package.json†L6-L33】
- **Docs lack runbooks** for backend services, environment validation, and deployment steps beyond high-level README notes.【F:README.md†L1-L142】

## 4. Modularity & Organisation Plan
1. **Backend package split**
   - `/backend/src/app.js` – express app bootstrap
   - `/backend/src/routes/*.js` – auth, webhook, status routes
   - `/backend/src/services/{twitch,youtube,streamlabs}.js` – encapsulate API calls with retry/backoff
   - `/backend/src/realtime/` – websocket broadcast abstraction
   - `/backend/src/storage/` – repository layer to persist tokens, alerts, queue state to Postgres
2. **Configuration layer**
   - Central `config/index.ts` (or `.js`) to validate env vars on boot (e.g., with Zod) and expose typed configuration.
3. **Shared validation schemas**
   - Adopt Zod/TypeScript to share alert payload schemas across backend and frontend for safe parsing before render.
4. **Testing harness**
   - Vitest for frontend hooks/components, Node test runner or Jest for backend service modules.
5. **CI/CD gating**
   - GitHub Actions pipeline running `npm install`, `npm run lint`, targeted tests, and bundling to ensure overlays remain production ready.

## 5. Hardening Backlog (Prioritised)
| Priority | Work Item | Owner Hint | Outcome |
| --- | --- | --- | --- |
| P0 | Persist OAuth tokens & webhook secrets, introduce refresh handling | Backend | Survive restarts without operator re-auth. |
| P0 | Lock down REST/WebSocket endpoints (auth + origin allowlists) | Backend/Frontend | Prevent arbitrary clients from spamming alerts. |
| P0 | Validate & sanitise inbound payloads before broadcasting | Backend | Blocks script injection / malformed messages. |
| P1 | Modularise platform connectors with retry/backoff + metrics | Backend | Improved reliability & observability. |
| P1 | Wire Postgres repositories for alerts, queue replay, settings | Backend | Enables durable alert history and user prefs. |
| P1 | Add structured logging + tracing (pino/winston + OpenTelemetry) | Backend | Faster debugging and production insight. |
| P2 | Surface queue/health dashboards in frontend | Frontend | Operators see platform/websocket state in real time. |
| P2 | Implement automated tests + CI gating | DevEx | Prevent regressions as feature set grows. |
| P3 | Document deployment runbooks & rotate secrets | Ops | Production readiness and compliance trail. |

## 6. Feature Coverage & Verification Matrix
| Feature | Frontend Support | Backend Support | Persistence | Notes |
| --- | --- | --- | --- | --- |
| Follow/Subscribe/Raid/Cheer/Gift alerts | ✅ Shared presets render variations | ✅ Twitch EventSub ingestion | ⚠️ Not persisted yet | Need queue persistence + history logging. |
| Donations/Tips/Super Chats | ✅ Template placeholders exist | ✅ StreamLabs + YouTube connectors | ⚠️ Not persisted | Sanitize donor messages before display. |
| Member/Host alerts | ✅ Templates defined | ⚠️ Partial (host missing) | ⚠️ Not persisted | Host events require Twitch PubSub or Helix integration. |
| Alert customisation | ⚠️ Config via code only | ❌ | ✅ Schema ready | Build UI backed by `alert_customizations`. |
| Goals/statistics | ❌ Display pending | ❌ | ✅ Schema & triggers ready | Need service layer + dashboard widgets. |
| BRB / Overlay theming | ✅ CSS scaffolding present | – | – | Expand to configurable themes in DB. |

## 7. Operational Guardrails
- **Environment validation** – Fail-fast on missing secrets, invalid URLs, or untrusted webhook base domains.
- **Secret management** – Store secrets in Vault/SSM; never auto-generate on boot.
- **Rate limiting & throttling** – Apply per-route rate limits (e.g., `express-rate-limit`) and queue size caps to weather raids.
- **Observability stack** – Centralised logging, metrics (Prometheus), and uptime checks for webhook endpoints.
- **Disaster recovery** – Schedule DB backups, test restore runbooks, and archive alerts per regulatory requirements.

## 8. Developer Standards (New Document)
Refer to [`docs/development-standards.md`](development-standards.md) for coding style, lint/test expectations, commit hygiene, and review protocols introduced in this iteration.

## 9. Next Steps
1. Stand up a Postgres instance (local Docker + cloud staging), wire repositories, and migrate token storage off memory.
2. Refactor backend into modules with validation, retries, and metrics.
3. Harden transport security (HTTPS, auth, origin checks) before exposing to streamers.
4. Build CI pipeline executing lint + targeted tests to unblock safe contributions.

This roadmap positions the project to deliver a production-ready alerting experience that is secure, observable, and maintainable as feature scope expands.
