"""Optional, explicit integration with the ProteoCraft CLI.

ProteoCraft is a protein-binder design workflow, not an AMP/AMR classifier.
This adapter keeps that distinction visible and only runs the official CLI
when a separately installed ProteoCraft environment is available.
"""

from __future__ import annotations

import os
import re
import shutil
import subprocess
from pathlib import Path


PROTEIN_RE = re.compile(r"^[ACDEFGHIKLMNPQRSTVWY]+$")
DEFAULT_OUTPUT_ROOT = (
    Path(__file__).resolve().parents[2] / "source" / "proteocraft_runs"
)


def _cli_path() -> str | None:
    return shutil.which(os.environ.get("PROTEOCRAFT_BIN", "proteocraft"))


def status() -> dict:
    """Return installation metadata without importing ProteoCraft."""

    cli = _cli_path()
    root = os.environ.get("PROTEOCRAFT_ROOT")
    return {
        "available": cli is not None,
        "cli": cli,
        "root": root,
        "workflow": "binder_design",
        "supports_amp_amr_classification": False,
        "requirements": {
            "platform": "Linux x86-64",
            "python": "3.12",
            "device": "NVIDIA CUDA GPU",
            "model_storage_gb": 25.6,
        },
    }


def _validate_sequence(sequence: str, field: str) -> str:
    normalized = "".join(sequence.split()).upper()
    if not normalized or not PROTEIN_RE.fullmatch(normalized):
        raise ValueError(
            f"{field} must contain only the 20 standard amino-acid letters."
        )
    return normalized


def design(
    *,
    target: str,
    binder_length: int,
    device: str = "cuda:0",
    output_dir: str | None = None,
) -> dict:
    """Run ProteoCraft's official binder-design CLI when available."""

    cli = _cli_path()
    if cli is None:
        raise RuntimeError(
            "ProteoCraft is not installed in this environment. Install its "
            "separate Linux/CUDA environment and expose the proteocraft CLI."
        )

    target = _validate_sequence(target, "target")
    if not isinstance(binder_length, int) or not 1 <= binder_length <= 2000:
        raise ValueError("binder_length must be an integer between 1 and 2000.")
    if not re.fullmatch(r"(?:cpu|cuda:\d+)", device):
        raise ValueError("device must be 'cpu' or 'cuda:<index>'.")

    root = Path(output_dir) if output_dir else DEFAULT_OUTPUT_ROOT / "api-run"
    root.mkdir(parents=True, exist_ok=True)
    command = [
        cli,
        "--target",
        target,
        "--binder_length",
        str(binder_length),
        "--output_dir",
        str(root),
        "--device",
        device,
    ]
    timeout = int(os.environ.get("PROTEOCRAFT_TIMEOUT_SECONDS", "3600"))
    try:
        completed = subprocess.run(
            command,
            cwd=os.environ.get("PROTEOCRAFT_ROOT") or None,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError(
            f"ProteoCraft exceeded the {timeout}-second timeout."
        ) from exc

    if completed.returncode != 0:
        detail = (completed.stderr or completed.stdout).strip()[-4000:]
        raise RuntimeError(
            f"ProteoCraft exited with code {completed.returncode}: {detail}"
        )

    return {
        "status": "completed",
        "workflow": "binder_design",
        "supports_amp_amr_classification": False,
        "output_dir": str(root),
        "stdout": completed.stdout[-4000:],
    }
