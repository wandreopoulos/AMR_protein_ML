import React, { useEffect, useRef } from "react";
import "./Structure3D.css";

const Structure3D = ({ pdbId = "1CRN" }) => {
  const stageRef = useRef(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/ngl@2.0.0-dev.39/dist/ngl.js";
    script.async = true;
    script.onload = () => {
      const stage = new window.NGL.Stage("ngl-container");

      // ✅ SAFER: Use direct URL to avoid 'rcsb://' issue
      const pdbUrl = `https://files.rcsb.org/download/${pdbId}.pdb`;
      stage.loadFile(pdbUrl, { defaultRepresentation: true });

      stageRef.current = stage;
    };

    document.body.appendChild(script);
  }, [pdbId]);

  return (
    <div className="structure3d-wrapper">
      <h4>🧬 3D Structure Viewer</h4>
      <div id="ngl-container" className="structure3d-canvas"></div>
    </div>
  );
};

export default Structure3D;
