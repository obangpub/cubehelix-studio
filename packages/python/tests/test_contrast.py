from __future__ import annotations

import pytest

from lumenfast import contrast_ratio, pick_text_color

WHITE = (1.0, 1.0, 1.0)
BLACK = (0.0, 0.0, 0.0)


def test_white_vs_black_is_21() -> None:
    assert contrast_ratio(WHITE, BLACK) == pytest.approx(21.0, abs=1e-6)


def test_identical_colors_yield_one() -> None:
    c = (0.42, 0.71, 0.18)
    assert contrast_ratio(c, c) == pytest.approx(1.0, abs=1e-12)


def test_symmetric() -> None:
    a = (0.5, 0.2, 0.8)
    b = (0.1, 0.9, 0.3)
    assert contrast_ratio(a, b) == pytest.approx(contrast_ratio(b, a), abs=1e-12)


def test_pure_red_vs_white_matches_wcag_calculator() -> None:
    red = (1.0, 0.0, 0.0)
    assert contrast_ratio(red, WHITE) == pytest.approx(3.998, abs=0.01)


def test_pick_on_black_returns_white() -> None:
    assert pick_text_color(BLACK) == WHITE


def test_pick_on_white_returns_black() -> None:
    assert pick_text_color(WHITE) == BLACK


def test_pick_on_dark_gray_returns_white() -> None:
    assert pick_text_color((0.2, 0.2, 0.2)) == WHITE


def test_pick_on_light_gray_returns_black() -> None:
    assert pick_text_color((0.85, 0.85, 0.85)) == BLACK


def test_pick_with_custom_candidates() -> None:
    blue = (0.0, 0.0, 0.6)
    yellow = (1.0, 1.0, 0.0)
    light_bg = (0.9, 0.9, 0.9)
    assert pick_text_color(light_bg, [blue, yellow]) == blue


def test_pick_rejects_empty_candidates() -> None:
    with pytest.raises(ValueError, match="at least one candidate"):
        pick_text_color(BLACK, [])
