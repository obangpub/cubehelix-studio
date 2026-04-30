"""Cubehelix curve evaluation."""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Union


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


@dataclass(frozen=True)
class CubehelixParams:
    start: float = 0.5
    rotations: float = -1.5
    saturation: float = 1.0
    lightness_curve: LightnessCurve = field(default_factory=PowerCurve)
    lightness_min: float = 0.0
    lightness_max: float = 1.0
    reverse: bool = False


def _clamp01(x: float) -> float:
    if x < 0.0:
        return 0.0
    if x > 1.0:
        return 1.0
    return x


def cubehelix_raw(t: float, params: CubehelixParams) -> tuple[float, float, float]:
    t_eff = 1.0 - t if params.reverse else t
    curve_t = evaluate_lightness_curve(params.lightness_curve, t_eff)
    fraction = params.lightness_min + (params.lightness_max - params.lightness_min) * curve_t
    # Angle parameterized by the user's visible position (t_eff), so `rotations`
    # means turns over the visible palette regardless of lightness range or curve.
    angle = 2.0 * math.pi * (params.start / 3.0 + params.rotations * t_eff + 1.0)
    amp = (params.saturation * fraction * (1.0 - fraction)) / 2.0
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
