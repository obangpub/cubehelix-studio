from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from cubehelix_studio import (
    BezierCurve,
    CubehelixParams,
    LightnessCurve,
    PowerCurve,
    SigmoidCurve,
    cubehelix,
)

FIXTURE_PATH = Path(__file__).resolve().parents[3] / "fixtures" / "parity.json"
TOLERANCE = 1e-12

_CAMEL_TO_SNAKE = re.compile(r"(?<!^)(?=[A-Z])")


def _to_snake_case_keys(params: dict[str, Any]) -> dict[str, Any]:
    return {_CAMEL_TO_SNAKE.sub("_", key).lower(): value for key, value in params.items()}


def _curve_from_dict(d: dict[str, Any]) -> LightnessCurve:
    kind = d["kind"]
    if kind == "power":
        return PowerCurve(gamma=float(d["gamma"]))
    if kind == "sigmoid":
        return SigmoidCurve(steepness=float(d["steepness"]), midpoint=float(d["midpoint"]))
    if kind == "bezier":
        p1 = d["p1"]
        p2 = d["p2"]
        return BezierCurve(p1=(float(p1[0]), float(p1[1])), p2=(float(p2[0]), float(p2[1])))
    raise ValueError(f"unknown curve kind: {kind!r}")


def _params_from_dict(p: dict[str, Any]) -> CubehelixParams:
    snake = _to_snake_case_keys(p)
    if "lightness_curve" in snake and isinstance(snake["lightness_curve"], dict):
        snake["lightness_curve"] = _curve_from_dict(snake["lightness_curve"])
    return CubehelixParams(**snake)


def test_parity_with_typescript_core() -> None:
    assert FIXTURE_PATH.exists(), f"parity fixture missing at {FIXTURE_PATH}"
    fixture: dict[str, Any] = json.loads(FIXTURE_PATH.read_text())
    entries = fixture["entries"]
    assert entries, "fixture has no entries"
    for entry in entries:
        params = _params_from_dict(entry["params"])
        for sample in entry["samples"]:
            r, g, b = cubehelix(sample["t"], params)
            dr = abs(r - sample["r"])
            dg = abs(g - sample["g"])
            db = abs(b - sample["b"])
            assert dr < TOLERANCE, f"r drift at params={entry['params']} t={sample['t']}: dr={dr}"
            assert dg < TOLERANCE, f"g drift at params={entry['params']} t={sample['t']}: dg={dg}"
            assert db < TOLERANCE, f"b drift at params={entry['params']} t={sample['t']}: db={db}"
