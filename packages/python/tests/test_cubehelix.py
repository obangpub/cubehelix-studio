from __future__ import annotations

import math

import pytest

from cubehelix_studio import CubehelixParams, cubehelix


def test_t0_default_params_returns_black() -> None:
    r, g, b = cubehelix(0.0, CubehelixParams())
    assert r == pytest.approx(0.0, abs=1e-12)
    assert g == pytest.approx(0.0, abs=1e-12)
    assert b == pytest.approx(0.0, abs=1e-12)


def test_t1_default_params_returns_white() -> None:
    r, g, b = cubehelix(1.0, CubehelixParams())
    assert r == pytest.approx(1.0, abs=1e-12)
    assert g == pytest.approx(1.0, abs=1e-12)
    assert b == pytest.approx(1.0, abs=1e-12)


def test_clamps_into_unit_interval() -> None:
    params = CubehelixParams(start=0.0, rotations=5.0, saturation=5.0, gamma=1.0)
    for i in range(51):
        t = i / 50
        r, g, b = cubehelix(t, params)
        assert 0.0 <= r <= 1.0
        assert 0.0 <= g <= 1.0
        assert 0.0 <= b <= 1.0


def test_saturation_zero_yields_grayscale_ramp() -> None:
    params = CubehelixParams(start=0.0, rotations=0.0, saturation=0.0, gamma=1.0)
    for i in range(11):
        t = i / 10
        r, g, b = cubehelix(t, params)
        assert r == pytest.approx(t, abs=1e-12)
        assert g == pytest.approx(t, abs=1e-12)
        assert b == pytest.approx(t, abs=1e-12)


def test_default_lightness_non_decreasing() -> None:
    params = CubehelixParams()
    prev = -math.inf
    for i in range(41):
        t = i / 40
        r, g, b = cubehelix(t, params)
        lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
        assert lum >= prev - 1e-9
        prev = lum
