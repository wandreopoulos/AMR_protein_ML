import React from "react";
import "./Structure2D.css";

const mockSecondaryStructure = (sequence) => {
  // Dummy example: Alternate H, E, C
  const states = ["H", "E", "C"];
  return sequence
    .split("")
    .map((_, i) => states[i % 3])
    .join("");
};

const Structure2D = ({ sequence }) => {
  const structure = mockSecondaryStructure(sequence);

  return (
    <div className="structure2d">
      <h3>🧠 Predicted Secondary Structure</h3>
      <div className="seq-line">{sequence}</div>
      <div className="struct-line">{structure}</div>
    </div>
  );
};

export default Structure2D;
