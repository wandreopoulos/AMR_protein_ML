import React from 'react';

const StructureViewer = ({ confidence }) => (
  <div style={{ textAlign: "center" }}>
    <img src="/ngl_viewer_placeholder.png" alt="NGL Viewer" width="200" />
    <p>Model Confidence (pTM): {confidence}</p>
    <p style={{ color: "#e67e22" }}>
      ⚠️ Confidence dropped 42% compared to original
    </p>
  </div>
);

export default StructureViewer;
