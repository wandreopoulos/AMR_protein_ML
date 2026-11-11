import React, { useState } from "react";
import Structure2D from "./Structure2D";
import Structure3D from "./Structure3D";
import "./Feature3.css";

const Feature3 = ({ sequence }) => {
    const [status, setStatus] = useState("idle");
    const [pdb, setPdb] = useState("");
    const [error, setError] = useState("");

    const predictStructure = async () => {
        setStatus("loading");
        setError("");
        setPdb("");
        try {
            const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5001";
            const response = await fetch(`${apiUrl}/esmfold/fold`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sequence }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || "ESMFold prediction failed.");
            setPdb(payload.pdb);
            setStatus("loaded");
        } catch (requestError) {
            const message = requestError.message || "ESMFold prediction failed.";
            setError(message.includes("413")
                ? "This sequence is too long for the public ESMFold service. Try a sequence of 400 residues or fewer, or use a local ESMFold deployment."
                : message);
            setStatus("error");
        }
    };

    return (
        <div className="feature3-container">
            <h2>🔬 Feature 3: Structure Prediction</h2>
            <p className="feature3-desc">
                Request a sequence-specific ESMFold 3D structure when needed. This is a structure prediction, not an AMP/AMR classification.
            </p>

            <button type="button" onClick={predictStructure} disabled={status === "loading"}>
                {status === "loading" ? "Predicting structure…" : "Predict with ESMFold"}
            </button>
            {status === "error" && <p className="feature3-error" role="alert">{error}</p>}

            <div className="feature3-structure-blocks">
                <Structure2D sequence={sequence} />
                <Structure3D sequence={sequence} pdbData={pdb} status={status} />
            </div>
        </div>
    );
};

export default Feature3;
