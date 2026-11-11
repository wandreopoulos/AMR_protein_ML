import React, { useMemo, useState } from "react";
import "./EmbeddingMap.css";

const COLORS = {
  AMR: "#2563eb",
  "Non-AMR": "#64748b",
  default: "#7c3aed",
};

const EmbeddingMap = ({ sequences, selectedIndex }) => {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [map, setMap] = useState(null);

  const validSequences = useMemo(
    () => sequences.filter(item => item.valid && item.sequence),
    [sequences]
  );

  const buildMap = async () => {
    setStatus("loading");
    setError("");
    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5001";
      const response = await fetch(`${apiUrl}/embedding-map`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sequences: validSequences.map(item => ({
            index: item.index,
            id: item.id,
            sequence: item.sequence,
            valid: item.valid,
            label: item.label,
          })),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Embedding map failed.");
      setMap(payload);
      setStatus("loaded");
    } catch (requestError) {
      setError(requestError.message || "Embedding map failed.");
      setStatus("error");
    }
  };

  const bounds = useMemo(() => {
    if (!map?.points?.length) return null;
    const xs = map.points.map(point => point.x);
    const ys = map.points.map(point => point.y);
    return {
      minX: Math.min(...xs), maxX: Math.max(...xs),
      minY: Math.min(...ys), maxY: Math.max(...ys),
    };
  }, [map]);

  const toX = point => 36 + ((point.x - bounds.minX) / (bounds.maxX - bounds.minX || 1)) * 528;
  const toY = point => 24 + (1 - ((point.y - bounds.minY) / (bounds.maxY - bounds.minY || 1))) * 252;

  return (
    <section className="embedding-map" aria-labelledby="embedding-map-title">
      <div className="embedding-map-header">
        <div>
          <p className="embedding-map-eyebrow">Exploratory analysis</p>
          <h2 id="embedding-map-title">ESM-2 Embedding Map</h2>
        </div>
        <button
          type="button"
          onClick={buildMap}
          disabled={status === "loading" || validSequences.length < 2}
        >
          {status === "loading" ? "Building map…" : map ? "Refresh map" : "Build map"}
        </button>
      </div>
      <p className="embedding-map-description">
        Each point is a valid sequence positioned by its ESM-2 representation. Nearby points are more similar in embedding space; the axes are not biological measurements.
      </p>
      {validSequences.length < 2 && (
        <p className="embedding-map-empty" role="status">Upload at least two valid sequences to compare them.</p>
      )}
      {status === "error" && <p className="embedding-map-error" role="alert">{error}</p>}
      {map && bounds && (
        <>
          <div className="embedding-map-chart-wrap">
            <svg className="embedding-map-chart" viewBox="0 0 600 300" role="img" aria-label="2D t-SNE map of ESM-2 sequence embeddings">
              <line x1="36" y1="276" x2="564" y2="276" className="embedding-axis" />
              <line x1="36" y1="24" x2="36" y2="276" className="embedding-axis" />
              {map.points.map(point => {
                const selected = point.index === selectedIndex;
                return (
                  <circle
                    key={`${point.index}-${point.id}`}
                    cx={toX(point)}
                    cy={toY(point)}
                    r={selected ? 7 : 5}
                    fill={COLORS[point.label] || COLORS.default}
                    className={selected ? "embedding-point selected" : "embedding-point"}
                  >
                    <title>{`${point.id}${point.label ? ` · ${point.label}` : ""}`}</title>
                  </circle>
                );
              })}
            </svg>
          </div>
          <div className="embedding-map-footer">
            <span><i className="legend-dot amr" /> AMR</span>
            <span><i className="legend-dot non-amr" /> Non-AMR</span>
            <span><i className="legend-dot selected" /> Selected sequence</span>
            <span>{map.points.length} sequences · t-SNE · perplexity {map.perplexity}</span>
          </div>
        </>
      )}
    </section>
  );
};

export default EmbeddingMap;
