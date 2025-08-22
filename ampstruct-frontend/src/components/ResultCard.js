import React from 'react';
import './ResultCard.css';

const ResultCard = ({ item }) => (
  <div className="result-card">
    <p><strong>Sequence ID:</strong> {item.id}</p>
    <p><strong>Length:</strong> {item.length} aa</p>
    <p><strong>Valid Sequence:</strong> {item.valid ? "✅ Yes" : "❌ No"}</p>
    <div className="sequence-preview">
      {item.sequence}
    </div>
  </div>
);

export default ResultCard;
