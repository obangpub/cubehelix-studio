# Cubehelix Studio

Cubehelix color palettes that survive grayscale, colorblindness, and print.

Cubehelix Studio provides three ways to generate and consume cubehelix-based palettes:

- **`@cubehelix-studio/core`** — TypeScript library (npm). Pure functions for generating cubehelix curves, sampling discrete palettes, and computing WCAG contrast. Zero runtime dependencies.
- **`cubehelix-studio`** — Python library (PyPI). Same math, plus a `to_matplotlib_colormap()` adapter for scientific plotting workflows.
- **`@cubehelix-studio/web`** — interactive web app. Sliders for cubehelix parameters, live gradient and swatch previews, contrast-aware text suggestions.

The two libraries are independent implementations kept in lockstep by a shared parity fixture at `fixtures/parity.json`.

## Why cubehelix

Dave Green's cubehelix curve traces a helix through RGB space whose luminance is monotonic. Palettes sampled from it remain interpretable when:

- Printed in grayscale
- Viewed by people with color-vision differences
- Reproduced on degraded media

This makes cubehelix a strong default for sequential data visualization, scientific figures, and UI palettes that need to survive accessibility constraints.

## Model

A palette traces a helix through the RGB cube — hence the name cubehelix. Four ideas stack up:

**1. The cube is the workspace.** RGB coordinates from `(0, 0, 0)` (black) to `(1, 1, 1)` (white). It doesn't change.

**2. The helix's ends are anchored at the black and white corners.** Its shape between them is parameter-controlled:

- `start` — the hue offset at the black anchor
- `rotations` — the number of hue turns from black to white
- `saturation`, `chromaPeak`, `chromaWidth`, `chromaFloor` — how far the helix bulges from the cube's grey diagonal at each point along it

**3. The lightness curve paces how you walk along the helix.** Power, sigmoid, or bezier — these accelerate or decelerate the lightness rise as the helix parameter `u` advances from `0` (black) to `1` (white). They don't change which colors lie on the helix, only how the curve is traversed.

**4. The lightness axis bounds clip the helix to a sub-arc.** `[lightnessAxisMin, lightnessAxisMax]` selects the portion whose lightness output lies inside that window — the visible palette traverses only the surviving sub-arc.

A consequence worth knowing: narrowing the axis bounds exposes fewer hue cycles within the visible palette. With `rotations = 3` over the full axis, restricting to `[0.4, 0.6]` shows roughly the middle 20% of the helix and therefore roughly `3 × 0.2 = 0.6` hue cycles. This is intentional — `rotations` describes the helix in cube space, not the visible palette.

The 3D cube view in the web app draws the full helix and highlights the in-range sub-arc; the swatches, gradients, and exports all sample from that same sub-arc.

## Repository layout

```text
packages/core/      @cubehelix-studio/core (TypeScript)
packages/python/    cubehelix-studio (PyPI)
apps/web/           @cubehelix-studio/web (Vite + React)
docs/               design notes and policies
fixtures/           parity.json — shared test fixture
scripts/            parity fixture generator
```

Design notes live in [docs/](docs/), including the [UI state policy](docs/ui-state-policy.md)
that governs how web app state is URL-synced, persisted, and reset.

## Development

Requires Node `>=22` (pinned in `.nvmrc`) and Python `>=3.10`.

```bash
# JS side
pnpm install
pnpm test
pnpm build

# Python side
cd packages/python
uv sync --all-extras
uv run pytest
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the parity-fixture workflow that keeps the TypeScript and Python implementations aligned, the full list of CI checks, and release tagging conventions.

## Citation

The cubehelix scheme is from:

> Green, D. A., 2011, "A colour scheme for the display of astronomical intensity images", _Bulletin of the Astronomical Society of India_, 39, 289. <https://people.phy.cam.ac.uk/dag9/CUBEHELIX/>

If you use cubehelix in a publication, please cite this paper.

## License

MIT — see [LICENSE](LICENSE). The MIT license covers this codebase; it does not extend to the cubehelix algorithm itself, which is described in the paper above.
