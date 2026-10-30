import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Feature2 from './Feature2';
import Structure3D from './Structure3D';

const originalSequence = window.Sequence;
const originalNGL = window.NGL;
afterEach(() => { window.Sequence = originalSequence; window.NGL = originalNGL; });

test('ignores a delayed BioJS callback for a previously selected sequence', () => {
  delete window.Sequence;
  const view = render(<Feature2 sequence="ACD" />);
  const oldScript = document.querySelector('script[src*="biojs-vis-sequence"]');
  const oldCallback = oldScript.onload;
  view.rerender(<Feature2 sequence="EFGH" />);
  expect(oldScript.isConnected).toBe(false);
  window.Sequence = jest.fn(function (options) { options.target.textContent = options.sequence; });
  act(() => oldCallback());
  expect(window.Sequence).not.toHaveBeenCalled();
  const newScript = document.querySelector('script[src*="biojs-vis-sequence"]');
  fireEvent.load(newScript);
  expect(window.Sequence).toHaveBeenCalledTimes(1);
  expect(screen.getByText('EFGH')).toBeInTheDocument();
  view.unmount();
  expect(newScript.isConnected).toBe(false);
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
