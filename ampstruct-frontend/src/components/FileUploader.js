import React, { useRef, useState } from 'react';
import './FileUploader.css';

const FileUploader = ({ onFileUpload }) => {
  const fileRef = useRef();
  const inFlight = useRef(false);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('Choose a FASTA file to begin.');
  const isAnalyzing = status === 'analyzing';

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (inFlight.current) return;

    const file = fileRef.current.files[0];
    if (!file) {
      setStatus('error');
      setMessage('Please choose a FASTA file before starting analysis.');
      return;
    }

    inFlight.current = true;
    setStatus('analyzing');
    setMessage(`Analyzing ${file.name}… The first analysis and large files can take longer. Keep this page open.`);
    onFileUpload([]);

    const formData = new FormData();
    formData.append("file", file);

    const apiUrl = process.env.REACT_APP_API_URL || "https://amr-protein-ml.onrender.com";

    try {
      const response = await fetch(`${apiUrl}/predict`, {
        method: "POST",
        body: formData
      });
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error(response.ok
          ? 'The server returned an unreadable response. Please try again.'
          : `Analysis failed (HTTP ${response.status}). Please try again.`);
      }

      if (!response.ok || data?.error) {
        throw new Error(data?.error || `Analysis failed (HTTP ${response.status}). Please try again.`);
      }
      if (!Array.isArray(data?.results) || data.results.some(result =>
        !result || typeof result.sequence !== 'string' || typeof result.valid !== 'boolean'
      )) {
        throw new Error('The server returned incomplete results. Please try again.');
      }
      if (data.results.length === 0) {
        throw new Error('No FASTA sequences were found. Check that each sequence starts with a > header.');
      }

      const validCount = data.results.filter(result => result.valid).length;
      const invalidCount = data.results.length - validCount;
      onFileUpload(data.results);
      if (validCount === 0) {
        setStatus('error');
        setMessage('No valid protein sequences were found. Check the amino acid letters in your FASTA file.');
      } else {
        setStatus('success');
        setMessage(`Analysis complete. ${validCount} sequence${validCount === 1 ? '' : 's'} analyzed.${invalidCount ? ` ${invalidCount} invalid sequence${invalidCount === 1 ? '' : 's'} skipped.` : ''}`);
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof TypeError
        ? 'Unable to reach the analysis server. Check your connection and try again.'
        : error.message);
    } finally {
      inFlight.current = false;
    }
  };

  return (
    <form className="file-uploader" onSubmit={handleSubmit}>
      <div className="file-uploader-controls" aria-busy={isAnalyzing}>
        <label htmlFor="fasta-file">FASTA file</label>
        <input
          id="fasta-file"
          type="file"
          ref={fileRef}
          accept=".fasta,.fa,.faa"
          disabled={isAnalyzing}
          aria-describedby="upload-status"
          onChange={() => {
            setStatus('idle');
            setMessage('Ready to analyze. Select Submit & Analyze to start.');
            onFileUpload([]);
          }}
        />
        <button type="submit" disabled={isAnalyzing}>
          {isAnalyzing ? 'Analyzing…' : 'Submit & Analyze'}
        </button>
      </div>
      <p
        id="upload-status"
        className={`file-uploader-status file-uploader-status-${status}`}
        role={status === 'error' ? 'alert' : 'status'}
        aria-live={status === 'error' ? 'assertive' : 'polite'}
        aria-atomic="true"
      >
        {message}
      </p>
    </form>
  );
};

export default FileUploader;
