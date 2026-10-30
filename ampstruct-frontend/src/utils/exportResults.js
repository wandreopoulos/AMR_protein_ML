import { classOneScore, hasPrediction, resultStatus } from './prediction';

const columns = [
  'record_number', 'sequence_id', 'length', 'valid', 'status', 'predicted_class',
  'label', 'score_class_id', 'score', 'class_0_score', 'class_1_score', 'model',
  'calibration_verified', 'label_mapping_verified', 'accuracy_note', 'warning', 'error', 'sequence'
];

function score(value) {
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : '';
}

function exportRow(item, index) {
  const predicted = hasPrediction(item);
  const value = predicted ? classOneScore(item) : null;
  return [
    index + 1, item.id, item.length, item.valid, resultStatus(item),
    predicted ? item.class_id : '', predicted ? item.label : '',
    value !== null ? 1 : '', value ?? '',
    predicted ? score(item.class_scores?.['0']) : '',
    predicted ? score(item.class_scores?.['1']) : '',
    predicted ? item.model : '',
    predicted ? item.calibration_verified === true : '',
    predicted ? item.label_mapping_verified === true : '',
    predicted ? 'Accuracy unverified; predictions may be incorrect.' : '',
    predicted ? item.warning || 'Class labels and score calibration require verification.' : '',
    item.error || '', item.sequence
  ];
}

function escapeCell(value, delimiter) {
  let text = value == null ? '' : String(value);
  // FASTA IDs are user-controlled. Keep spreadsheet programs from treating
  // text cells as formulas; numeric model scores retain their original values.
  if (typeof value === 'string') {
    let start = 0;
    while (start < text.length && (text.charCodeAt(start) <= 32 || /\s/.test(text[start]))) start += 1;
    if (text[start] && '=+-@'.includes(text[start])) text = "'" + text;
  }
  if (text.includes(delimiter) || /["\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function serializeResults(results, format = 'csv', recordNumbers) {
  if (!['csv', 'tsv'].includes(format)) throw new Error('Choose CSV or TSV.');
  const delimiter = format === 'tsv' ? '\t' : ',';
  const rows = [columns, ...results.map((item, index) => {
    const row = exportRow(item, index);
    if (recordNumbers) row[0] = recordNumbers[index];
    return row;
  })];
  return rows.map(row => row.map(value => escapeCell(value, delimiter)).join(delimiter)).join('\r\n') + '\r\n';
}

export function downloadResults(results, format, recordNumbers, selectedOnly = false) {
  const content = serializeResults(results, format, recordNumbers);
  const type = format === 'tsv' ? 'text/tab-separated-values' : 'text/csv';
  const url = URL.createObjectURL(new Blob([content], { type: `${type};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `ampstruct-${selectedOnly ? 'selected-sequence' : 'results'}.${format}`;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
