from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from pathlib import Path
from threading import Lock
from utils.fasta_parser import parse_fasta
# Initialize the single-thread OpenMP setting before importing the classifier.
from utils.esm_embedding import get_esm_embedding
import joblib

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = Path(os.environ.get(
    "CLASSIFIER_MODEL_PATH",
    BASE_DIR / "source" / "provided" / "model" / "amr_pipeline_xgb.pkl",
))

_classifier = None
_inference_lock = Lock()


def get_classifier():
    global _classifier
    if _classifier is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Classifier model not found at {MODEL_PATH}. "
                "Set CLASSIFIER_MODEL_PATH to the experimental StandardScaler/XGBoost pipeline."
            )
        _classifier = joblib.load(MODEL_PATH)
        _classifier.steps[-1][1].set_params(n_jobs=1)
    return _classifier


def classify_sequence(sequence):
    # Serialize inference and lazy initialization within this API worker.
    with _inference_lock:
        return _classify_sequence(sequence)


def _classify_sequence(sequence):
    embedding = get_esm_embedding(sequence)
    classifier = get_classifier()
    expected_features = getattr(classifier, "n_features_in_", None)
    if expected_features is not None and embedding.shape != (expected_features,):
        raise ValueError(
            f"Feature shape mismatch: expected {expected_features}, got {embedding.shape[0]}"
        )

    features = embedding.reshape(1, -1)
    class_id = int(classifier.predict(features)[0])
    probabilities = classifier.predict_proba(features)[0]
    classes = [int(value) for value in classifier.classes_]
    probability_by_class = {
        str(label): float(probability)
        for label, probability in zip(classes, probabilities)
    }

    # This notebook mapping is provisional for the separate XGBoost artifact.
    class_one_label = os.environ.get("CLASS_ONE_LABEL", "AMR")
    class_zero_label = os.environ.get("CLASS_ZERO_LABEL", "Non-AMR")
    label = class_one_label if class_id == 1 else class_zero_label
    target = os.environ.get("PREDICTION_TARGET", "AMR")

    return {
        "class_id": class_id,
        "label": label,
        "target": target,
        "score": probability_by_class.get("1"),
        "score_class_id": 1,
        "class_scores": probability_by_class,
        "calibration_verified": False,
        "label_mapping_verified": False,
        "warning": (
            "Experimental XGBoost result. Class labels provisionally follow the "
            "notebook (0 = Non-AMR, 1 = AMR); artifact label semantics and "
            "score calibration are unverified."
        ),
        "model": MODEL_PATH.name,
        "status": "experimental",
    }

@app.route("/predict", methods=["POST"])
def predict():
    print("🔁 Received request at /predict")

    if 'file' not in request.files:
        print("❌ No file part in request")
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    print(f"📁 Received file: {file.filename}")

    if file.filename == '':
        print("❌ No selected file")
        return jsonify({"error": "No selected file"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)
    print(f"💾 File saved to: {file_path}")

    try:
        sequences = parse_fasta(file_path)
        print(f"✅ Parsed {len(sequences)} sequences")

        for result in sequences:
            if not result["valid"]:
                result.update({"status": "invalid"})
                continue

            prediction = classify_sequence(result["sequence"])
            result.update(prediction)

        return jsonify({"results": sequences})

    except Exception as e:
        print(f"❌ Error during FASTA parsing: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)
