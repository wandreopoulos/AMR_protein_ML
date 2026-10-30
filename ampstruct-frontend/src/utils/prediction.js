export const hasPrediction = item => Boolean(
  item.valid && ['experimental', 'predicted'].includes(item.status) &&
  Number.isInteger(item.class_id) && typeof item.label === 'string' && item.label.trim()
);

export const classOneScore = item => (
  item.score_class_id === 1 && Number.isFinite(item.score) && item.score >= 0 && item.score <= 1
    ? item.score : null
);

export const resultStatus = item => {
  if (!item.valid) return 'invalid';
  if (hasPrediction(item)) return item.status;
  return item.status === 'failed' ? 'failed' : 'unavailable';
};
