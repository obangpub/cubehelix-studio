"""Sequential sampling of the cubehelix curve."""

from __future__ import annotations

from .cubehelix import CubehelixParams, cubehelix


def sample_sequential(params: CubehelixParams, n: int) -> list[tuple[float, float, float]]:
    if isinstance(n, bool) or not isinstance(n, int) or n < 2:
        raise ValueError(f"sample_sequential requires n >= 2 integer; got {n!r}")
    return [cubehelix(i / (n - 1), params) for i in range(n)]
