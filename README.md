# M0 AlertBox

A modular OBS-ready alert box built with React and Vite. The project ships with a dashboard-style trigger panel (`StreamAlertBox`) and a production-ready overlay renderer (`AlertBoxDisplay`). TailwindCSS-driven utility classes are combined with handcrafted broadcast-safe styles for a premium visual finish.

## Features

- **Dual alert experiences**: configure alerts from the dashboard while the overlay mirrors the production look.
- **Extensible presets**: centralized alert definitions in [`src/config/alertPresets.js`](src/config/alertPresets.js) control iconography, messaging, colors, and timing.
- **Queue management**: shared [`useAlertQueue`](src/hooks/useAlertQueue.js) hook orchestrates timing and playback for both the dashboard and overlay.
- **Testing workflows**: trigger individual events with the dashboard buttons or append `?test=true` to the URL for autonomous overlay simulation.
- **Ready for realtime**: the overlay listens for `window.postMessage` events, making it simple to bridge Twitch EventSub, YouTube Pub/Sub, or custom backends.

## Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Run the dev server

   ```bash
   npm run dev
   ```

3. Open the browser source (default: <http://localhost:5173>). Use OBS "Browser Source" with 1920x1080 canvas for best results.

4. Toggle dashboard auto-mode or append `?test=true` to preview autonomous overlay playback.

> **Note:** Package installation requires internet connectivity. If the environment is offline, fetch dependencies locally before running the commands above.

## Project Structure

```
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── src
    ├── App.jsx
    ├── main.jsx
    ├── index.css
    ├── components
    │   ├── AlertBoxDisplay.jsx
    │   └── StreamAlertBox.jsx
    ├── config
    │   └── alertPresets.js
    ├── hooks
    │   └── useAlertQueue.js
    └── styles
        ├── alertbox.css
        └── global.css
```

## Integrating Live Events

1. Authenticate with Twitch, YouTube, or your platform of choice using secure OAuth flows.
2. Receive events via webhooks, websockets, or polling.
3. Forward payloads into the browser source with `window.postMessage({ type: 'follow', data: { username: 'Viewer' } })`.
4. Extend [`alertPresets.js`](src/config/alertPresets.js) to adjust gradients, durations, and messaging for new event types.

## Conventions

- React components use functional composition and hooks only—no legacy class components.
- Styling relies on Tailwind utility classes plus curated CSS modules scoped to broadcast visuals.
- No dynamic `<style>` tag injection; animation primitives live in static CSS for predictability.

## Roadmap Suggestions

- Persist alert history and configuration to local storage or a backend.
- Add audio playback hooks for custom sound files.
- Build a control API for remote triggering (e.g., WebSocket server).
- Create automated tests to validate queue behavior and template rendering.

Enjoy building your next-level stream alert experience!
