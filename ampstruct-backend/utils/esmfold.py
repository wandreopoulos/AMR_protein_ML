"""ESMFold structure prediction through the official public API.

The local ESMFold implementation needs OpenFold/CUDA. The public API lets the
Mac development environment request a real ESMFold structure without claiming
that the existing demo PDB is sequence-specific.
"""

from __future__ import annotations

import os
import re
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ESMFOLD_API_URL = os.environ.get(
    "ESMFOLD_API_URL", "https://api.esmatlas.com/foldSequence/v1/pdb/"
)
PROTEIN_RE = re.compile(r"^[ACDEFGHIKLMNPQRSTVWY]+$")
MAX_SEQUENCE_LENGTH = 400  # Current public ESM Atlas API request limit.


def status() -> dict:
    return {
        "available": True,
        "mode": "remote_api",
        "provider": "Meta ESM Metagenomic Atlas API",
        "model": "ESMFold",
        "sequence_specific": True,
        "local_cuda_mode": False,
    }


def fold_sequence(sequence: str) -> dict:
    normalized = "".join(sequence.split()).upper()
    if not normalized or not PROTEIN_RE.fullmatch(normalized):
        raise ValueError(
            "sequence must contain only the 20 standard amino-acid letters."
        )
    if len(normalized) > MAX_SEQUENCE_LENGTH:
        raise ValueError(
            f"sequence has {len(normalized)} residues; the public ESMFold service "
            f"supports at most {MAX_SEQUENCE_LENGTH} residues. Use a local "
            "ESMFold deployment for longer sequences."
        )

    request = Request(
        ESMFOLD_API_URL,
        data=normalized.encode("ascii"),
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "text/plain",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=int(os.environ.get("ESMFOLD_TIMEOUT_SECONDS", "300"))) as response:
            pdb = response.read().decode("utf-8")
    except (HTTPError, URLError, TimeoutError) as exc:
        raise RuntimeError(f"ESMFold request failed: {exc}") from exc

    if not pdb.startswith(("HEADER", "ATOM", "MODEL", "REMARK")):
        raise RuntimeError("ESMFold returned an invalid structure response.")

    return {
        "status": "completed",
        "model": "ESMFold",
        "provider": "Meta ESM Metagenomic Atlas API",
        "sequence_length": len(normalized),
        "pdb": pdb,
    }
