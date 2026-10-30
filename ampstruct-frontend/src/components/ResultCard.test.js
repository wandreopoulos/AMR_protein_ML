import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResultCard from './ResultCard';

const result = {
  id: 'MsrD', sequence: 'ACDEFGHIK', length: 9, valid: true,
  class_id: 0, label: 'Non-AMR', status: 'experimental',
  score: 0.2668659687, score_class_id: 1,
  model: 'amr_pipeline_xgb.pkl',
  calibration_verified: false, label_mapping_verified: false,
  warning: 'Experimental XGBoost result. Class labels and calibration are unverified.'
};

test('keeps predictions and class-1 scores associated with each sequence', () => {
  render(<>
    <ResultCard item={result} />
    <ResultCard item={{ ...result, id: 'MexB', class_id: 1, label: 'AMR', score: 0.9994869232 }} />
  </>);
  const first = within(screen.getByRole('article', { name: 'Results for MsrD' }));
  const second = within(screen.getByRole('article', { name: 'Results for MexB' }));
  expect(first.getByText('Non-AMR (provisional)')).toBeInTheDocument();
  expect(first.getByText('0.2669')).toBeInTheDocument();
  expect(first.queryByText('0.7331')).not.toBeInTheDocument();
  expect(second.getByText('AMR (provisional)')).toBeInTheDocument();
  expect(second.getByText('0.9995')).toBeInTheDocument();
  expect(first.getByText('Experimental')).toBeInTheDocument();
  expect(first.getByText('Accuracy not verified.')).toBeInTheDocument();
  expect(first.getByText(/Predictions may be incorrect/)).toBeInTheDocument();
  expect(second.getByText('Accuracy not verified.')).toBeInTheDocument();
  expect(first.getByText(result.model)).toBeInTheDocument();
  expect(first.getByText(result.warning)).toBeInTheDocument();
  expect(first.getByText(/not calibrated confidence/)).toBeInTheDocument();
  expect(first.getByText('Valid amino acid sequence')).toBeInTheDocument();
  expect(first.getByText(/does not establish AMR status/)).toBeInTheDocument();
});

test('displays a real zero score', () => {
  render(<ResultCard item={{ ...result, score: 0 }} />);
  expect(screen.getByText('0.0000')).toBeInTheDocument();
});

test.each([
  { score: null }, { score: NaN }, { score: 1.5 }, { score_class_id: undefined }
])('does not fabricate a class-1 score from missing or unsupported data: %j', fields => {
  render(<ResultCard item={{ ...result, ...fields }} />);
  expect(screen.getByText('Not available')).toBeInTheDocument();
  expect(screen.getByText('Non-AMR (provisional)')).toBeInTheDocument();
});

test('does not show stale prediction fields for an invalid sequence', () => {
  render(<ResultCard item={{ ...result, valid: false, status: 'invalid' }} />);
  expect(screen.getByText('Prediction not run')).toBeInTheDocument();
  expect(screen.getByText('Invalid amino acid sequence')).toBeInTheDocument();
  expect(screen.queryByText(result.model)).not.toBeInTheDocument();
  expect(screen.queryByText(/Non-AMR/)).not.toBeInTheDocument();
});

test('handles a server that returns sequence data without predictions', () => {
  render(<ResultCard item={{ id: 'legacy', sequence: 'A'.repeat(2000), length: 2000, valid: true }} />);
  expect(screen.getByText('Prediction unavailable')).toBeInTheDocument();
  expect(screen.getByText('A'.repeat(2000))).toBeInTheDocument();
  expect(screen.queryByText('Experimental')).not.toBeInTheDocument();
});

test('shows a per-sequence failure without displaying stale scores', () => {
  render(<ResultCard item={{ ...result, status: 'failed', error: 'Embedding generation failed.' }} />);
  expect(screen.getByText('Prediction failed')).toBeInTheDocument();
  expect(screen.getByText('Embedding generation failed.')).toBeInTheDocument();
  expect(screen.queryByText('0.2669')).not.toBeInTheDocument();
});

test('retains a provisional-label warning when the server omits warning text', () => {
  render(<ResultCard item={{ ...result, warning: undefined, label_mapping_verified: undefined }} />);
  expect(screen.getByText('Non-AMR (provisional)')).toBeInTheDocument();
  expect(screen.getByText(/mapping has not been verified/)).toBeInTheDocument();
  expect(screen.getByText(/Predictions may be incorrect/)).toBeInTheDocument();
});
