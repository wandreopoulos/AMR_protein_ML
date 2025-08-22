import React from 'react';

const Widgets = ({ probability }) => (
  <div style={{ width: "80%", margin: "20px auto" }}>
    <p>AMP Probability</p>
    <progress value={probability} max="1" style={{ width: "100%" }}></progress>
  </div>
);

export default Widgets;
