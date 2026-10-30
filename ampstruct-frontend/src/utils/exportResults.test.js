import { downloadResults, serializeResults } from './exportResults';

const result = {
  id: 'protein', sequence: 'ACDEFGHIK', length: 9, valid: true,
  status: 'experimental', class_id: 0, label: 'Non-AMR', score_class_id: 1,
  score: 0.26686596870422363, class_scores: { '0': 0.7331340312957764, '1': 0.26686596870422363 },
  model: 'amr_pipeline_xgb.pkl', calibration_verified: false,
  label_mapping_verified: false, warning: 'Experimental result'
};

test.each(['csv', 'tsv'])('%s preserves raw scores, class zero, model metadata, and warnings', format => {
  const delimiter = format === 'csv' ? ',' : '\t';
  const lines = serializeResults([result], format).trimEnd().split('\r\n');
  const headers = lines[0].split(delimiter);
  const fields = lines[1].split(delimiter);
  const row = Object.fromEntries(headers.map((key, i) => [key, fields[i]]));
  expect(row.predicted_class).toBe('0');
  expect(row.score_class_id).toBe('1');
  expect(row.score).toBe('0.26686596870422363');
  expect(row.class_0_score).toBe('0.7331340312957764');
  expect(row.model).toBe(result.model);
  expect(row.calibration_verified).toBe('false');
  expect(row.label_mapping_verified).toBe('false');
  expect(row.accuracy_note).toContain('predictions may be incorrect');
  expect(row.warning).toBe('Experimental result');
  expect(row.sequence).toBe(result.sequence);
});

test('exports invalid and legacy records without presenting stale fields as predictions', () => {
  const invalid = { ...result, valid: false, status: 'invalid' };
  const legacy = { id: 'legacy', valid: true, length: 3, sequence: 'ACD' };
  const lines = serializeResults([invalid, legacy]).trimEnd().split('\r\n');
  const headers = lines[0].split(',');
  const rows = lines.slice(1).map(line => Object.fromEntries(headers.map((key, i) => [key, line.split(',')[i]])));
  expect(rows[0].status).toBe('invalid');
  expect(rows[1].status).toBe('unavailable');
  for (const row of rows) {
    expect(row.predicted_class).toBe('');
    expect(row.score).toBe('');
    expect(row.model).toBe('');
  }
});

test('preserves zero scores and selected records original numbering', () => {
  const exported = serializeResults([{ ...result, score: 0 }], 'csv', [12]);
  expect(exported.split('\r\n')[1]).toMatch(/^12,protein,9,true,experimental,0,Non-AMR,1,0,/);
});

test('quotes commas, tabs, quotes, and embedded line breaks for delimited readers', () => {
  const id = 'protein, "A"\tsecond\nline';
  const escaped = '"protein, ""A""\tsecond\nline"';
  expect(serializeResults([{ ...result, id }], 'csv')).toContain(escaped);
  expect(serializeResults([{ ...result, id }], 'tsv')).toContain(escaped);
});

test.each(['=1+1', '+1+1', '-1+1', '@SUM(A1)', '  =2+2', '\t=1+1'])('keeps formula-like FASTA IDs as spreadsheet text: %s', id => {
  expect(serializeResults([{ ...result, id }], 'tsv')).toContain("'" + id);
});

test('uses blank fields for missing scores rather than fabricating zero', () => {
  const row = serializeResults([{ ...result, score: null, class_scores: undefined }]).split('\r\n')[1].split(',');
  expect(row.slice(7, 11)).toEqual(['', '', '', '']);
});

test('downloads a file and releases its temporary browser resources', () => {
  jest.useFakeTimers();
  const create = URL.createObjectURL;
  const revoke = URL.revokeObjectURL;
  URL.createObjectURL = jest.fn(() => 'blob:export-test');
  URL.revokeObjectURL = jest.fn();
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
    expect(this.download).toBe('ampstruct-selected-sequence.tsv');
    expect(this.href).toBe('blob:export-test');
  });
  try {
    downloadResults([result], 'tsv', [1], true);
    expect(URL.createObjectURL.mock.calls[0][0].type).toBe('text/tab-separated-values;charset=utf-8');
    expect(document.querySelector('a[download]')).toBeNull();
    jest.runOnlyPendingTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:export-test');
  } finally {
    click.mockRestore();
    URL.createObjectURL = create;
    URL.revokeObjectURL = revoke;
    jest.useRealTimers();
  }
});
