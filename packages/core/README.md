# @lumenfast/core

Cubehelix color palettes that survive grayscale, colorblindness, and print. Generation, sampling, and WCAG contrast utilities. Zero runtime dependencies.

## Install

```bash
npm install @lumenfast/core
# or
pnpm add @lumenfast/core
```

## Usage

```ts
import {
  cubehelix,
  sampleSequential,
  toHex,
  toCssRgb,
  DEFAULT_CUBEHELIX_PARAMS,
} from "@lumenfast/core";

// Single point on the curve
const mid = cubehelix(0.5, DEFAULT_CUBEHELIX_PARAMS);

// 9 evenly-spaced samples (endpoints included)
const palette = sampleSequential(DEFAULT_CUBEHELIX_PARAMS, 9);

palette.map(toHex);
// → ["#000000", "#1c1338", ..., "#ffffff"]
```

## API

### `cubehelix(t, params): RGB`

Evaluates the cubehelix curve at fraction `t` in `[0, 1]`.

```ts
interface CubehelixParams {
  start: number; // starting hue position; default 0.5
  rotations: number; // rotations through the color wheel; default -1.5
  saturation: number; // chromatic amplitude; default 1.0
  gamma: number; // gamma correction; default 1.0
}

interface RGB {
  r: number; // [0, 1]
  g: number; // [0, 1]
  b: number; // [0, 1]
}
```

### `sampleSequential(params, n): RGB[]`

Returns `n` colors sampled at evenly-spaced positions `i / (n - 1)`. Requires `n >= 2`.

### `toHex(rgb): string`

Formats an `RGB` as `#rrggbb` (lowercase).

### `toCssRgb(rgb): string`

Formats an `RGB` as `rgb(R G B)` using modern space-separated syntax.

### `DEFAULT_CUBEHELIX_PARAMS`

The standard cubehelix parameters: `{ start: 0.5, rotations: -1.5, saturation: 1.0, gamma: 1.0 }`.

> Note: matplotlib's `cubehelix_palette` and Dave Green's original 2011 paper call this parameter `hue`. It controls chromatic amplitude — when zero, the output collapses to a pure greyscale ramp — so `saturation` is more accurate.

### `contrastRatio(a, b): number`

WCAG 2.1 contrast ratio between two colors, in the range `[1, 21]`.

### `pickTextColor(bg, candidates?): RGB`

Returns whichever candidate has the highest contrast against `bg`. Defaults to `[white, black]`. Throws `RangeError` when given an empty candidate list.

```ts
import { pickTextColor, toCssRgb, cubehelix, DEFAULT_CUBEHELIX_PARAMS } from "@lumenfast/core";

const swatch = cubehelix(0.3, DEFAULT_CUBEHELIX_PARAMS);
const text = pickTextColor(swatch);
element.style.backgroundColor = toCssRgb(swatch);
element.style.color = toCssRgb(text);
```

## License

MIT
