import React, { useState } from "react";
import Header from "./components/Header";
import FileUploader from "./components/FileUploader";
import ResultCard from "./components/ResultCard";
import Widgets from "./components/Widgets";

function App() {
  const [results, setResults] = useState([]);

  return (
    <div className="App" style={{ fontFamily: "Arial, sans-serif" }}>
      <Header />
      <FileUploader onFileUpload={setResults} />

      {Array.isArray(results) && results.length > 0 && (
        <>
          <h2 style={{ textAlign: "center", marginTop: "40px" }}>
            FASTA File Sequences
          </h2>
          {results.map((item, idx) => (
            <div key={idx}>
              <ResultCard item={item} />
              <Widgets probability={item.valid ? 1 : 0} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default App;
