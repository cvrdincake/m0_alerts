# M0 AlertBox

A modular OBS-ready alert platform that pairs a Vite + React front-end with a Node.js event broker. The project now ships with a routed dashboard/overlay experience, a single source of alert definitions, reusable queue utilities, and hardened WebSocket handling so the overlay can safely evolve as the backend grows.

## Highlights

- **Dedicated routes** – `/` hosts the Stream Alert dashboard, while `/overlay` exposes the production browser source. The dashboard header links directly to the overlay (opening in a new tab for OBS usage).
- **Centralised alert definitions** – [`src/config/alertPresets.js`](src/config/alertPresets.js) defines icons, gradients, sound effects, durations, and templates for both the dashboard cards and the overlay renderer.
- **Reusable factories & queues** – [`src/utils/alertFactory.js`](src/utils/alertFactory.js) produces normalised alert payloads and [`src/hooks/useAlertQueue.js`](src/hooks/useAlertQueue.js) orchestrates playback with predictable timing.
- **WebSocket aware overlay** – [`AlertBoxDisplay`](src/components/AlertBoxDisplay.jsx) consumes backend broadcasts via [`useAlertSocket`](src/hooks/useAlertSocket.js), falls back to `window.postMessage`, and supports autonomous test mode (`?test=true`) plus optional TTS (`?tts=true`).
- **Environment-driven setup** – `.env.example` covers backend credentials, session secrets, optional persistence, and the Vite runtime configuration needed to bind the dashboard to the API/WS server.

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create your environment file**

   ```bash
   cp .env.example .env
   ```

   Populate Twitch, YouTube, and StreamLabs credentials along with the WebSocket/API origins. For local dev the defaults target `http://localhost:3000` for the backend and Vite at `http://localhost:5173`.

3. **Start the backend**

   ```bash
   npm run server
   ```

   The Express server lives in [`backend/server.js`](backend/server.js) and exposes `/auth/*` OAuth flows, `/webhooks/twitch` verification, `/api/test-alert`, and a WebSocket fan-out.

4. **Start the Vite dev server**

   ```bash
   npm run dev
   ```

5. **Open the dashboard** – <http://localhost:5173/>. Use the control panel to fire test alerts, toggle auto mode, or verify backend connectivity.
6. **Load the overlay** – <http://localhost:5173/overlay>. Append `?test=true` for autonomous playback or `?tts=true` to enable speech synthesis. Point your OBS browser source at this route.

> **Offline note:** Package installation and OAuth flows require internet connectivity. In constrained environments pre-fetch dependencies and credentials before running the commands above.

## Project Structure

```
├── backend
│   └── server.js               # Express + WebSocket backend
├── src
│   ├── App.jsx                 # React Router entry point with dashboard shell
│   ├── main.jsx                # React/Vite bootstrap with BrowserRouter
│   ├── components
│   │   ├── AlertBoxDisplay.jsx # Overlay renderer with queue + socket wiring
│   │   └── StreamAlertBox.jsx  # Dashboard control surface and preview
│   ├── config
│   │   ├── alertPresets.js     # Alert metadata shared by dashboard & overlay
│   │   └── environment.js      # Runtime environment helpers
│   ├── hooks
│   │   ├── useAlertQueue.js    # Timed queue processing hook
│   │   └── useAlertSocket.js   # Reconnecting WebSocket helper
│   ├── services
│   │   └── alertApi.js         # REST helpers for backend interaction
│   ├── utils
│   │   └── alertFactory.js     # Builders for normalised alert objects
│   ├── styles
│   │   ├── alertbox.css
│   │   └── global.css
│   ├── index.css
│   └── main.jsx
├── .env.example                # Comprehensive environment template
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## Development Notes

- **Alert lifecycle** – alerts enter through WebSocket broadcasts, the dashboard test buttons, or `window.postMessage`. Each source uses the same factory helpers ensuring consistent durations, audio, and text templates.
- **Audio & TTS** – the overlay automatically plays the configured sound file per alert and optionally narrates content when `?tts=true` is appended. Sounds are expected under `public/sounds/`.
- **Configuration changes** – customise gradients, durations, or copy by editing `alertPresets.js`. Both the dashboard preview and overlay immediately reflect updates.
- **Routing** – `react-router-dom` keeps the dashboard chrome separate from the overlay canvas. The overlay route omits the navigation shell to remain broadcast-safe.
- **Extensibility** – extend factories/hooks rather than duplicating logic in components. Adding a new alert type requires updating `alertPresets.js`, supplying a sound file, and optionally creating backend handlers.

## Troubleshooting

- **No WebSocket connection** – confirm `VITE_ALERT_WS_URL` in `.env` points to the backend and that the server is running (`npm run server`). The overlay surface exposes the connection state via `data-connection-status` for debugging.
- **Audio blocked in OBS/browser** – ensure the browser source is allowed to autoplay audio or trigger a manual interaction first. Verify sound files exist at the paths referenced in `alertPresets.js`.
- **OAuth callbacks failing** – double-check the redirect URIs in Twitch/YouTube/StreamLabs developer portals match the values in `.env` and that `WEBHOOK_BASE_URL` is publicly reachable (ngrok recommended for local testing).

## Roadmap Ideas

- Persist alert history and settings (Redis/PostgreSQL hooks already sketched in `.env.example`).
- Add authentication/role-based access for the dashboard.
- Build automated tests for queue timing and overlay rendering.
- Expose advanced widgets (ticker, BRB screen) once backend persistence is available.

Happy streaming!
