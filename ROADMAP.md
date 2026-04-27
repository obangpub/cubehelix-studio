# Roadmap

## Phase 1 — shipped

- `@lumenfast/core` — cubehelix math, sequential sampling, WCAG contrast, text-color picking, formatters.
- `lumenfast` (Python) — same math, formatters, contrast, plus matplotlib colormap adapter behind a `[viz]` extra.
- `@lumenfast/web` — Vite + React app with four parameter sliders, live gradient strip, and a 9-swatch row with contrast-aware hex labels.
- Shared parity fixture (`fixtures/parity.json`) verifies that both libraries produce identical RGB output for identical inputs.

## Phase 2

- **Semantic palette mode** — pin N points on the curve, assign roles (primary, secondary, danger, warning, success, neutral), display contrast matrix between roles.
- **Exports** — CSS custom properties, Tailwind theme snippet, SCSS variables, JSON, matplotlib `.mplstyle`, GIMP/Photoshop palette files.
- **URL state encoding** — full editor state encoded in the query string with a "copy share link" button. Bookmarks replace persistence.
- **CLI launcher** — `npx @lumenfast/cli` and `pipx run lumenfast-app` start a local server and open the bundled web app, supporting offline use and direct filesystem export (e.g., write to `tailwind.config.js`).
- **3D RGB cube visualization** — render the helix path through color space.
- **Accessibility presets** — surface palettes that meet AAA contrast for body text.
- **Jupyter widget** — anywidget-based interactive sliders that return a colormap into the kernel.

## Phase 3 and beyond — only if there is demand

- Native desktop app via Tauri, reusing the web frontend.
- Figma plugin for inline palette picking.
- VS Code extension.
