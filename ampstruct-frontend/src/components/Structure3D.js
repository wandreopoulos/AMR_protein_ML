import React, { useEffect, useRef, useState } from "react";
import "./Structure3D.css";

const Structure3D = ({ pdbData, status = "idle" }) => {
  const containerRef = useRef(null);
  const [viewerStatus, setViewerStatus] = useState('idle');

  useEffect(() => {
    let cancelled = false;
    let stage;
    let script;
    if (!pdbData) {
      setViewerStatus(status === "error" ? "error" : status === "loading" ? "loading" : "empty");
      return undefined;
    }
    const loadViewer = () => {
      if (cancelled || !containerRef.current) return;
      try {
        stage = new window.NGL.Stage(containerRef.current);
        const pdbFile = new Blob([pdbData], { type: "text/plain" });
        stage.loadFile(pdbFile, { defaultRepresentation: true })
          .then(() => { if (!cancelled) setViewerStatus('loaded'); })
          .catch(() => { if (!cancelled) setViewerStatus('error'); });
      } catch {
        if (!cancelled) setViewerStatus('error');
      }
    };

    if (window.NGL) {
      loadViewer();
    } else {
      script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/ngl@2.0.0-dev.39/dist/ngl.js";
      script.async = true;
      script.onload = loadViewer;
      script.onerror = () => { if (!cancelled) setViewerStatus('error'); };
      document.body.appendChild(script);
    }
    return () => {
      cancelled = true;
      script?.remove();
      stage?.dispose();
    };
  }, [pdbData, status]);

  return (
    <div className="structure3d-wrapper">
      <h4>🧬 3D Structure Viewer</h4>
      {viewerStatus === 'loading' && <p role="status">Loading 3D viewer…</p>}
      {viewerStatus === 'empty' && <p role="status">No ESMFold structure predicted yet.</p>}
      {viewerStatus === 'error' && <p role="status">The 3D viewer is unavailable. Sequence results and downloads are still available.</p>}
      <div ref={containerRef} className="structure3d-canvas" role="img" aria-label="ESMFold predicted 3D structure viewer" hidden={!pdbData || viewerStatus === 'error'}></div>
    </div>
  );
};

export default Structure3D;
