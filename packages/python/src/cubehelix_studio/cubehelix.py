"""Cubehelix curve evaluation."""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Union

DEFAULT_CHROMA_PEAK = 0.5
DEFAULT_CHROMA_WIDTH = 1.0
DEFAULT_CHROMA_FLOOR = 0.0

# Peak amplitude calibration: at (peak=0.5, width=1, floor=0) the chroma
# envelope reduces to f * (1 - f) / 2 (the original cubehelix envelope).
# The normalized shape peaks at 1 and the original envelope peaks at 0.125,
# so the calibration constant is 0.125.
_PEAK_AMPLITUDE = 0.125


@dataclass(frozen=True)
class PowerCurve:
    gamma: float = 1.0
    kind: str = "power"


@dataclass(frozen=True)
class SigmoidCurve:
    steepness: float = 4.0
    midpoint: float = 0.5
    kind: str = "sigmoid"


@dataclass(frozen=True)
class BezierCurve:
    p1: tuple[float, float] = (1.0 / 3.0, 1.0 / 3.0)
    p2: tuple[float, float] = (2.0 / 3.0, 2.0 / 3.0)
    kind: str = "bezier"


LightnessCurve = Union[PowerCurve, SigmoidCurve, BezierCurve]


def _logistic(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def _evaluate_sigmoid(t: float, steepness: float, midpoint: float) -> float:
    if steepness == 0.0:
        return t
    a = _logistic(steepness * (0.0 - midpoint))
    b = _logistic(steepness * (1.0 - midpoint))
    if b == a:
        return t
    return (_logistic(steepness * (t - midpoint)) - a) / (b - a)


def _bezier_component(s: float, c1: float, c2: float) -> float:
    om_s = 1.0 - s
    return 3.0 * om_s * om_s * s * c1 + 3.0 * om_s * s * s * c2 + s * s * s


def _bezier_component_deriv(s: float, c1: float, c2: float) -> float:
    om_s = 1.0 - s
    return 3.0 * om_s * om_s * c1 + 6.0 * om_s * s * (c2 - c1) + 3.0 * s * s * (1.0 - c2)


def _bezier_solve_s(target: float, x1: float, x2: float) -> float:
    s = target
    for _ in range(8):
        x = _bezier_component(s, x1, x2) - target
        if abs(x) < 1e-12:
            return s
        dx = _bezier_component_deriv(s, x1, x2)
        if abs(dx) < 1e-12:
            break
        s -= x / dx
        if s < 0.0:
            s = 0.0
        elif s > 1.0:
            s = 1.0
    lo = 0.0
    hi = 1.0
    s = target
    for _ in range(60):
        x = _bezier_component(s, x1, x2)
        if abs(x - target) < 1e-12:
            return s
        if x < target:
            lo = s
        else:
            hi = s
        s = (lo + hi) / 2.0
    return s


def _evaluate_bezier(
    t: float,
    p1: tuple[float, float],
    p2: tuple[float, float],
) -> float:
    s = _bezier_solve_s(t, p1[0], p2[0])
    return _bezier_component(s, p1[1], p2[1])


def evaluate_lightness_curve(curve: LightnessCurve, t: float) -> float:
    if t <= 0.0:
        return 0.0
    if t >= 1.0:
        return 1.0
    if isinstance(curve, PowerCurve):
        return t**curve.gamma
    if isinstance(curve, SigmoidCurve):
        return _evaluate_sigmoid(t, curve.steepness, curve.midpoint)
    if isinstance(curve, BezierCurve):
        return _evaluate_bezier(t, curve.p1, curve.p2)
    raise TypeError(f"unsupported curve type: {type(curve).__name__}")


def invert_lightness_curve(curve: LightnessCurve, target: float) -> float:
    """Inverse of evaluate_lightness_curve.

    Returns u in [0, 1] such that evaluate_lightness_curve(curve, u) == target.
    Assumes curves are monotonic non-decreasing.
    """
    if target <= 0.0:
        return 0.0
    if target >= 1.0:
        return 1.0
    lo = 0.0
    hi = 1.0
    for _ in range(40):
        mid = (lo + hi) / 2.0
        if evaluate_lightness_curve(curve, mid) < target:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2.0


def chroma_envelope(fraction: float, peak: float, width: float, floor: float) -> float:
    """Multiplier of `saturation` that gives the chroma amplitude at `fraction`.

    At defaults (peak=0.5, width=1, floor=0) this collapses to f * (1 - f) / 2.
    """
    if fraction <= 0.0 or fraction >= 1.0:
        return floor * _PEAK_AMPLITUDE
    total = 2.0 / width
    a = peak * total
    b = (1.0 - peak) * total
    shape_at_peak = (peak**a) * ((1.0 - peak) ** b)
    if shape_at_peak <= 0.0 or not math.isfinite(shape_at_peak):
        return floor * _PEAK_AMPLITUDE
    shape = (fraction**a) * ((1.0 - fraction) ** b)
    normalized = shape / shape_at_peak
    envelope = (1.0 - floor) * normalized + floor
    return envelope * _PEAK_AMPLITUDE


@dataclass(frozen=True)
class CubehelixParams:
    start: float = 0.5
    rotations: float = -1.5
    saturation_min: float = 1.0
    saturation_max: float = 1.0
    lightness_curve: LightnessCurve = field(default_factory=PowerCurve)
    lightness_axis_min: float = 0.0
    lightness_axis_max: float = 1.0
    chroma_peak: float = DEFAULT_CHROMA_PEAK
    chroma_width: float = DEFAULT_CHROMA_WIDTH
    chroma_floor: float = DEFAULT_CHROMA_FLOOR
    reverse: bool = False


def _clamp01(x: float) -> float:
    if x < 0.0:
        return 0.0
    if x > 1.0:
        return 1.0
    return x


def cubehelix_raw(t: float, params: CubehelixParams) -> tuple[float, float, float]:
    t_eff = 1.0 - t if params.reverse else t
    # The cubehelix is a fixed curve in cube space, parameterized by u in [0,1]
    # along the lightness axis from black to white. `rotations` is the number
    # of hue turns over that full axis. The lightness range clips the helix to
    # the sub-arc where the curve output lies in [lightness_axis_min, lightness_axis_max];
    # the visible palette traverses that sub-arc, so a narrower range exposes
    # fewer hue rotations.
    u_min = invert_lightness_curve(params.lightness_curve, params.lightness_axis_min)
    u_max = invert_lightness_curve(params.lightness_curve, params.lightness_axis_max)
    u = u_min + (u_max - u_min) * t_eff
    fraction = evaluate_lightness_curve(params.lightness_curve, u)
    angle = 2.0 * math.pi * (params.start / 3.0 + params.rotations * u + 1.0)
    # Saturation interpolates linearly along the visible window so users can
    # fade chroma toward one end. Collapses to a single value when min == max.
    saturation = params.saturation_min + (params.saturation_max - params.saturation_min) * t_eff
    amp = saturation * chroma_envelope(
        fraction, params.chroma_peak, params.chroma_width, params.chroma_floor
    )
    cos_a = math.cos(angle)
    sin_a = math.sin(angle)
    r = fraction + amp * (-0.14861 * cos_a + 1.78277 * sin_a)
    g = fraction + amp * (-0.29227 * cos_a - 0.90649 * sin_a)
    b = fraction + amp * (1.97294 * cos_a)
    return r, g, b


def cubehelix(t: float, params: CubehelixParams) -> tuple[float, float, float]:
    r, g, b = cubehelix_raw(t, params)
    return _clamp01(r), _clamp01(g), _clamp01(b)


def was_clamped(rgb: tuple[float, float, float]) -> bool:
    r, g, b = rgb
    return r < 0.0 or r > 1.0 or g < 0.0 or g > 1.0 or b < 0.0 or b > 1.0
