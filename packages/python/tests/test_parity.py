from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from cubehelix_studio import CubehelixParams, cubehelix

FIXTURE_PATH = Path(__file__).resolve().parents[3] / "fixtures" / "parity.json"
TOLERANCE = 1e-12


def test_parity_with_typescript_core() -> None:
    assert FIXTURE_PATH.exists(), f"parity fixture missing at {FIXTURE_PATH}"
    fixture: dict[str, Any] = json.loads(FIXTURE_PATH.read_text())
    entries = fixture["entries"]
    assert entries, "fixture has no entries"
    for entry in entries:
        params = CubehelixParams(**entry["params"])
        for sample in entry["samples"]:
            r, g, b = cubehelix(sample["t"], params)
            dr = abs(r - sample["r"])
            dg = abs(g - sample["g"])
            db = abs(b - sample["b"])
            assert dr < TOLERANCE, f"r drift at params={entry['params']} t={sample['t']}: dr={dr}"
            assert dg < TOLERANCE, f"g drift at params={entry['params']} t={sample['t']}: dg={dg}"
            assert db < TOLERANCE, f"b drift at params={entry['params']} t={sample['t']}: db={db}"
