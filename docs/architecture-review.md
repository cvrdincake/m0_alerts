# M0 AlertBox – Architecture & Risk Assessment

## 1. Current Snapshot
- **Frontend** – Vite + React single-page app with a routed dashboard shell and dedicated `/overlay` scene. Alert definitions (icons, gradients, audio, templates) live in a single shared preset map that both the dashboard and overlay import.【F:src/config/alertPresets.js†L1-L172】
- **State orchestration** – Custom hooks manage alert playback timing and resilient WebSocket delivery so overlay scenes automatically reconnect and process queues deterministically.【F:src/hooks/useAlertQueue.js†L1-L82】【F:src/hooks/useAlertSocket.js†L1-L114】
- **Backend** – Express server handles OAuth onboarding for Twitch, YouTube, and StreamLabs, verifies EventSub signatures, polls APIs, and relays alerts to overlay clients via a raw `ws` server. Tokens are held in memory and webhook subscriptions depend on a `.env`-provided base URL.【F:backend/server.js†L1-L204】【F:backend/server.js†L136-L188】
- **Persistence** – Not yet wired into the runtime, but a comprehensive PostgreSQL schema now exists covering users, OAuth tokens, alert history, customization, goals, statistics, queue persistence, and auxiliary views/triggers for rollups.【F:database/schema.sql†L1-L298】

## 2. Strengths to Preserve
1. **Single source of truth for alert presentation** keeps dashboard previews and overlay output perfectly aligned and simplifies future alert additions.【F:src/config/alertPresets.js†L19-L198】
2. **Reusable queue/socket hooks** encapsulate tricky timing/reconnect logic, reducing duplicated state machines across views.【F:src/hooks/useAlertQueue.js†L15-L82】【F:src/hooks/useAlertSocket.js†L4-L114】
3. **Environment helpers** gracefully fall back to origin-derived hosts, easing OBS embedding when env vars are absent.【F:src/config/environment.js†L1-L37】
4. **Backend webhook verification** already stores the raw body, computes EventSub HMACs, and rejects tampered payloads.【F:backend/server.js†L17-L205】
5. **Database design** anticipates advanced features (goals, statistics, queue persistence, blacklist), making it a solid foundation for server hardening.【F:database/schema.sql†L47-L298】

## 3. Gaps, Risks & Debt
### Backend
- **Ephemeral secrets** – Randomly generating the Twitch webhook secret on each boot invalidates existing subscriptions and breaks replay protection after restarts.【F:backend/server.js†L31-L36】
- **In-memory tokens** – OAuth grants and webhook subscriptions are never persisted, so restarts drop connectivity and no refresh logic renews access tokens.【F:backend/server.js†L52-L136】
- **No request authentication** – Dashboard REST endpoints and WebSocket upgrade accept any origin; hostile clients can spam `/api/test-alert` or connect for data exfiltration.【F:backend/server.js†L183-L222】
- **Limited error handling** – API calls only log to stdout and never retry/alert when polling fails (e.g., YouTube liveChat requests).【F:backend/server.js†L214-L282】
- **Missing rate limiting & validation** – Incoming webhook payloads are trusted after signature verification; there is no schema validation or queue throttling for large raids/donation spam.

### Frontend
- **Unverified socket payloads** – Overlay trusts inbound events without shape validation or sanitization, making it susceptible to DOM injection when the backend is compromised.【F:src/components/AlertBoxDisplay.jsx†L46-L189】
- **Test surface duplication** – Stream dashboard duplicates some logic that already exists in shared presets/factories; consolidating will reduce drift.【F:src/components/StreamAlertBox.jsx†L1-L181】
- **Lack of automated testing** – No unit/integration tests exist despite `npm run lint` script; even ESLint lacks configuration, so regressions go unnoticed.【F:package.json†L6-L33】

### Infrastructure & Operations
- **Env management** – `.env` is not validated at startup; missing credentials fail late during OAuth flows rather than being flagged immediately.【F:backend/server.js†L30-L188】
- **Observability gaps** – No structured logging, metrics, or alerting. Manual log scraping is the only way to detect disconnects or API errors.
- **Deployment hardening** – HTTPS termination, rate limiting, reverse proxy guidance, and background job orchestration are not documented beyond the README.

## 4. Safety & Security Recommendations
1. **Persist secrets & tokens** using the new PostgreSQL tables; load the Twitch webhook secret from storage (or env) and implement refresh token rotation with expiry checks.【F:database/schema.sql†L1-L120】
2. **Authenticate dashboard traffic** via session cookies or signed JWTs; restrict `/api/test-alert` to authenticated operators and enforce CORS/websocket origin allowlists.【F:backend/server.js†L183-L222】
3. **Add schema validation** (e.g., Zod/Joi) for REST + websocket payloads so untrusted data can’t inject markup or crash the overlay.【F:src/components/AlertBoxDisplay.jsx†L60-L137】
4. **Introduce rate limits & back-pressure** on incoming alerts (per-IP/per-user) and queue lengths to withstand EventSub bursts or malicious spam.【F:backend/server.js†L72-L118】
5. **Implement structured logging & monitoring** (winston/pino + Prometheus/OpenTelemetry) to trace API failures, subscription expirations, and websocket churn.
6. **Enforce HTTPS & signature rotation** by documenting reverse proxy setup (Nginx/Caddy) and ensuring webhook secrets rotate with audit logging.

## 5. Modularity & Code Quality Enhancements
- **Extract platform connectors** – Move Twitch/YouTube/StreamLabs logic into dedicated service modules with retry/backoff policies and unit tests.【F:backend/server.js†L85-L282】
- **Create a validation layer** – Shared TypeScript types or runtime schemas can power both backend validation and frontend safety (consider adopting Zod across the stack).
- **Centralize alert factories** – Ensure `StreamAlertBox` uses the same normalized builders consumed by the overlay to avoid divergence when presets evolve.【F:src/components/StreamAlertBox.jsx†L62-L143】
- **Add testing harness** – Stand up Vitest for frontend hooks/components and Jest (or Node test runner) for backend services; integrate into CI with lint/test scripts.【F:package.json†L6-L33】
- **Document DB migrations** – Wrap `database/schema.sql` in a migration toolchain (Prisma/Knex/Flyway) so schema drift is tracked and reversible.【F:database/schema.sql†L1-L298】

## 6. Roadmap to a Safer vNext
| Phase | Focus | Key Deliverables |
| --- | --- | --- |
| **Immediate (week 1)** | Hardening & Observability | Persist OAuth/webhook secrets, enforce auth on control endpoints, add structured logging & health metrics, surface socket status in dashboard. |
| **Near-term (weeks 2-4)** | Reliability & Modularity | Extract service modules with retry/backoff, add input validation and rate limiting, wire PostgreSQL persistence for alert history and queue replay, seed integration tests. |
| **Mid-term (month 2)** | Feature Expansion | Implement customizable alert profiles from DB, expose goals/statistics widgets powered by triggers/views, build admin UI for blacklist & webhook management. |
| **Long-term** | Operations & Scale | Containerize services, add CI/CD with lint/test gating, introduce autoscaling workers for heavy integrations, and formalize on-call/alert policies. |

## 7. Checklist for Upcoming Work
- [ ] Lock down production secrets (no auto-generated webhook secret on boot).
- [ ] Add auth middleware and origin allowlists for REST + WebSocket traffic.
- [ ] Implement payload validation and escaping in both backend and overlay renderer.
- [ ] Wire PostgreSQL persistence for tokens, alert history, and queue durability.
- [ ] Build automated tests (unit + integration) and enable CI gating.
- [ ] Add structured logging, metrics, and alerting hooks.
- [ ] Document deployment runbooks (HTTPS, reverse proxy, rotation policies).

This assessment should guide the next iteration toward a safer, more modular, and production-ready alerting stack while preserving the ergonomics that already work well for streamers and operators.
