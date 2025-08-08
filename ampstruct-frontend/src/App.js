import React, { useState } from "react";
import Header from "./components/Header";
import FileUploader from "./components/FileUploader";
import ResultCard from "./components/ResultCard";
import Widgets from "./components/Widgets";
import StructureViewer from "./components/StructureViewer";
import ExportOptions from "./components/ExportOptions";

function App() {
  const [results, setResults] = useState([]);

  return (
    <div className="App" style={{ fontFamily: "Arial, sans-serif" }}>
      <Header />
      <FileUploader onFileUpload={setResults} />

      {Array.isArray(results) && results.length > 0 && (
        <>
          <h2 style={{ textAlign: "center", marginTop: "40px" }}>Analysis Results</h2>
          {results.map((item, idx) => (
            <div key={idx}>
              <ResultCard item={item} />
              <Widgets probability={item.probability} />
              <StructureViewer confidence={0.81} />
            </div>
          ))}
          <ExportOptions />
        </>
      )}
    </div>
  );
}

export default App;
