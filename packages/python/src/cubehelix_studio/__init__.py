"""Grayscale-safe color palettes from cubehelix."""

from .contrast import contrast_ratio, pick_text_color
from .cvd import PREVIEW_MODES, PreviewMode, apply_preview
from .cubehelix import (
    DEFAULT_CHROMA_FLOOR,
    DEFAULT_CHROMA_PEAK,
    DEFAULT_CHROMA_WIDTH,
    BezierCurve,
    CubehelixParams,
    LightnessCurve,
    PowerCurve,
    SigmoidCurve,
    chroma_envelope,
    cubehelix,
    cubehelix_raw,
    evaluate_lightness_curve,
    invert_lightness_curve,
    was_clamped,
)
from .format import to_hex, to_rgb_255
from .mpl import to_matplotlib_colormap
from .presets import PRESETS, PaletteMode, Preset, get_preset_by_id
from .sampling import sample_sequential

__all__ = [
    "DEFAULT_CHROMA_FLOOR",
    "DEFAULT_CHROMA_PEAK",
    "DEFAULT_CHROMA_WIDTH",
    "PRESETS",
    "PREVIEW_MODES",
    "BezierCurve",
    "CubehelixParams",
    "LightnessCurve",
    "PaletteMode",
    "PowerCurve",
    "Preset",
    "PreviewMode",
    "SigmoidCurve",
    "apply_preview",
    "chroma_envelope",
    "contrast_ratio",
    "cubehelix",
    "cubehelix_raw",
    "evaluate_lightness_curve",
    "get_preset_by_id",
    "invert_lightness_curve",
    "pick_text_color",
    "sample_sequential",
    "to_hex",
    "to_matplotlib_colormap",
    "to_rgb_255",
    "was_clamped",
]
__version__ = "0.0.1"
