"""matplotlib colormap adapter (requires the [viz] extra)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from .cubehelix import CubehelixParams
from .sampling import sample_sequential

if TYPE_CHECKING:
    from matplotlib.colors import LinearSegmentedColormap


def to_matplotlib_colormap(
    params: CubehelixParams, n: int = 256, name: str = "cubehelix_studio"
) -> LinearSegmentedColormap:
    try:
        from matplotlib.colors import LinearSegmentedColormap
    except ImportError as e:
        raise ImportError(
            "to_matplotlib_colormap requires matplotlib; "
            "install with 'pip install cubehelix-studio[viz]' "
            "or 'uv add \"cubehelix-studio[viz]\"'"
        ) from e
    samples = sample_sequential(params, n)
    return LinearSegmentedColormap.from_list(name, samples, N=n)
