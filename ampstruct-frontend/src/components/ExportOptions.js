import React from 'react';

const ExportOptions = () => (
  <div style={{ textAlign: "center", marginTop: "20px" }}>
    <h4>Export</h4>
    <label><input type="checkbox" defaultChecked /> Predictions</label>
    <label style={{ marginLeft: "10px" }}><input type="checkbox" defaultChecked /> Sequences</label>
    <label style={{ marginLeft: "10px" }}><input type="checkbox" defaultChecked /> Structure</label>
    <br /><br />
    <button>Generate Report</button>
  </div>
);

export default ExportOptions;
