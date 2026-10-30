import React, { useEffect, useRef, useState } from "react";
import "./Structure3D.css";

const Structure3D = ({ pdbId = "1CRN" }) => {
  const containerRef = useRef(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    let stage;
    let script;
    setStatus('loading');
    const loadViewer = () => {
      if (cancelled || !containerRef.current) return;
      try {
        stage = new window.NGL.Stage(containerRef.current);
        const pdbUrl = `https://files.rcsb.org/download/${pdbId}.pdb`;
        stage.loadFile(pdbUrl, { defaultRepresentation: true })
          .then(() => { if (!cancelled) setStatus('loaded'); })
          .catch(() => { if (!cancelled) setStatus('error'); });
      } catch {
        if (!cancelled) setStatus('error');
      }
    };

    if (window.NGL) {
      loadViewer();
    } else {
      script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/ngl@2.0.0-dev.39/dist/ngl.js";
      script.async = true;
      script.onload = loadViewer;
      script.onerror = () => { if (!cancelled) setStatus('error'); };
      document.body.appendChild(script);
    }
    return () => {
      cancelled = true;
      script?.remove();
      stage?.dispose();
    };
  }, [pdbId]);

  return (
    <div className="structure3d-wrapper">
      <h4>🧬 3D Structure Viewer</h4>
      {status === 'loading' && <p role="status">Loading 3D viewer…</p>}
      {status === 'error' && <p role="status">The 3D viewer is unavailable. Sequence results and downloads are still available.</p>}
      <div ref={containerRef} className="structure3d-canvas" role="img" aria-label={`3D structure viewer for PDB ${pdbId}`} hidden={status === 'error'}></div>
    </div>
  );
};

export default Structure3D;
