# Renderer / core boundary (web app)

The cubehelix math has exactly one canonical home: `packages/core`. The
TypeScript and Python libraries are kept byte-identical by `fixtures/parity.json`
(see [CONTRIBUTING.md](../CONTRIBUTING.md)). A renderer in `apps/web` that
recomputes any part of that math by hand is a third implementation with no
fixture guarding it — if the core constants change, the renderer drifts
silently.

## Rule

Any code in `apps/web` that evaluates the helix — per pixel, per segment, per
sample, or once — must obtain its color geometry from a `@cubehelix-studio/core`
entry point. The web app must not inline the basis vectors, the angle formula,
the lightness-axis inversion, or the chroma envelope.

This is the same "one canonical implementation" discipline the TS/Python parity
contract enforces, applied to the renderer.

## Entry points

| Need                                               | Use                        |
| -------------------------------------------------- | -------------------------- |
| A finished color at parameter `t`                  | `cubehelix(t, params)`     |
| A color before gamut clipping                      | `cubehelixRaw(t, params)`  |
| Helix geometry to recombine at a custom saturation | `helixGeometry(t, params)` |

`helixGeometry` returns `{ fraction, envelope, dr, dg, db }`. A renderer that
varies saturation independently of `t` — for example a 2D field where one axis
is saturation — reconstructs each channel as
`fraction + saturation * envelope * direction`. This keeps the basis vectors
and the angle formula inside core while leaving the saturation choice, which is
a rendering concern, in the web app.

## When core has no entry point for what you need

Add one to core rather than inlining the math in the web app. A new core export
ships with the parity fixture that guards it; an inlined copy in `apps/web` does
not. If the addition changes any existing output, mirror it in the Python
implementation and regenerate the fixture in the same PR, per CONTRIBUTING.md.
