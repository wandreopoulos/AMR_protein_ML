"""Generate an exploratory 2D map from ESM-2 sequence embeddings."""

from __future__ import annotations

import numpy as np
from sklearn.manifold import TSNE

from utils.esm_embedding import get_esm_embedding


def build_embedding_map(records: list[dict]) -> dict:
    valid_records = [record for record in records if record.get("valid", True)]
    if len(valid_records) < 2:
        raise ValueError("At least two valid sequences are required to build an embedding map.")
    if len(valid_records) > 250:
        raise ValueError("The embedding map supports at most 250 sequences per request.")

    embeddings = np.vstack([
        get_esm_embedding(record["sequence"])
        for record in valid_records
    ])
    # t-SNE requires perplexity < n_samples. Keep the notebook's value of 30
    # when possible and use a conservative value for small uploads.
    perplexity = min(30.0, max(1.0, (len(valid_records) - 1) / 3.0))
    coordinates = TSNE(
        n_components=2,
        perplexity=perplexity,
        random_state=42,
        init="random",
        learning_rate="auto",
    ).fit_transform(embeddings)

    return {
        "status": "completed",
        "method": "t-SNE",
        "model": "ESM-2 esm2_t33_650M_UR50D",
        "perplexity": perplexity,
        "random_state": 42,
        "exploratory": True,
        "points": [
            {
                "index": record.get("index", position),
                "id": record.get("id", f"Sequence {position + 1}"),
                "label": record.get("label"),
                "x": float(coordinates[position, 0]),
                "y": float(coordinates[position, 1]),
            }
            for position, record in enumerate(valid_records)
        ],
    }
