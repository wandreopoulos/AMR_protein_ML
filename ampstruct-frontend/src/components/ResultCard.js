import React from 'react';

const ResultCard = ({ item }) => (
  <div
    style={{
      background: "#f4f4f4",
      padding: "15px",
      borderRadius: "8px",
      margin: "15px auto",
      width: "80%",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
    }}
  >
    <p><strong>Sequence ID:</strong> {item.id}</p>
    <p><strong>Predicted AMP:</strong> {item.predicted_amp} ({item.probability})</p>
    <p><strong>BLAST Similarity:</strong> {item.blast_similarity}</p>
    <p><strong>BLAST Score:</strong> {item.blast_score}</p>
  </div>
);

export default ResultCard;
