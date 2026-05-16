"""Color-vision-deficiency and grayscale preview transforms."""

from __future__ import annotations

from typing import Literal, get_args

PreviewMode = Literal["normal", "grayscale", "protanopia", "deuteranopia", "tritanopia"]

PREVIEW_MODES: tuple[PreviewMode, ...] = get_args(PreviewMode)

# Machado, Oliveira, Fernandes (2009) "A Physiologically-based Model for
# Simulation of Color Vision Deficiency". Severity 1.0 matrices applied in
# linear-sRGB space.
_PROTANOPIA_MATRIX: tuple[float, ...] = (
    0.152286,
    1.052583,
    -0.204868,
    0.114503,
    0.786281,
    0.099216,
    -0.003882,
    -0.048116,
    1.051998,
)
_DEUTERANOPIA_MATRIX: tuple[float, ...] = (
    0.367322,
    0.860646,
    -0.227968,
    0.280085,
    0.672501,
    0.047413,
    -0.011820,
    0.042940,
    0.968881,
)
_TRITANOPIA_MATRIX: tuple[float, ...] = (
    1.255528,
    -0.076749,
    -0.178779,
    -0.078411,
    0.930809,
    0.147602,
    0.004733,
    0.691367,
    0.303900,
)

# BT.709 luma coefficients for sRGB.
_LUMA_R = 0.2126
_LUMA_G = 0.7152
_LUMA_B = 0.0722


def _srgb_to_linear(c: float) -> float:
    if c <= 0.0:
        return 0.0
    if c >= 1.0:
        return 1.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _linear_to_srgb(c: float) -> float:
    if c <= 0.0:
        return 0.0
    if c >= 1.0:
        return 1.0
    return c * 12.92 if c <= 0.0031308 else 1.055 * c ** (1.0 / 2.4) - 0.055


def _apply_matrix_linear(
    rgb: tuple[float, float, float], m: tuple[float, ...]
) -> tuple[float, float, float]:
    r = _srgb_to_linear(rgb[0])
    g = _srgb_to_linear(rgb[1])
    b = _srgb_to_linear(rgb[2])
    r2 = m[0] * r + m[1] * g + m[2] * b
    g2 = m[3] * r + m[4] * g + m[5] * b
    b2 = m[6] * r + m[7] * g + m[8] * b
    return (_linear_to_srgb(r2), _linear_to_srgb(g2), _linear_to_srgb(b2))


def _apply_grayscale(rgb: tuple[float, float, float]) -> tuple[float, float, float]:
    r = _srgb_to_linear(rgb[0])
    g = _srgb_to_linear(rgb[1])
    b = _srgb_to_linear(rgb[2])
    y = _LUMA_R * r + _LUMA_G * g + _LUMA_B * b
    out = _linear_to_srgb(y)
    return (out, out, out)


def apply_preview(rgb: tuple[float, float, float], mode: PreviewMode) -> tuple[float, float, float]:
    """Return ``rgb`` after applying the named preview transform."""
    if mode == "normal":
        return rgb
    if mode == "grayscale":
        return _apply_grayscale(rgb)
    if mode == "protanopia":
        return _apply_matrix_linear(rgb, _PROTANOPIA_MATRIX)
    if mode == "deuteranopia":
        return _apply_matrix_linear(rgb, _DEUTERANOPIA_MATRIX)
    if mode == "tritanopia":
        return _apply_matrix_linear(rgb, _TRITANOPIA_MATRIX)
    raise ValueError(f"unknown preview mode: {mode!r}")
