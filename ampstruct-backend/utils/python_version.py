"""Enforce the interpreter version used to verify AMPstruct inference."""

from pathlib import Path
import sys


PROJECT_ROOT = Path(__file__).resolve().parents[2]
VERSION_FILE = PROJECT_ROOT / ".python-version"
REQUIRED_PYTHON = tuple(
    int(part) for part in VERSION_FILE.read_text(encoding="utf-8").strip().split(".")
)


def ensure_supported_python():
    actual = sys.version_info[:3]
    if actual != REQUIRED_PYTHON:
        required = ".".join(str(part) for part in REQUIRED_PYTHON)
        current = ".".join(str(part) for part in actual)
        raise RuntimeError(
            f"AMPstruct requires Python {required}; found Python {current}. "
            f"Create the environment with the interpreter pinned in {VERSION_FILE.name}."
        )
