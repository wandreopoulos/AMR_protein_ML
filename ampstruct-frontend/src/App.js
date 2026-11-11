import React, { useState } from "react";
import Header from "./components/Header";
import FileUploader from "./components/FileUploader";
import ResultCard from "./components/ResultCard";
import ResultsToolbar from "./components/ResultsToolbar";

import Feature1 from "./components/Feature1";
import Feature2 from "./components/Feature2";
import Feature3 from "./components/Feature3";
import EmbeddingMap from "./components/EmbeddingMap";
function App() {
  const [results, setResults] = useState([]);
  const [analysisId, setAnalysisId] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = results[selectedIndex];
  const handleResults = (nextResults, nextAnalysisId = null) => {
    setResults(nextResults);
    setAnalysisId(nextAnalysisId);
    setSelectedIndex(0);
  };

  return (
    <div className="App" data-analysis-id={analysisId || undefined} style={{ fontFamily: "Arial, sans-serif" }}>
      <Header />
      <FileUploader onFileUpload={handleResults} />

      {Array.isArray(results) && results.length > 0 && (
        <>
          <ResultsToolbar results={results} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
          <EmbeddingMap sequences={results} selectedIndex={selectedIndex} />
          {selected && (
            <>
              <ResultCard item={selected} />
              {selected.valid && (
                <>
                  <Feature1 sequence={selected.sequence} />
                  <Feature2 sequence={selected.sequence} />
                  <Feature3 sequence={selected.sequence} />
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;
