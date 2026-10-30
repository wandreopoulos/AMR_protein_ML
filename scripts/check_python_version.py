"""Check that the current interpreter matches the repository's Python pin."""

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
VERSION_FILE = ROOT / ".python-version"
REQUIRED = tuple(int(part) for part in VERSION_FILE.read_text(encoding="utf-8").strip().split("."))
actual = sys.version_info[:3]

if actual != REQUIRED:
    required = ".".join(str(part) for part in REQUIRED)
    current = ".".join(str(part) for part in actual)
    print(f"AMPstruct requires Python {required}; found Python {current}.", file=sys.stderr)
    raise SystemExit(1)

print(f"Python {'.'.join(str(part) for part in actual)} matches AMPstruct's required version.")
