# M0 AlertBox

A modular OBS-ready alert platform built with React, Vite, and a companion Node.js backend. The project ships with a dashboard-style trigger panel (`StreamAlertBox`), a production-ready overlay renderer (`AlertBoxDisplay`), and a streaming alert service capable of brokering Twitch, YouTube, and StreamLabs events. TailwindCSS-driven utility classes are combined with handcrafted broadcast-safe styles for a premium visual finish.

## Features

- **Dual alert experiences**: configure alerts from the dashboard while the overlay mirrors the production look.
- **Extensible presets**: centralized alert definitions in [`src/config/alertPresets.js`](src/config/alertPresets.js) control iconography, messaging, colors, and timing.
- **Queue management**: shared [`useAlertQueue`](src/hooks/useAlertQueue.js) hook orchestrates timing and playback for both the dashboard and overlay.
- **Realtime backend**: [`backend/server.js`](backend/server.js) exposes OAuth flows, webhook handling, and WebSocket fan-out for Twitch, YouTube, and StreamLabs.
- **Testing workflows**: trigger individual events with the dashboard buttons or append `?test=true` to the URL for autonomous overlay simulation.
- **Resilient sockets**: the overlay automatically reconnects to the backend WebSocket and surfaces connection state for production readiness.

## Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Copy environment variables

   ```bash
   cp .env.example .env
   ```

   Populate the OAuth credentials, webhook base URL, and Vite runtime (`VITE_ALERT_*`) values before running in production.

3. Run the backend service (required for live integrations)

   ```bash
   npm run server
   ```

4. Run the Vite dev server (in a new terminal)

   ```bash
   npm run dev
   ```

5. Open the browser source (default: <http://localhost:5173>). Use OBS "Browser Source" with 1920x1080 canvas for best results.

6. Toggle dashboard auto-mode or append `?test=true` to preview autonomous overlay playback without the backend.

> **Note:** Package installation requires internet connectivity. If the environment is offline, fetch dependencies locally before running the commands above.

## Project Structure

```
├── backend
│   └── server.js            # Express backend with Twitch/YT/StreamLabs integrations
├── src
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css
│   ├── components
│   │   ├── AlertBoxDisplay.jsx
│   │   └── StreamAlertBox.jsx
│   ├── config
│   │   ├── alertPresets.js
│   │   └── environment.js
│   ├── hooks
│   │   ├── useAlertQueue.js
│   │   └── useAlertSocket.js
│   ├── services
│   │   └── alertApi.js
│   └── styles
│       ├── alertbox.css
│       └── global.css
├── .env.example              # Environment template for backend credentials
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

## Integrating Live Events

1. Authenticate with Twitch, YouTube, or StreamLabs by visiting the `/auth/*` routes exposed by the backend server.
2. Twitch EventSub callbacks are verified with your `TWITCH_WEBHOOK_SECRET`; ensure `WEBHOOK_BASE_URL` is reachable publicly.
3. YouTube memberships and Super Chats are polled every 10 seconds when a live broadcast is active.
4. StreamLabs donations are streamed over socket.io and broadcast instantly.
5. Overlay clients automatically subscribe to the backend WebSocket (`/api/status` reports connection counts).
6. For custom tooling or offline demos, you can still push payloads via `window.postMessage` in addition to backend delivery.

## Conventions

- React components use functional composition and hooks only—no legacy class components.
- Styling relies on Tailwind utility classes plus curated CSS modules scoped to broadcast visuals.
- No dynamic `<style>` tag injection; animation primitives live in static CSS for predictability.

## Roadmap Suggestions

- Persist alert history and configuration to local storage or a backend.
- Harden backend persistence (swap in Redis/Postgres for token storage).
- Add audio playback hooks for custom sound files.
- Build scripted integration tests to validate queue behavior and template rendering.
- Implement admin authentication for production deployments.

Enjoy building your next-level stream alert experience!
