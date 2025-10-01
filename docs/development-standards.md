# Development Standards & Engineering Workflow

These guidelines establish the baseline quality bar for contributing to the M0 Alerts project. They should be enforced through code review and automated CI once the pipeline is configured.

## 1. Toolchain & Environments
- **Node.js 18 LTS** – Align local and CI Node versions to avoid dependency drift.
- **Package manager** – Use `npm` (lockfile TBD). Avoid mixing with `yarn`/`pnpm` until a deliberate migration is planned.
- **Environment variables** – Copy `.env.example` and complete values before running backend services. Use a secrets manager in production.

## 2. Coding Conventions
- **ESLint** – Run `npm run lint` before committing. The shared `.eslintrc.cjs` enforces React best practices and catches common mistakes.【F:.eslintrc.cjs†L1-L32】
- **Formatting** – Prefer Prettier defaults (add a config/CI step in upcoming work). Until automation lands, match existing formatting and avoid introducing inconsistent styles.
- **React** – Favour functional components and hooks. Keep shared logic in `/src/hooks` or utility modules.
- **Backend** – Target ES modules, split features into service/router modules, and isolate third-party SDK code.

## 3. Testing Expectations
- **Unit tests** – Required for new hooks, utilities, and backend service modules once the testing harness is introduced (Vitest/Jest planned in roadmap).
- **Integration tests** – Validate WebSocket flows and webhook ingestion against mock platforms before shipping major changes.
- **Manual QA** – For UI updates, verify dashboard interactions, overlay rendering, and audio playback in OBS Browser Source.

## 4. Security Hygiene
- Never log secrets or OAuth tokens.
- Validate and sanitise all external payloads (webhooks, REST bodies, WebSocket events) before processing.
- Enforce CORS and WebSocket origin checks when the auth layer is implemented.

## 5. Git & Review Process
- Keep commits scoped and descriptive (e.g., `feat(backend): persist twitch tokens`).
- Reference relevant documentation or tickets in commit/PR descriptions.
- Require at least one review for feature work. Reviewers confirm lint/test status, security impact, and documentation updates.

## 6. Documentation Requirements
- Update README or relevant docs when adding new endpoints, environment variables, or architectural decisions.
- Record significant decisions in `docs/` (ADR-style) so future contributors understand trade-offs.

Adhering to these standards will ensure the alert stack remains maintainable, secure, and easy for new contributors to onboard.
