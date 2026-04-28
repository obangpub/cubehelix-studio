# lumenfast

Cubehelix color palettes that survive grayscale, colorblindness, and print.

`lumenfast` provides three ways to generate and consume cubehelix-based palettes:

- **`@lumenfast/core`** — TypeScript library (npm). Pure functions for generating cubehelix curves, sampling discrete palettes, and computing WCAG contrast. Zero runtime dependencies.
- **`lumenfast`** — Python library (PyPI). Same math, plus a `to_matplotlib_colormap()` adapter for scientific plotting workflows.
- **`@lumenfast/web`** — interactive web app. Sliders for cubehelix parameters, live gradient and swatch previews, contrast-aware text suggestions.

The two libraries are independent implementations kept in lockstep by a shared parity fixture at `fixtures/parity.json`.

## Why cubehelix

Dave Green's cubehelix curve traces a helix through RGB space whose luminance is monotonic. Palettes sampled from it remain interpretable when:

- Printed in grayscale
- Viewed by people with color-vision differences
- Reproduced on degraded media

This makes cubehelix a strong default for sequential data visualization, scientific figures, and UI palettes that need to survive accessibility constraints.

## Repository layout

```
packages/core/      @lumenfast/core (TypeScript)
packages/python/    lumenfast (PyPI)
apps/web/           @lumenfast/web (Vite + React)
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

## License

MIT — see [LICENSE](LICENSE).
