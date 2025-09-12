import React, { useRef } from 'react';

const FileUploader = ({ onFileUpload }) => {
  const fileRef = useRef();

  const handleSubmit = () => {
    const file = fileRef.current.files[0];
    if (!file) return alert("Please upload a file");

    const formData = new FormData();
    formData.append("file", file);

    fetch("http://127.0.0.1:5001/predict", {
      method: "POST",
      body: formData
    })
    .then(res => res.json())
    .then(data => onFileUpload(data.results))
    .catch(err => alert("Error uploading file: " + err.message));
  };

  return (
    <div style={{ textAlign: "center" }}>
      <input type="file" ref={fileRef} accept=".fasta,.csv,.xml" />
      <button onClick={handleSubmit} style={{ marginLeft: "10px" }}>
        Submit & Analyze
      </button>
    </div>
  );
};

export default FileUploader;
