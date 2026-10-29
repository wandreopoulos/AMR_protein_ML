// src/components/Feature1.js
import React from 'react';
import './Feature1.css';

const hydrophobicAAs = ['A', 'V', 'I', 'L', 'M', 'F', 'Y', 'W'];
const polarAAs = ['R', 'N', 'D', 'Q', 'E', 'K', 'S', 'T', 'H'];

const colorizeSequence = (sequence, type) => {
  return sequence.split('').map((aa, index) => {
    let className = '';
    if (type === 'hydrophobicity') {
      className = hydrophobicAAs.includes(aa)
        ? 'hydrophobic'
        : 'hydrophilic';
    } else if (type === 'polarity') {
      className = polarAAs.includes(aa)
        ? 'polar'
        : 'non-polar';
    }

    return (
      <span key={index} className={`aa ${className}`}>
        {aa}
      </span>
    );
  });
};

const Feature1 = ({ sequence }) => {
  return (
    <div className="feature1-container">
      <h2>Feature 1: Color-Based Sequence Highlights</h2>

      <section className="highlight-section">
        <h3>Hydrophobicity</h3>
        <p>
          Hydrophobicity describes how strongly amino acids tend to avoid water. It can help researchers inspect sequence patterns and possible membrane-associated regions.
        </p>
        <ul>
          <li>Hydrophobic residues often occur in membrane-spanning regions.</li>
          <li>Hydrophobic patterns can also appear in buried regions of folded proteins.</li>
          <li>This visualization describes the sequence; it does not determine AMR status by itself.</li>
        </ul>
        <div className="sequence-box">{colorizeSequence(sequence, 'hydrophobicity')}</div>
      </section>

      <section className="highlight-section">
        <h3>Polarity</h3>
        <p>
          Polarity describes how amino acids interact with water:
          polar amino acids tend to interact with the outside environment,
          while non-polar ones are often buried inside proteins.
        </p>
        <div className="sequence-box">{colorizeSequence(sequence, 'polarity')}</div>
      </section>
    </div>
  );
};

export default Feature1;
