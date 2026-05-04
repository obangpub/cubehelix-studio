"""Curated cubehelix palette presets."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from .cubehelix import CubehelixParams

PaletteMode = Literal["sequential", "diverging"]


@dataclass(frozen=True)
class Preset:
    id: str
    name: str
    description: str
    mode: PaletteMode
    params: CubehelixParams


PRESETS: tuple[Preset, ...] = (
    Preset(
        id="classic",
        name="Classic",
        description="Green's 2011 defaults; the canonical cubehelix ramp.",
        mode="sequential",
        params=CubehelixParams(),
    ),
    Preset(
        id="embers",
        name="Embers",
        description="Near-black through deep red into orange and yellow.",
        mode="sequential",
        params=CubehelixParams(
            start=1.0,
            rotations=0.4,
            saturation_min=1.4,
            saturation_max=1.4,
        ),
    ),
    Preset(
        id="tidewater",
        name="Tidewater",
        description="Navy through teal to pale cyan; cool sequential.",
        mode="sequential",
        params=CubehelixParams(
            start=2.6,
            rotations=0.5,
            saturation_min=1.25,
            saturation_max=1.25,
        ),
    ),
    Preset(
        id="foxglove",
        name="Foxglove",
        description="Forest green through dusty rose to soft pink.",
        mode="sequential",
        params=CubehelixParams(
            start=2.0,
            rotations=1.2,
            saturation_min=1.15,
            saturation_max=1.15,
        ),
    ),
    Preset(
        id="lichen",
        name="Lichen",
        description="Charcoal through olive to pale chartreuse; earthy and muted.",
        mode="sequential",
        params=CubehelixParams(
            start=1.7,
            rotations=0.3,
            saturation_min=0.7,
            saturation_max=0.7,
        ),
    ),
    Preset(
        id="iris",
        name="Iris",
        description="Deep indigo through violet to pale lavender.",
        mode="sequential",
        params=CubehelixParams(
            start=0.4,
            rotations=0.4,
            saturation_min=1.1,
            saturation_max=1.1,
        ),
    ),
)


def get_preset_by_id(preset_id: str) -> Preset | None:
    for preset in PRESETS:
        if preset.id == preset_id:
            return preset
    return None
