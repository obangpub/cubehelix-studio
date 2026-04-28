# cubehelix-studio

Cubehelix color palettes that survive grayscale, colorblindness, and print. Zero runtime dependencies; matplotlib integration available behind an optional extra.

## Install

```bash
pip install cubehelix-studio            # core only
pip install "cubehelix-studio[viz]"     # with matplotlib adapter
# or with uv:
uv add cubehelix-studio
uv add "cubehelix-studio[viz]"
```

## Usage

```python
from cubehelix_studio import CubehelixParams, cubehelix, sample_sequential, to_hex

# Single point on the curve
mid = cubehelix(0.5, CubehelixParams())

# 9 evenly-spaced samples (endpoints included)
palette = sample_sequential(CubehelixParams(), 9)
[to_hex(c) for c in palette]
# => ['#000000', '#1c1338', ..., '#ffffff']
```

### Matplotlib integration

```python
from cubehelix_studio import CubehelixParams, to_matplotlib_colormap
import matplotlib.pyplot as plt
import numpy as np

cmap = to_matplotlib_colormap(CubehelixParams(rotations=-2.0, saturation=1.2))
plt.imshow(np.random.rand(64, 64), cmap=cmap)
plt.colorbar()
plt.show()
```

## API

### `CubehelixParams`

Frozen dataclass with fields:

- `start: float = 0.5` - starting hue position
- `rotations: float = -1.5` - rotations through the color wheel
- `saturation: float = 1.0` - chromatic amplitude
- `gamma: float = 1.0` - gamma correction

> Note: matplotlib's `cubehelix_palette` and Dave Green's 2011 paper call the `saturation` field `hue`. It controls chromatic amplitude — when zero, the output is a pure greyscale ramp — so `saturation` is more accurate.

### `cubehelix(t, params) -> tuple[float, float, float]`

Returns the `(r, g, b)` triple at fraction `t` in `[0, 1]`. Each channel is clamped to `[0, 1]`.

### `sample_sequential(params, n) -> list[tuple[float, float, float]]`

Returns `n` colors at evenly-spaced positions `i / (n - 1)`. Requires `n >= 2`.

### `to_hex(rgb) -> str`

Formats an RGB triple as `#rrggbb`.

### `to_rgb_255(rgb) -> tuple[int, int, int]`

Returns the integer 0-255 form of an RGB triple.

### `contrast_ratio(a, b) -> float`

WCAG 2.1 contrast ratio in `[1.0, 21.0]`.

### `pick_text_color(bg, candidates=None) -> tuple[float, float, float]`

Returns whichever candidate has the highest contrast against `bg`. Defaults to `[white, black]`.

### `to_matplotlib_colormap(params, n=256, name="cubehelix_studio")`

Returns a `matplotlib.colors.LinearSegmentedColormap`. Requires the `[viz]` extra.

## Parity with `@cubehelix-studio/core`

This package's math is verified against the same JSON fixture that the TypeScript reference implementation generates (`fixtures/parity.json` at the repo root). Both implementations must agree to within `1e-12` per channel for every parameter combination in the fixture.

## License

MIT
