from __future__ import annotations

import math

import pytest

from cubehelix_studio import PREVIEW_MODES, apply_preview

SAMPLES: list[tuple[float, float, float]] = [
    (0.0, 0.0, 0.0),
    (1.0, 1.0, 1.0),
    (0.5, 0.5, 0.5),
    (1.0, 0.0, 0.0),
    (0.0, 1.0, 0.0),
    (0.0, 0.0, 1.0),
    (0.25, 0.6, 0.85),
]


def test_normal_mode_is_identity() -> None:
    for rgb in SAMPLES:
        assert apply_preview(rgb, "normal") == rgb


def test_grayscale_produces_equal_channels() -> None:
    for rgb in SAMPLES:
        r, g, b = apply_preview(rgb, "grayscale")
        assert math.isclose(r, g, abs_tol=1e-12)
        assert math.isclose(g, b, abs_tol=1e-12)


def test_grayscale_endpoints_are_invariant() -> None:
    assert apply_preview((1.0, 1.0, 1.0), "grayscale") == (1.0, 1.0, 1.0)
    assert apply_preview((0.0, 0.0, 0.0), "grayscale") == (0.0, 0.0, 0.0)


@pytest.mark.parametrize("mode", [m for m in PREVIEW_MODES if m != "normal"])
def test_preview_keeps_channels_in_range(mode: str) -> None:
    for rgb in SAMPLES:
        r, g, b = apply_preview(rgb, mode)  # type: ignore[arg-type]
        assert 0.0 <= r <= 1.0
        assert 0.0 <= g <= 1.0
        assert 0.0 <= b <= 1.0


@pytest.mark.parametrize("mode", ["protanopia", "deuteranopia", "tritanopia"])
def test_white_survives_cvd_as_white(mode: str) -> None:
    r, g, b = apply_preview((1.0, 1.0, 1.0), mode)  # type: ignore[arg-type]
    assert math.isclose(r, 1.0, abs_tol=1e-6)
    assert math.isclose(g, 1.0, abs_tol=1e-6)
    assert math.isclose(b, 1.0, abs_tol=1e-6)


@pytest.mark.parametrize("mode", ["protanopia", "deuteranopia", "tritanopia"])
def test_black_maps_to_black(mode: str) -> None:
    assert apply_preview((0.0, 0.0, 0.0), mode) == (0.0, 0.0, 0.0)  # type: ignore[arg-type]


@pytest.mark.parametrize("mode", ["protanopia", "deuteranopia", "tritanopia"])
def test_cvd_is_deterministic(mode: str) -> None:
    rgb = (0.4, 0.7, 0.2)
    assert apply_preview(rgb, mode) == apply_preview(rgb, mode)  # type: ignore[arg-type]


def test_preview_modes_set() -> None:
    assert PREVIEW_MODES == (
        "normal",
        "grayscale",
        "protanopia",
        "deuteranopia",
        "tritanopia",
    )
