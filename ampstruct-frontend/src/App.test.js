import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import { downloadResults } from './utils/exportResults';

jest.mock('./components/Feature1', () => ({ sequence }) => <div data-testid="properties">{sequence}</div>);
jest.mock('./components/Feature2', () => ({ sequence }) => <div data-testid="sequence-viewer">{sequence}</div>);
jest.mock('./components/Feature3', () => ({ sequence }) => <div data-testid="structure-viewer">{sequence}</div>);
jest.mock('./utils/exportResults', () => ({ downloadResults: jest.fn() }));

const first = { id: 'duplicate', length: 3, sequence: 'ACD', valid: true, status: 'experimental', label: 'AMR', class_id: 1, score: 0.9, score_class_id: 1 };
const second = { ...first, length: 4, sequence: 'EFGH', label: 'Non-AMR', class_id: 0, score: 0.1 };
const invalid = { id: 'invalid', length: 3, sequence: '123', valid: false, status: 'invalid' };
const originalFetch = global.fetch;

beforeEach(() => { global.fetch = jest.fn(); downloadResults.mockReset(); });
afterEach(() => { global.fetch = originalFetch; });

function chooseFile() {
  fireEvent.change(screen.getByLabelText('FASTA file'), {
    target: { files: [new File(['>sample\nACD'], 'sample.fasta')] }
  });
}

async function upload(results) {
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ results }) });
  chooseFile();
  fireEvent.click(screen.getByRole('button', { name: 'Submit & Analyze' }));
  await screen.findByLabelText('Sequence to inspect');
}

test('selects duplicate IDs by record position, renders one set of panels, and skips invalid viewers', async () => {
  render(<App />);
  expect(screen.queryByRole('button', { name: 'Download CSV' })).not.toBeInTheDocument();
  await upload([first, second, invalid]);
  expect(screen.getAllByRole('article')).toHaveLength(1);
  expect(screen.getByTestId('properties')).toHaveTextContent('ACD');
  fireEvent.change(screen.getByLabelText('Sequence to inspect'), { target: { value: '1' } });
  expect(screen.getByRole('article')).toHaveTextContent('Non-AMR (provisional)');
  expect(screen.getByTestId('properties')).toHaveTextContent('EFGH');
  expect(screen.getByTestId('sequence-viewer')).toHaveTextContent('EFGH');
  expect(screen.getByTestId('structure-viewer')).toHaveTextContent('EFGH');
  expect(global.fetch).toHaveBeenCalledTimes(1);
  fireEvent.change(screen.getByLabelText('Sequence to inspect'), { target: { value: '2' } });
  expect(screen.getByText('Prediction not run')).toBeInTheDocument();
  expect(screen.queryByTestId('properties')).not.toBeInTheDocument();
  expect(screen.queryByTestId('sequence-viewer')).not.toBeInTheDocument();
  expect(screen.queryByTestId('structure-viewer')).not.toBeInTheDocument();
});

test('exports every result by default and exports only the selected original record when requested', async () => {
  render(<App />);
  const results = [first, second, invalid];
  await upload(results);
  fireEvent.click(screen.getByRole('button', { name: 'Download CSV' }));
  expect(downloadResults).toHaveBeenLastCalledWith(results, 'csv', undefined, false);
  fireEvent.change(screen.getByLabelText('Sequence to inspect'), { target: { value: '1' } });
  fireEvent.change(screen.getByLabelText('Download scope'), { target: { value: 'selected' } });
  fireEvent.click(screen.getByRole('button', { name: 'Download TSV' }));
  expect(downloadResults).toHaveBeenLastCalledWith([second], 'tsv', [2], true);
  downloadResults.mockImplementationOnce(() => { throw new Error('download failed'); });
  fireEvent.click(screen.getByRole('button', { name: 'Download TSV' }));
  expect(screen.getByRole('alert')).toHaveTextContent('The download could not be created');
});

test('clears stale results during analysis and failures, then resets selection for a new upload', async () => {
  render(<App />);
  await upload([first, second]);
  fireEvent.change(screen.getByLabelText('Sequence to inspect'), { target: { value: '1' } });
  fireEvent.change(screen.getByLabelText('Download scope'), { target: { value: 'selected' } });
  let rejectRequest;
  global.fetch.mockReturnValueOnce(new Promise((_, reject) => { rejectRequest = reject; }));
  chooseFile();
  fireEvent.click(screen.getByRole('button', { name: 'Submit & Analyze' }));
  expect(screen.getByRole('button', { name: 'Analyzing…' })).toBeDisabled();
  expect(screen.queryByLabelText('Sequence to inspect')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Download CSV' })).not.toBeInTheDocument();
  await act(async () => { rejectRequest(new TypeError('network')); });
  expect(screen.getByRole('alert')).toHaveTextContent('Unable to reach');
  await upload([{ ...first, id: 'new-upload' }]);
  expect(screen.getByLabelText('Sequence to inspect')).toHaveValue('0');
  expect(screen.getByLabelText('Download scope')).toHaveValue('all');
  expect(screen.getByRole('article')).toHaveTextContent('new-upload');
});

test('keeps invalid-only results available for inspection and export', async () => {
  render(<App />);
  await upload([invalid]);
  expect(screen.getByRole('alert')).toHaveTextContent('No valid protein sequences');
  expect(screen.getByRole('article')).toHaveTextContent('Invalid amino acid sequence');
  fireEvent.click(screen.getByRole('button', { name: 'Download TSV' }));
  expect(downloadResults).toHaveBeenCalledWith([invalid], 'tsv', undefined, false);
});
