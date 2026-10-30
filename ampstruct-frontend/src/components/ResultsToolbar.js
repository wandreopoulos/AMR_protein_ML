import React, { useState } from 'react';
import { hasPrediction } from '../utils/prediction';
import { downloadResults } from '../utils/exportResults';
import './ResultsToolbar.css';

const ResultsToolbar = ({ results, selectedIndex, onSelect }) => {
  const [scope, setScope] = useState('all');
  const [exportError, setExportError] = useState('');
  const validCount = results.filter(item => item.valid).length;

  const download = format => {
    setExportError('');
    try {
      const selectedOnly = scope === 'selected';
      downloadResults(
        selectedOnly ? [results[selectedIndex]] : results,
        format,
        selectedOnly ? [selectedIndex + 1] : undefined,
        selectedOnly
      );
    } catch {
      setExportError('The download could not be created. Please try again.');
    }
  };

  return (
    <section className="results-toolbar" aria-label="Sequence selection and downloads">
      <h2>Sequence results</h2>
      <p>{results.length} sequence{results.length === 1 ? '' : 's'} · {validCount} valid · {results.length - validCount} invalid</p>
      <label className="results-control" htmlFor="sequence-selector">
        Sequence to inspect
        <select id="sequence-selector" value={selectedIndex} onChange={event => onSelect(Number(event.target.value))}>
          {results.map((item, index) => (
            <option key={index} value={index}>
              {index + 1}. {item.id} · {item.length} aa · {hasPrediction(item)
                ? `${item.label}${item.label_mapping_verified !== true ? ' (provisional)' : ''}`
                : !item.valid ? 'Invalid sequence' : 'Prediction unavailable'}
            </option>
          ))}
        </select>
      </label>
      <p className="results-position" role="status" aria-live="polite">
        Showing sequence {selectedIndex + 1} of {results.length}. Selecting a sequence does not rerun analysis.
      </p>
      <div className="results-download-controls">
        <label className="results-control" htmlFor="export-scope">
          Download scope
          <select id="export-scope" value={scope} onChange={event => setScope(event.target.value)}>
            <option value="all">All sequences ({results.length})</option>
            <option value="selected">Selected sequence only</option>
          </select>
        </label>
        <button type="button" onClick={() => download('csv')}>Download CSV</button>
        <button type="button" onClick={() => download('tsv')}>Download TSV</button>
      </div>
      <p className="results-export-note">Downloads include raw scores, sequence validation, model details, and experimental warnings.</p>
      {exportError && <p role="alert">{exportError}</p>}
    </section>
  );
};

export default ResultsToolbar;
