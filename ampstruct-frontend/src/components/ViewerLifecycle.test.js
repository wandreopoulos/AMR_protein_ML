import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Feature2, { buildAnnotations } from './Feature2';
import Structure3D from './Structure3D';

const originalSequence = window.Sequence;
const originalNGL = window.NGL;
afterEach(() => { window.Sequence = originalSequence; window.NGL = originalNGL; });

test('renders an aligned sequence grid and uses overlapping annotations', async () => {
  render(<Feature2 sequence="AYR" />);
  expect(screen.getByRole('heading', { name: /Feature 2: Interactive Sequence Viewer/ })).toBeInTheDocument();
  await waitFor(() => expect(screen.getByLabelText('Aligned amino-acid sequence viewer')).toHaveTextContent('AYR'));
  expect(buildAnnotations('AYR')).toEqual(expect.arrayContaining([
    expect.objectContaining({ name: 'Hydrophobic', regions: [{ start: 1, end: 1 }, { start: 2, end: 2 }] }),
    expect.objectContaining({ name: 'Polar / charged', regions: [{ start: 2, end: 2 }, { start: 3, end: 3 }] })
  ]));
});

test('keeps each residue and its annotations in one fixed-width column', () => {
  render(<Feature2 sequence={"ACDEFGHIKLMNPQRSTVWY".repeat(6)} />);
  const grid = screen.getByLabelText('Aligned amino-acid sequence viewer');
  const assertLayout = (columnsPerLine, blockCount) => {
    const blocks = grid.querySelectorAll('.sequence-block');
    expect(blocks).toHaveLength(blockCount);
    blocks.forEach(block => {
      const columns = block.querySelectorAll('.sequence-column');
      expect(columns).toHaveLength(columnsPerLine);
      expect(block).toHaveStyle(`--column-count: ${columnsPerLine}`);
      expect(block.querySelector('.sequence-label-column')).toBeInTheDocument();
      columns.forEach(column => expect(column.children).toHaveLength(4));
    });
    return blocks[0].querySelectorAll('.sequence-column');
  };

  const columns = assertLayout(40, 3);
  expect(columns[0].querySelector('.position-number')).toHaveTextContent('1');
  expect(columns[1].querySelector('.position-number')).toHaveTextContent('');
  expect(columns[4].querySelector('.position-number')).toHaveTextContent('5');
  expect(columns[19].querySelector('.position-number')).toHaveTextContent('20');
  fireEvent.change(screen.getByLabelText('Residues/line'), { target: { value: '20' } });
  assertLayout(20, 6);
  fireEvent.change(screen.getByLabelText('Residues/line'), { target: { value: '60' } });
  assertLayout(60, 2);

  fireEvent.click(screen.getByLabelText('Hydrophobic'));
  fireEvent.click(screen.getByLabelText('Polar/charged'));
  expect(grid.querySelectorAll('.hydrophobic-mark')).toHaveLength(0);
  expect(grid.querySelectorAll('.polar-mark')).toHaveLength(0);

  const [startInput, endInput] = screen.getAllByRole('spinbutton');
  fireEvent.change(startInput, { target: { value: '11' } });
  fireEvent.change(endInput, { target: { value: '18' } });
  expect(grid.querySelectorAll('.selected-residue')).toHaveLength(8);
});

test('shows an explicit state for empty and invalid sequences', () => {
  const { rerender } = render(<Feature2 sequence="" />);
  expect(screen.getByText(/Select a valid protein sequence/)).toBeInTheDocument();
  rerender(<Feature2 sequence="ACX" />);
  expect(screen.getByText(/unsupported amino-acid/)).toBeInTheDocument();
});

test('disposes the 3D stage when selection removes the viewer', async () => {
  const dispose = jest.fn();
  window.NGL = { Stage: jest.fn(function () {
    this.loadFile = jest.fn().mockResolvedValue({});
    this.dispose = dispose;
  }) };
  const view = render(<Structure3D />);
  await act(async () => {});
  expect(window.NGL.Stage.mock.calls[0][0]).toBeInstanceOf(HTMLElement);
  expect(screen.queryByText('Loading 3D viewer…')).not.toBeInTheDocument();
  view.unmount();
  expect(dispose).toHaveBeenCalledTimes(1);
});

test('reports a missing 3D provider and ignores late script callbacks after unmount', () => {
  delete window.NGL;
  const view = render(<Structure3D />);
  const script = document.querySelector('script[src*="ngl@"]');
  const callback = script.onload;
  fireEvent.error(script);
  expect(screen.getByText(/3D viewer is unavailable/)).toBeInTheDocument();
  view.unmount();
  window.NGL = { Stage: jest.fn() };
  act(() => callback());
  expect(window.NGL.Stage).not.toHaveBeenCalled();
  expect(script.isConnected).toBe(false);
});
