from __future__ import annotations

import pytest

from lumenfast import CubehelixParams, sample_sequential


def test_returns_n_samples_with_endpoints() -> None:
    samples = sample_sequential(CubehelixParams(), 5)
    assert len(samples) == 5
    assert samples[0] == (0.0, 0.0, 0.0)
    r, g, b = samples[-1]
    assert r == pytest.approx(1.0, abs=1e-12)
    assert g == pytest.approx(1.0, abs=1e-12)
    assert b == pytest.approx(1.0, abs=1e-12)


def test_rejects_n_less_than_two() -> None:
    for n in (1, 0, -3):
        with pytest.raises(ValueError, match="requires n >= 2"):
            sample_sequential(CubehelixParams(), n)


def test_rejects_non_integer_n() -> None:
    with pytest.raises(ValueError, match="requires n >= 2"):
        sample_sequential(CubehelixParams(), 3.5)  # type: ignore[arg-type]


def test_rejects_bool_as_n() -> None:
    with pytest.raises(ValueError, match="requires n >= 2"):
        sample_sequential(CubehelixParams(), True)  # type: ignore[arg-type]
