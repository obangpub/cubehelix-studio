from __future__ import annotations

from lumenfast import to_hex, to_rgb_255


def test_to_hex_white() -> None:
    assert to_hex((1.0, 1.0, 1.0)) == "#ffffff"


def test_to_hex_black() -> None:
    assert to_hex((0.0, 0.0, 0.0)) == "#000000"


def test_to_hex_rounds_to_nearest_byte() -> None:
    assert to_hex((0.5, 0.5, 0.5)) == "#808080"


def test_to_hex_pads_single_hex_digit_channels() -> None:
    assert to_hex((1 / 255, 0.0, 0.0)) == "#010000"


def test_to_rgb_255() -> None:
    assert to_rgb_255((1.0, 0.5, 0.0)) == (255, 128, 0)
