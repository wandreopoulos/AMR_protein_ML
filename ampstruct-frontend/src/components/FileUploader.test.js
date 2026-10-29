import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileUploader from './FileUploader';

const originalFetch = global.fetch;
const validResult = { id: 'protein', sequence: 'ACDEFGHIK', valid: true };
const response = (results) => ({ ok: true, json: async () => ({ results }) });

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
});

function selectFile() {
  fireEvent.change(screen.getByLabelText('FASTA file'), {
    target: { files: [new File(['>protein\nACDEFGHIK'], 'sample.fasta')] }
  });
}

test('shows analysis in progress, blocks duplicate requests, and reports mixed results', async () => {
  let finishRequest;
  global.fetch.mockReturnValue(new Promise(resolve => { finishRequest = resolve; }));
  const onFileUpload = jest.fn();
  render(<FileUploader onFileUpload={onFileUpload} />);
  expect(screen.getByRole('status')).toHaveTextContent('Choose a FASTA file');
  selectFile();
  fireEvent.click(screen.getByRole('button', { name: 'Submit & Analyze' }));

  const pendingButton = screen.getByRole('button', { name: 'Analyzing…' });
  expect(pendingButton).toBeDisabled();
  expect(screen.getByLabelText('FASTA file')).toBeDisabled();
  expect(screen.getByRole('status')).toHaveTextContent('Analyzing sample.fasta');
  expect(onFileUpload).toHaveBeenLastCalledWith([]);
  fireEvent.submit(pendingButton.closest('form'));
  expect(global.fetch).toHaveBeenCalledTimes(1);

  const results = [validResult, validResult, { id: 'bad', sequence: '123', valid: false }];
  await act(async () => { finishRequest(response(results)); });
  expect(screen.getByRole('status')).toHaveTextContent('Analysis complete. 2 sequences analyzed. 1 invalid sequence skipped.');
  expect(onFileUpload).toHaveBeenLastCalledWith(results);
  expect(screen.getByRole('button', { name: 'Submit & Analyze' })).toBeEnabled();
  expect(screen.getByLabelText('FASTA file')).toBeEnabled();

  selectFile();
  expect(screen.getByRole('status')).toHaveTextContent('Ready to analyze');
  expect(onFileUpload).toHaveBeenLastCalledWith([]);
});

test('asks for a file without sending a request', () => {
  render(<FileUploader onFileUpload={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Submit & Analyze' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Please choose a FASTA file');
  expect(global.fetch).not.toHaveBeenCalled();
});

test.each([
  ['server error', { ok: false, status: 500, json: async () => ({ error: 'Model unavailable' }) }, 'Model unavailable'],
  ['non-JSON error', { ok: false, status: 503, json: async () => { throw new SyntaxError(); } }, 'Analysis failed (HTTP 503)'],
  ['unreadable success', { ok: true, json: async () => { throw new SyntaxError(); } }, 'unreadable response'],
  ['missing results', { ok: true, json: async () => ({}) }, 'incomplete results'],
  ['malformed record', response([{}]), 'incomplete results'],
  ['empty FASTA', response([]), 'No FASTA sequences were found'],
  ['invalid sequences', response([{ sequence: '123', valid: false }]), 'No valid protein sequences were found']
])('reports %s and lets the user retry', async (_, serverResponse, message) => {
  global.fetch.mockResolvedValue(serverResponse);
  render(<FileUploader onFileUpload={jest.fn()} />);
  selectFile();
  fireEvent.click(screen.getByRole('button', { name: 'Submit & Analyze' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  expect(screen.getByRole('button', { name: 'Submit & Analyze' })).toBeEnabled();
  expect(screen.getByLabelText('FASTA file')).toBeEnabled();
});

test('recovers from a network failure on the next submission', async () => {
  global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    .mockResolvedValueOnce(response([validResult]));
  render(<FileUploader onFileUpload={jest.fn()} />);
  selectFile();
  fireEvent.click(screen.getByRole('button', { name: 'Submit & Analyze' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to reach the analysis server');
  fireEvent.click(screen.getByRole('button', { name: 'Submit & Analyze' }));
  expect(await screen.findByText('Analysis complete. 1 sequence analyzed.')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
