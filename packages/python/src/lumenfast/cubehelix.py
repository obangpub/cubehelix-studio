"""Cubehelix curve evaluation."""

from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass(frozen=True)
class CubehelixParams:
    start: float = 0.5
    rotations: float = -1.5
    hue: float = 1.0
    gamma: float = 1.0


def _clamp01(x: float) -> float:
    if x < 0.0:
        return 0.0
    if x > 1.0:
        return 1.0
    return x


def cubehelix(t: float, params: CubehelixParams) -> tuple[float, float, float]:
    fraction = t**params.gamma
    angle = 2.0 * math.pi * (params.start / 3.0 + params.rotations * t + 1.0)
    amp = (params.hue * fraction * (1.0 - fraction)) / 2.0
    cos_a = math.cos(angle)
    sin_a = math.sin(angle)
    r = fraction + amp * (-0.14861 * cos_a + 1.78277 * sin_a)
    g = fraction + amp * (-0.29227 * cos_a - 0.90649 * sin_a)
    b = fraction + amp * (1.97294 * cos_a)
    return _clamp01(r), _clamp01(g), _clamp01(b)
