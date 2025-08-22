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
          Hydrophobicity refers to the tendency of molecules (or parts of molecules) to repel water. AMR proteins often:
        </p>
        <ul>
          <li>Embed in membranes (e.g., efflux pumps) → Need hydrophobic transmembrane regions</li>
          <li>Interact with small molecules like antibiotics → Specific hydrophobic pockets matter</li>
          <li>Exhibit hydrophobic patterns that differ from random proteins</li>
        </ul>
        <p><strong>✅ So: AMR proteins tend to have distinguishable hydrophobicity signatures.</strong></p>
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
