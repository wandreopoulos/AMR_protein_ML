import React, { useState } from "react";
import Header from "./components/Header";
import FileUploader from "./components/FileUploader";
import ResultCard from "./components/ResultCard";
import ResultsToolbar from "./components/ResultsToolbar";

import Feature1 from "./components/Feature1";
import Feature2 from "./components/Feature2";
import Feature3 from "./components/Feature3";
function App() {
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = results[selectedIndex];
  const handleResults = nextResults => {
    setResults(nextResults);
    setSelectedIndex(0);
  };

  return (
    <div className="App" style={{ fontFamily: "Arial, sans-serif" }}>
      <Header />
      <FileUploader onFileUpload={handleResults} />

      {Array.isArray(results) && results.length > 0 && (
        <>
          <ResultsToolbar results={results} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
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
