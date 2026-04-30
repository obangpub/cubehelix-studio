from __future__ import annotations

import math

import pytest

from cubehelix_studio import (
    BezierCurve,
    CubehelixParams,
    PowerCurve,
    SigmoidCurve,
    cubehelix,
    evaluate_lightness_curve,
)


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
    params = CubehelixParams(start=0.0, rotations=5.0, saturation=5.0)
    for i in range(51):
        t = i / 50
        r, g, b = cubehelix(t, params)
        assert 0.0 <= r <= 1.0
        assert 0.0 <= g <= 1.0
        assert 0.0 <= b <= 1.0


def test_saturation_zero_yields_grayscale_ramp() -> None:
    params = CubehelixParams(start=0.0, rotations=0.0, saturation=0.0)
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


def test_power_curve_default_is_identity() -> None:
    curve = PowerCurve()
    for i in range(11):
        t = i / 10
        assert evaluate_lightness_curve(curve, t) == pytest.approx(t, abs=1e-12)


def test_power_curve_endpoints_are_zero_and_one() -> None:
    for gamma in (0.5, 1.0, 1.5, 2.0):
        curve = PowerCurve(gamma=gamma)
        assert evaluate_lightness_curve(curve, 0.0) == 0.0
        assert evaluate_lightness_curve(curve, 1.0) == 1.0


def test_sigmoid_curve_endpoints_and_monotonic() -> None:
    curve = SigmoidCurve(steepness=4.0, midpoint=0.5)
    assert evaluate_lightness_curve(curve, 0.0) == 0.0
    assert evaluate_lightness_curve(curve, 1.0) == 1.0
    prev = -math.inf
    for i in range(101):
        v = evaluate_lightness_curve(curve, i / 100)
        assert v >= prev - 1e-12
        prev = v


def test_sigmoid_steepness_zero_is_linear() -> None:
    curve = SigmoidCurve(steepness=0.0, midpoint=0.5)
    for i in range(11):
        t = i / 10
        assert evaluate_lightness_curve(curve, t) == pytest.approx(t, abs=1e-12)


def test_bezier_curve_default_is_identity() -> None:
    curve = BezierCurve()
    for i in range(11):
        t = i / 10
        assert evaluate_lightness_curve(curve, t) == pytest.approx(t, abs=1e-9)


def test_bezier_curve_endpoints_and_monotonic() -> None:
    curve = BezierCurve(p1=(0.4, 0.0), p2=(0.6, 1.0))
    assert evaluate_lightness_curve(curve, 0.0) == 0.0
    assert evaluate_lightness_curve(curve, 1.0) == 1.0
    prev = -math.inf
    for i in range(101):
        v = evaluate_lightness_curve(curve, i / 100)
        assert v >= prev - 1e-12
        prev = v


def test_lightness_range_endpoints_respected() -> None:
    params = CubehelixParams(lightness_min=0.2, lightness_max=0.8, saturation=0.0)
    r0, g0, b0 = cubehelix(0.0, params)
    r1, g1, b1 = cubehelix(1.0, params)
    assert r0 == pytest.approx(0.2, abs=1e-12)
    assert g0 == pytest.approx(0.2, abs=1e-12)
    assert b0 == pytest.approx(0.2, abs=1e-12)
    assert r1 == pytest.approx(0.8, abs=1e-12)
    assert g1 == pytest.approx(0.8, abs=1e-12)
    assert b1 == pytest.approx(0.8, abs=1e-12)
