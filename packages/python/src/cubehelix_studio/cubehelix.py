"""Cubehelix curve evaluation."""

from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass(frozen=True)
class CubehelixParams:
    start: float = 0.5
    rotations: float = -1.5
    saturation: float = 1.0
    gamma: float = 1.0
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
    inv_gamma = 1.0 / params.gamma
    u_min = params.lightness_min**inv_gamma
    u_max = params.lightness_max**inv_gamma
    u = u_min + (u_max - u_min) * t_eff
    fraction = u**params.gamma
    # Angle parameterized by the user's visible position (t_eff), so `rotations`
    # means turns over the visible palette regardless of lightness range.
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
