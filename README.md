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

The mental model the libraries and the web app are built around:

- **The RGB cube is fixed.** Its black and white corners are anchored at lightness 0 and 1. The cube does not change.
- **The helix is a curve inside that cube**, parameterized by `u ∈ [0, 1]` along the diagonal from black to white. Its shape is set by:
  - `start` — the hue offset at the black corner
  - `rotations` — the number of hue turns over the full black-to-white axis
  - `saturation` and the chroma envelope (`chromaPeak`, `chromaWidth`, `chromaFloor`) — how far the helix bulges away from the diagonal
- **The lightness curve reshapes the lightness profile along the helix**, accelerating or decelerating how lightness rises with `u`. It does not change which colors lie on the helix, only how the parameter is paced.
- **The lightness axis bounds clip the helix to a sub-arc.** Setting `[lightnessAxisMin, lightnessAxisMax]` keeps the black and white corners exactly where they are; it discards the portion of the helix whose lightness falls outside that window. The visible palette traverses only the sub-arc that survives.

A direct consequence: narrowing the axis bounds exposes fewer hue cycles within the visible palette. With `rotations = 3` over the full axis, restricting to `[0.4, 0.6]` shows roughly the middle 20% of the helix and therefore roughly `3 × 0.2 = 0.6` hue cycles. This is intentional — `rotations` describes the helix in cube space, not the visible palette.

The 3D cube view in the web app draws the full helix and shades the in-range sub-arc; the swatches, gradients, and exports all sample that same sub-arc.

## Repository layout

```text
packages/core/      @cubehelix-studio/core (TypeScript)
packages/python/    cubehelix-studio (PyPI)
apps/web/           @cubehelix-studio/web (Vite + React)
fixtures/           parity.json — shared test fixture
scripts/            parity fixture generator
```

## Development

Requires Node `>=20` (a `.nvmrc` pins the recommended version) and Python `>=3.10`.

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
