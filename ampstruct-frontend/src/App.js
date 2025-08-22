import React, { useState } from "react";
import Header from "./components/Header";
import FileUploader from "./components/FileUploader";
import ResultCard from "./components/ResultCard";

import Feature1 from "./components/Feature1";
import Feature2 from "./components/Feature2";
import Feature3 from "./components/Feature3";
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
          {results.map((item, idx) => {
            const cleanedSequence = item.sequence
              .split("\n")
              .filter(line => !line.startsWith(">"))
              .join("")
              .trim();

            return (
              <div key={idx}>
                <ResultCard item={item} />
                <Feature1 sequence={cleanedSequence} />
                <Feature2 sequence={cleanedSequence} />
                <Feature3 sequence={cleanedSequence} />
                {/* <Widgets probability={item.valid ? 1 : 0} /> */}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

export default App;
