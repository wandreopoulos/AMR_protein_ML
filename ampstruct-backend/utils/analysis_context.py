"""Analysis-scoped context storage and prompt serialization.

This is intentionally provider-agnostic: no AI API is called here. JSON is
the backend source of truth; TOON is generated only when a future chat layer
requests prompt context.
"""

from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path


CONTEXT_ROOT = Path(__file__).resolve().parents[2] / "runtime" / "analysis_context"
SAFE_KEY = re.compile(r"^[A-Za-z0-9_.:-]+$")


def _context_path(analysis_id: str) -> Path:
    if not SAFE_KEY.fullmatch(analysis_id):
        raise ValueError("Invalid analysis ID.")
    return CONTEXT_ROOT / f"{analysis_id}.json"


def create_context(results: list[dict]) -> dict:
    analysis_id = f"analysis_{uuid.uuid4().hex}"
    context = {
        "analysis_id": analysis_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "source": "AMPstruct",
        "results": results,
    }
    CONTEXT_ROOT.mkdir(parents=True, exist_ok=True)
    _context_path(analysis_id).write_text(
        json.dumps(context, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    return context


def load_context(analysis_id: str) -> dict:
    path = _context_path(analysis_id)
    if not path.exists():
        raise FileNotFoundError("Analysis context was not found.")
    return json.loads(path.read_text(encoding="utf-8"))


def _toon_value(value) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    text = str(value)
    if not text or any(character in text for character in ",\n:\""):
        return json.dumps(text, ensure_ascii=False)
    return text


def to_toon(context: dict) -> str:
    """Encode the stable analysis schema into compact prompt context."""

    results = context.get("results", [])
    fields = [
        "index", "id", "length", "valid", "status", "label", "class_id",
        "score", "score_class_id", "model", "warning", "error",
    ]
    lines = [
        f"analysis_id: {_toon_value(context.get('analysis_id'))}",
        f"created_at: {_toon_value(context.get('created_at'))}",
        f"results[{len(results)}]{{{','.join(fields)}}}:",
    ]
    for position, result in enumerate(results):
        row = [result.get("index", position)]
        row.extend(result.get(field) for field in fields[1:])
        lines.append("  " + ",".join(_toon_value(value) for value in row))
    return "\n".join(lines)
