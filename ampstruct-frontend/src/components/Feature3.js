import React from "react";
import Structure2D from "./Structure2D";
import Structure3D from "./Structure3D";
import "./Feature3.css";

const Feature3 = ({ sequence }) => {
  return (
    <div className="feature3-container">
      <h2>🔬 Feature 3: Structure Prediction</h2>
      <p className="feature3-desc">
        Predict and explore 2D/3D structural characteristics of antimicrobial sequences.
      </p>

      <Structure2D sequence={sequence} />
      <Structure3D sequence={sequence} />
    </div>
  );
};

export default Feature3;
