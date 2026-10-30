# Senior-agent verification notes

## Verification outcome — October 29, 2026

The controlled experiment works locally with one OpenMP thread. This verifies
runtime execution only; the XGBoost artifact is still experimental. Valid
sequences use ESM-2 layer-33 mean pooling (1280 features), then the fitted
StandardScaler and XGBClassifier.

**Accuracy is unverified; current predictions may be incorrect.** The stable
runtime checks below do not demonstrate classification accuracy. The result
cards now display this warning alongside provisional labels, raw class-1
scores, and model metadata. Confirm the artifact's label mapping and evaluate
on independently labeled protein fixtures before treating results as reliable.

### Native crash diagnosis

- Reproduced the original failure in a fresh Python 3.10 process: SIGSEGV
  (subprocess return code `-11`, equivalent to shell exit `139`).
- Faulthandler located the crash in `xgboost.core.Booster.__setstate__`, during
  `joblib.load` after ESM embedding generation, before `predict` was reached.
- The environment loads three OpenMP libraries: PyTorch's bundled `libomp`,
  scikit-learn's bundled `libomp`, and Homebrew's `libomp`.
- Setting `OMP_NUM_THREADS=1` before runtime imports made the same reproduction
  exit successfully. Setting XGBoost's `n_jobs=1` after loading cannot prevent a
  crash during loading; that experiment still segfaulted.
- This strongly implicates native OpenMP runtime/thread interaction. It does
  not prove which library contains the defect. Python version alone does not
  explain this result. A related Apple Silicon import/runtime conflict is
  documented in [PyTorch issue 155201](https://github.com/pytorch/pytorch/issues/155201).
- The embedding module now sets one OpenMP thread before numerical imports;
  API inference and lazy initialization are serialized within each worker.
  Native errors are not caught, retried, or replaced with fabricated results.

Tested environment: macOS 15.1 arm64, Python 3.10.21, torch 2.14.1,
fair-esm 2.0.0, NumPy 2.2.6, scikit-learn 1.6.1, XGBoost 2.1.4,
joblib 1.6.0. These are verification versions, not a claim that other dependency
combinations or Windows have been tested. Restart the API after this change;
the OpenMP setting must take effect before runtimes initialize.

### Raw experimental outputs

| Fixture | Length | Raw class | Class-0 score | Class-1 score |
| --- | ---: | ---: | ---: | ---: |
| `testinf_file_amr.fasta` (MsrD) | 487 | 0 | 0.7331340313 | 0.2668659687 |
| `testing_file_non_amr.fasta` (MexB) | 1046 | 1 | 0.0005130768 | 0.9994869232 |

The notebook mapping would call these Non-AMR and AMR, respectively. That
mapping has not been confirmed for this separate artifact. The first result
disagrees with the AMR fixture's name/header. The second fixture's header says
**Multidrug resistance protein MexB**, despite its `non_amr` filename. These
two files cannot establish accuracy or validate label semantics.

API results use `status: "experimental"`, raw `class_id`, `score` (always the
class-1 score), `score_class_id: 1`, and `class_scores`. They explicitly report
`calibration_verified: false` and `label_mapping_verified: false`, with a
warning explaining the provisional labels. Scores are not calibrated confidence.

### Completed checks

- Three fresh API processes, each receiving three uploads containing both real
  fixtures plus an invalid record: 18 real predictions total. All scores were
  exactly identical within and across processes; all processes exited normally.
- All three detected OpenMP runtimes reported one thread after API inference.
- Invalid records skipped inference and received `status: "invalid"`.
- Missing file and empty filename returned HTTP 400. Injected model failures
  returned HTTP 500; the process remained alive for subsequent requests.
- Frontend `npm run build` passed. No new visual UI behavior was introduced.

### Model conversion and remaining scientific questions

The classifier was exported locally using `XGBClassifier.save_model` to
`source/verification/amr_xgb.ubj`; the fitted StandardScaler mean/scale were
saved separately to `source/verification/standardscaler.npz`. Reloading the
native classifier and applying the original scaler produced exactly the same
scores for both saved real embeddings. The scaler must not be omitted.
The API continues to use the original pipeline; conversion does not establish
scientific validity or independently solve an OpenMP collision.
See [XGBoost model IO documentation](https://xgboost.readthedocs.io/en/stable/tutorials/saving_model.html)
for stable native formats versus version-dependent pickle snapshots.

Original classifier SHA-256:
`0b31aa74197f9f9baf4d8f8a0a8d3bf5f7f0db211c8e40daa96c329238295d17`.
Original weights and ZIP were preserved. Logs and converted diagnostic assets
remain under ignored `source/verification/`.

The missing `amr_lightgbm_model.pkl`, artifact training provenance/class mapping,
and independent calibration/validation still require authoritative training
assets from the model owner. Do not silently substitute XGBoost for the
documented LightGBM model. A separate inference service is not necessary for
this serialized local experiment; deployment concurrency and runtime isolation
need separate verification before production use.

### Reproduce the corrected path

Activate the existing compatibility environment from the repository root:

```bash
source ampstruct-backend/.venv310/bin/activate
```

On Windows PowerShell, activate an equivalent environment with:

```powershell
ampstruct-backend\.venv310\Scripts\Activate.ps1
```

Run this command in a fresh process (both shells):

```text
python -c "import sys; sys.path.insert(0, 'ampstruct-backend'); from app import classify_sequence; from utils.fasta_parser import parse_fasta; print([(name, classify_sequence(parse_fasta('source/provided/' + name)[0]['sequence'])) for name in ['testinf_file_amr.fasta', 'testing_file_non_amr.fasta']])"
```


## Public reference follow-up — October 29, 2026

Supplied assets and weights moved to `source/provided/`; public downloads are
under `source/public/`. Backend defaults and reproduction paths were updated.
The classifier checksum is unchanged. Two existing versioned FASTA fixtures
were relocated, while weights and newly downloaded data remain ignored by Git.

The public panel contains 10 reviewed UniProt AMR references and 10 presumed
non-AMR E. coli metabolic controls, retrieved through the official EMBL-EBI
Proteins API. Each raw annotation and complete canonical sequence is retained,
with source URLs, label criteria, versions, and SHA-256 in the manifest.

The experimental model agreed with 18/20 panel labels: 10/10 AMR references
returned class 1 and 8/10 presumed controls returned class 0. P00509 (aspartate
aminotransferase) and P0A9G6 (isocitrate lyase) returned class 1. This is not an
independent accuracy estimate: seven positives exactly match the supplied CARD
FASTA, negative labels are annotation-based assumptions, and training/homology
overlap is unknown. The mapping and model were not tuned on this panel.

Reproduce downloads with `python ampstruct-backend/download_public_references.py`
and inference with `python ampstruct-backend/benchmark_public.py` from the root.
See `source/public/README.md`, `manifest.csv`, `benchmark_results.csv`, and
`benchmark_summary.json`. Restart the backend after the relocation, and update
any custom model-path environment variables that still use the old paths.
