"""WCAG 2.1 contrast utilities."""

from __future__ import annotations

import math
from collections.abc import Sequence


def _linearize(channel: float) -> float:
    if channel <= 0.03928:
        return channel / 12.92
    return math.pow((channel + 0.055) / 1.055, 2.4)


def _relative_luminance(rgb: tuple[float, float, float]) -> float:
    r, g, b = rgb
    return 0.2126 * _linearize(r) + 0.7152 * _linearize(g) + 0.0722 * _linearize(b)


def contrast_ratio(a: tuple[float, float, float], b: tuple[float, float, float]) -> float:
    la = _relative_luminance(a)
    lb = _relative_luminance(b)
    hi, lo = (la, lb) if la >= lb else (lb, la)
    return (hi + 0.05) / (lo + 0.05)


_WHITE: tuple[float, float, float] = (1.0, 1.0, 1.0)
_BLACK: tuple[float, float, float] = (0.0, 0.0, 0.0)


def pick_text_color(
    bg: tuple[float, float, float],
    candidates: Sequence[tuple[float, float, float]] | None = None,
) -> tuple[float, float, float]:
    if candidates is None:
        candidates = (_WHITE, _BLACK)
    if len(candidates) == 0:
        raise ValueError("pick_text_color requires at least one candidate")
    best = candidates[0]
    best_ratio = contrast_ratio(bg, best)
    for candidate in candidates[1:]:
        ratio = contrast_ratio(bg, candidate)
        if ratio > best_ratio:
            best = candidate
            best_ratio = ratio
    return best
