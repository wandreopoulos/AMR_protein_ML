from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from utils.fasta_parser import parse_fasta

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

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

        return jsonify({"results": sequences})

    except Exception as e:
        print(f"❌ Error during FASTA parsing: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)
