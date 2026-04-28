from __future__ import annotations

import pytest

from cubehelix_studio import CubehelixParams


def test_returns_linear_segmented_colormap() -> None:
    pytest.importorskip("matplotlib")
    from matplotlib.colors import LinearSegmentedColormap

    from cubehelix_studio import to_matplotlib_colormap

    cmap = to_matplotlib_colormap(CubehelixParams(), n=64, name="test")
    assert isinstance(cmap, LinearSegmentedColormap)
    assert cmap.N == 64
    assert cmap.name == "test"


def test_default_args_produce_a_cmap() -> None:
    pytest.importorskip("matplotlib")
    from cubehelix_studio import to_matplotlib_colormap

    cmap = to_matplotlib_colormap(CubehelixParams())
    assert cmap.N == 256
    assert cmap.name == "cubehelix_studio"


def test_endpoint_colors_match_cubehelix_endpoints() -> None:
    pytest.importorskip("matplotlib")
    from cubehelix_studio import cubehelix, to_matplotlib_colormap

    params = CubehelixParams()
    cmap = to_matplotlib_colormap(params, n=256)
    expected_start = cubehelix(0.0, params)
    expected_end = cubehelix(1.0, params)
    start_rgba = cmap(0.0)
    end_rgba = cmap(1.0)
    assert start_rgba[0] == pytest.approx(expected_start[0], abs=1e-12)
    assert start_rgba[1] == pytest.approx(expected_start[1], abs=1e-12)
    assert start_rgba[2] == pytest.approx(expected_start[2], abs=1e-12)
    assert end_rgba[0] == pytest.approx(expected_end[0], abs=1e-12)
    assert end_rgba[1] == pytest.approx(expected_end[1], abs=1e-12)
    assert end_rgba[2] == pytest.approx(expected_end[2], abs=1e-12)
