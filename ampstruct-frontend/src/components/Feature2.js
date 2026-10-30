import React, { useEffect, useRef } from "react";
import "./Feature2.css";

const Feature2 = ({ sequence }) => {
  const containerRef = useRef();

  // Generate annotation data from sequence
  const generateAnnotations = (sequence) => {
    const hydrophobic = new Set(['A', 'V', 'I', 'L', 'M', 'F', 'W', 'Y']);
    const polar = new Set(['R', 'N', 'D', 'Q', 'E', 'K', 'S', 'T', 'H', 'Y']);

    const annotations = [];

    for (let i = 0; i < sequence.length; i++) {
      const aa = sequence[i];
      if (hydrophobic.has(aa)) {
        annotations.push({
          name: `Hydrophobic (${aa})`,
          start: i + 1,
          end: i + 1,
          color: "#a8e6cf"
        });
      } else if (polar.has(aa)) {
        annotations.push({
          name: `Polar (${aa})`,
          start: i + 1,
          end: i + 1,
          color: "#ffb6b9"
        });
      }
    }

    return annotations;
  };

  useEffect(() => {
    const container = containerRef.current;
    let cancelled = false;
    let script;
    const renderViewer = () => {
      if (!cancelled && window.Sequence && container && sequence) {
        container.innerHTML = ""; // Clear previous content

        const annotations = generateAnnotations(sequence);

        new window.Sequence({
          sequence,
          target: container,
          format: "FASTA",
          id: "biojs-seq",
          toolbar: true,
          zoom: true,
          badge: false,
          search: true,
          annotations,
        });
      }
    };

    if (!window.Sequence) {
      script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/biojs-vis-sequence@0.1.23/build/biojs-vis-sequence.min.js";
      script.async = true;
      script.onload = renderViewer;
      document.body.appendChild(script);
    } else {
      renderViewer();
    }
    return () => {
      cancelled = true;
      script?.remove();
      if (container) container.innerHTML = '';
    };
  }, [sequence]);

  return (
    <div className="feature2-container">
      <h2>🧬 Interactive Sequence Viewer (BioJS)</h2>
      <p className="feature2-desc">
        Explore amino acids, zoom in, or inspect potential structural domains.
      </p>
      <div ref={containerRef} className="biojs-viewer"></div>
    </div>
  );
};

export default Feature2;
