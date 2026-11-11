import React, { useState } from "react";
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
  const [expanded, setExpanded] = useState(false);
  const structure = mockSecondaryStructure(sequence);

  return (
    <div className="structure2d">
      <div className="structure2d-header">
        <div>
          <p className="structure2d-eyebrow">Sequence view</p>
          <h3>Secondary Structure Preview</h3>
        </div>
        <button
          type="button"
          className="structure2d-toggle"
          aria-expanded={expanded}
          aria-controls="secondary-structure-content"
          onClick={() => setExpanded(current => !current)}
        >
          {expanded ? "Hide preview" : "Show preview"}
        </button>
      </div>
      <p className="structure2d-note">
        Illustrative residue view. The sequence-specific ESMFold result is shown in the 3D viewer below.
      </p>
      {expanded && (
        <div id="secondary-structure-content" className="structure2d-content">
          <div className="structure2d-row">
            <span className="structure2d-label">Sequence</span>
            <code className="structure2d-sequence">{sequence}</code>
          </div>
          <div className="structure2d-row">
            <span className="structure2d-label">Preview</span>
            <code className="structure2d-sequence">{structure}</code>
          </div>
          <div className="structure2d-legend" aria-label="Secondary structure legend">
            <span><b>H</b> helix</span>
            <span><b>E</b> strand</span>
            <span><b>C</b> coil</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Structure2D;
