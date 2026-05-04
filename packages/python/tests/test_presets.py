from __future__ import annotations

import re

import pytest

from cubehelix_studio import PRESETS, get_preset_by_id
from cubehelix_studio.cubehelix import cubehelix_raw, was_clamped

_ID_PATTERN = re.compile(r"^[a-z0-9-]+$")


def test_each_preset_has_a_unique_id() -> None:
    ids = [p.id for p in PRESETS]
    assert len(set(ids)) == len(ids)


def test_each_preset_id_is_url_safe() -> None:
    for p in PRESETS:
        assert _ID_PATTERN.match(p.id), f"preset id {p.id!r} is not url-safe"


def test_get_preset_by_id_returns_match() -> None:
    for p in PRESETS:
        assert get_preset_by_id(p.id) is p


def test_get_preset_by_id_returns_none_for_unknown_id() -> None:
    assert get_preset_by_id("does-not-exist") is None


@pytest.mark.parametrize("preset", PRESETS, ids=[p.id for p in PRESETS])
def test_preset_stays_in_gamut(preset) -> None:
    for t in (0.0, 0.25, 0.5, 0.75, 1.0):
        rgb = cubehelix_raw(t, preset.params)
        assert not was_clamped(rgb), f"preset {preset.id} clamps at t={t}"


def test_classic_preset_is_present() -> None:
    classic = get_preset_by_id("classic")
    assert classic is not None
    assert classic.mode == "sequential"
