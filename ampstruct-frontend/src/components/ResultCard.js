import React from 'react';
import './ResultCard.css';

const ResultCard = ({ item }) => {
  const hasPrediction = item.valid &&
    ['experimental', 'predicted'].includes(item.status) &&
    Number.isInteger(item.class_id) &&
    typeof item.label === 'string' && item.label.trim().length > 0;
  const hasScore = item.score_class_id === 1 &&
    Number.isFinite(item.score) && item.score >= 0 && item.score <= 1;
  const provisional = item.label_mapping_verified !== true;

  return (
    <article className="result-card" aria-label={`Results for ${item.id}`}>
      <h3 className="result-sequence-id">{item.id}</h3>
      <section className="prediction-summary" aria-label="Classification result">
        <div className="prediction-heading">
          <h4>Prediction</h4>
          {hasPrediction && (
            <span className="prediction-status">
              {item.status === 'experimental' ? 'Experimental' : 'Prediction returned'}
            </span>
          )}
        </div>
        {hasPrediction ? (
          <>
            <p className="prediction-label">
              {item.label}{provisional && ' (provisional)'}
            </p>
            {(item.status === 'experimental' || provisional) && (
              <p className="prediction-warning">
                <strong>Accuracy not verified. </strong>
                Predictions may be incorrect. Treat these results as experimental.
              </p>
            )}
            <dl className="result-metadata">
              <div><dt>Predicted class</dt><dd>{item.class_id}</dd></div>
              <div><dt>Class-1 score</dt><dd>{hasScore ? item.score.toFixed(4) : 'Not available'}</dd></div>
              <div className="result-model"><dt>Model</dt><dd>{item.model || 'Not provided'}</dd></div>
            </dl>
            <p className="prediction-score-note">
              The score always refers to class 1, on a scale from 0 to 1.
              {item.calibration_verified !== true && ' Score calibration has not been verified; this is not calibrated confidence.'}
            </p>
            {(item.warning || item.status === 'experimental' || provisional) && (
              <p className="prediction-warning">
                <strong>Interpretation note: </strong>
                {item.warning || (provisional
                  ? 'The class-to-label mapping has not been verified for this model. Treat the displayed label as provisional.'
                  : 'This model result is experimental.')}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="prediction-unavailable">
              {!item.valid ? 'Prediction not run' : item.status === 'failed' ? 'Prediction failed' : 'Prediction unavailable'}
            </p>
            <p>{!item.valid
              ? 'This sequence failed validation and was not sent to the classifier.'
              : item.error || 'The server returned sequence data without a classification.'}</p>
          </>
        )}
      </section>

      <dl className="result-metadata sequence-metadata">
        <div><dt>Length</dt><dd>{item.length} aa</dd></div>
        <div><dt>Sequence validation</dt><dd>{item.valid ? 'Valid amino acid sequence' : 'Invalid amino acid sequence'}</dd></div>
      </dl>
      <p className="validation-note">Validation checks the sequence letters; it does not establish AMR status.</p>
      <div className="sequence-preview">{item.sequence}</div>
    </article>
  );
};

export default ResultCard;
