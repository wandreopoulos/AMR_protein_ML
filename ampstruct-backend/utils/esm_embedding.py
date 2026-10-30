"""Lazy ESM-2 embedding generation for the prediction API."""

import os
from argparse import Namespace
from pathlib import Path

# The experimental XGBoost/ESM combination crashes in native model loading on
# macOS with multiple OpenMP threads. Configure before importing either runtime.
os.environ["OMP_NUM_THREADS"] = "1"

import numpy as np
import torch
from esm import pretrained


_model = None
_alphabet = None
_batch_converter = None


def _default_model_path() -> Path:
    # Supplied weights are kept separate from downloaded public test fixtures.
    return Path(__file__).resolve().parents[2] / "source" / "provided" / "model" / "esm2_t33_650M_UR50D.pt"


def _load_model():
    global _model, _alphabet, _batch_converter

    if _model is not None:
        return

    model_path = Path(os.environ.get("ESM_MODEL_PATH", _default_model_path()))
    if not model_path.exists():
        raise FileNotFoundError(
            f"ESM-2 model weights not found at {model_path}. "
            "Set ESM_MODEL_PATH to the local esm2_t33_650M_UR50D.pt file."
        )

    # This is a trusted local model artifact, not an untrusted upload. The
    # checkpoint is a state-dict bundle. Loading through the core constructor
    # avoids requiring optional contact-regression weights, which are not
    # needed for sequence embeddings.
    with torch.serialization.safe_globals([Namespace]):
        model_data = torch.load(model_path, map_location="cpu", weights_only=False)
        _model, _alphabet = pretrained.load_model_and_alphabet_core(
            model_path.stem,
            model_data,
            None,
        )
    _batch_converter = _alphabet.get_batch_converter()
    _model.eval()


def get_esm_embedding(sequence: str) -> np.ndarray:
    """Return the mean-pooled layer-33 ESM-2 embedding for one sequence."""

    _load_model()
    _, _, tokens = _batch_converter([("sequence", sequence)])
    with torch.no_grad():
        output = _model(tokens, repr_layers=[33], return_contacts=False)
        representations = output["representations"][33]
        embedding = representations[0, 1 : len(sequence) + 1].mean(0)

    return embedding.cpu().numpy().astype(np.float32)
