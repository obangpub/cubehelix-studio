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
