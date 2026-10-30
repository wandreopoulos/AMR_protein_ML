"""Run the local experimental classifier on the downloaded public pilot panel."""

import argparse
import csv
import hashlib
import json
from pathlib import Path
import time


def main():
    public_dir = Path(__file__).resolve().parent.parent / "source" / "public"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, default=public_dir / "manifest.csv")
    args = parser.parse_args()

    from app import MODEL_PATH, classify_sequence
    from utils.fasta_parser import parse_fasta

    manifest = args.manifest.resolve()
    with manifest.open(newline="", encoding="utf-8") as handle:
        samples = list(csv.DictReader(handle))
    if not samples:
        raise ValueError("The benchmark manifest contains no samples.")

    results = []
    for sample in samples:
        records = parse_fasta(manifest.parent / sample["relative_fasta"])
        if len(records) != 1 or not records[0]["valid"]:
            raise ValueError(f"Expected one valid protein: {sample['relative_fasta']}")
        sequence = records[0]["sequence"]
        sequence_hash = hashlib.sha256(sequence.encode("ascii")).hexdigest()
        if sequence_hash != sample["sequence_sha256"]:
            raise ValueError(f"Sequence checksum mismatch: {sample['accession']}")
        start = time.monotonic()
        prediction = classify_sequence(sequence)
        expected = int(sample["expected_class"])
        result = {
            "accession": sample["accession"],
            "protein_name": sample["protein_name"],
            "expected_class": expected,
            "label_basis": sample["label_basis"],
            "predicted_class": prediction["class_id"],
            "class_0_score": prediction["class_scores"]["0"],
            "class_1_score": prediction["class_scores"]["1"],
            "agrees_with_provisional_mapping": prediction["class_id"] == expected,
            "exact_match_in_supplied_card": sample["exact_match_in_supplied_card"],
            "length": len(sequence),
            "elapsed_seconds": round(time.monotonic() - start, 3),
        }
        results.append(result)
        print(json.dumps(result), flush=True)

    matrix = [[0, 0], [0, 0]]
    for result in results:
        matrix[result["expected_class"]][result["predicted_class"]] += 1
    total = len(results)
    agreements = sum(result["agrees_with_provisional_mapping"] for result in results)
    summary = {
        "sample_count": total,
        "agreements": agreements,
        "provisional_label_agreement": agreements / total,
        "amr_reference_count": sum(r["expected_class"] == 1 for r in results),
        "presumed_non_amr_control_count": sum(r["expected_class"] == 0 for r in results),
        "confusion_matrix": matrix,
        "matrix_rows": ["presumed_non_amr_control", "amr_reference"],
        "matrix_columns": ["predicted_class_0", "predicted_class_1"],
        "exact_matches_in_supplied_card": sum(r["exact_match_in_supplied_card"] == "true" for r in results),
        "model": MODEL_PATH.name,
        "model_sha256": hashlib.sha256(MODEL_PATH.read_bytes()).hexdigest(),
        "class_mapping": {"0": "Non-AMR (provisional)", "1": "AMR (provisional)"},
        "accuracy_validated": False,
        "training_overlap_unknown": True,
        "limitations": [
            "Small, manually selected diagnostic panel; not an independent accuracy estimate.",
            "Negative labels are annotation-based metabolic controls, not experimentally proven absence of AMR function.",
            "The XGBoost training labels and complete training data are unavailable.",
            "Exact-match screening against supplied CARD is not a homology or training-set exclusion test.",
            "Scores are uncalibrated; do not reverse the class mapping to improve this panel's results.",
        ],
    }
    output = manifest.parent / "benchmark_results.csv"
    with output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(results[0]))
        writer.writeheader()
        writer.writerows(results)
    (manifest.parent / "benchmark_summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, indent=2), flush=True)


if __name__ == "__main__":
    main()
