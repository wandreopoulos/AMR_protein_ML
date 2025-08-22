import React, { useEffect, useRef } from "react";
import "./Structure3D.css";

const Structure3D = ({ sequence }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/ngl@latest/dist/ngl.js";
    script.async = true;
    script.onload = () => {
      const stage = new window.NGL.Stage(containerRef.current);
      stage.loadFile("rcsb://1CRN", { defaultRepresentation: true }); // sample PDB
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div className="structure3d">
      <h3>🔬 3D Structure Viewer</h3>
      <div ref={containerRef} className="ngl-container" />
    </div>
  );
};

export default Structure3D;
