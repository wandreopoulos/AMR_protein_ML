# AMPstruct project documentation

Return to the [root quick start](../README.md).

## Start the frontend

Requirements: Node.js and npm on macOS, Windows, or Linux.

```bash
cd ampstruct-frontend
npm install
npm start
```

The React app should open at `http://localhost:3000`.

On Windows, run the same frontend commands from PowerShell:

```powershell
cd ampstruct-frontend
npm install
npm start
```

## Start the backend

AMPstruct is verified against Python **3.14.7**. The repository pins this exact
version in `.python-version`; use that interpreter for the backend and utility
scripts. The backend exits early with a clear error if another Python version is
used.

Micromamba is the preferred environment manager because it provides a consistent,
isolated environment across macOS, Windows, and Linux. From the repository root,
create and activate the pinned environment:

```bash
micromamba create -f environment.yml
micromamba activate ampstruct
python scripts/check_python_version.py
python ampstruct-backend/app.py
```

If your shell is not configured for activation, use the equivalent form:

```bash
micromamba run -n ampstruct python scripts/check_python_version.py
micromamba run -n ampstruct python ampstruct-backend/app.py
```

The Flask API listens on `http://localhost:5001`.

On Windows PowerShell, run the same commands from the repository root:

```powershell
micromamba create -f environment.yml
micromamba activate ampstruct
python scripts/check_python_version.py
python ampstruct-backend\app.py
```

If the version check reports anything other than 3.14.7, recreate the
environment from `environment.yml`. If activation is unavailable, use
`micromamba run -n ampstruct ...` instead.

### Fallback: Python `venv`

Use this path when micromamba is unavailable. It installs the same pinned
requirements from `ampstruct-backend/requirements.txt`:

```bash
cd ampstruct-backend
python3.14 -m venv .venv
source .venv/bin/activate
python ../scripts/check_python_version.py
python -m pip install -r requirements.txt
python app.py
```

On Windows PowerShell:

```powershell
cd ampstruct-backend
py -3.14 -m venv .venv
.venv\Scripts\Activate.ps1
python ..\scripts\check_python_version.py
python -m pip install -r requirements.txt
python app.py
```

Do not mix packages between the micromamba environment and the fallback
`.venv`; use one environment per checkout.

## Important current limitation

The frontend’s upload component currently sends requests to the deployed backend URL:

```text
https://amr-protein-ml.onrender.com/predict
```

It uses the deployed backend by default. For local end-to-end testing, set `REACT_APP_API_URL` when starting the frontend:

```bash
REACT_APP_API_URL=http://localhost:5001 npm start
```

In Windows PowerShell:

```powershell
$env:REACT_APP_API_URL = "http://localhost:5001"
npm start
```

The frontend then submits to `http://localhost:5001/predict` without changing source code.

The backend `/predict` endpoint parses and validates FASTA records, then runs local ESM-2 embeddings through the downloaded StandardScaler/XGBoost pipeline for valid sequences. It requires the local weights under `source/provided/model/` (or `ESM_MODEL_PATH` and `CLASSIFIER_MODEL_PATH`). Results are marked `experimental`: class labels provisionally follow the notebook, and scores are uncalibrated. The frontend displays provisional predictions, class-1 scores, model metadata, accuracy warnings, and sequence feature/structure panels. See [TOVERIFY.md](../TOVERIFY.md) for the tested dependency versions, native-crash diagnosis, and unresolved artifact provenance. The experiment uses one OpenMP thread and serializes inference within each API worker; restart the backend after updating.

## Where to work

- `ampstruct-frontend/src/App.js` — page composition and result flow.
- `ampstruct-frontend/src/components/FileUploader.js` — upload and API request.
- `ampstruct-frontend/src/components/ResultCard.js` — sequence metadata/result card.
- `ampstruct-frontend/src/components/ResultsToolbar.js` — sequence selector and CSV/TSV downloads.
- `ampstruct-frontend/src/utils/exportResults.js` — export columns, escaping, and browser downloads.
- `ampstruct-frontend/src/components/Feature1.js` — hydrophobicity and polarity highlights.
- `ampstruct-frontend/src/components/Feature2.js` — BioJS interactive sequence viewer.
- `ampstruct-frontend/src/components/Feature3.js` — structure prediction section.
- `ampstruct-frontend/src/components/Structure2D.js` — secondary-structure display.
- `ampstruct-frontend/src/components/Structure3D.js` — 3D structure display.
- `ampstruct-frontend/src/**/*.css` — interface styling.
- `ampstruct-backend/app.py` — Flask API routes.
- `ampstruct-backend/utils/fasta_parser.py` — FASTA parsing and validation.
- `AGENTS.md` — durable project context and working conventions.
- `TODO.md` — ranked UI team priorities.

## Inspect and download results

After an upload completes, use **Sequence to inspect** to select a record. One
result card and one set of visualization panels are shown at a time. Selection
uses the record's original position, so duplicate FASTA IDs remain separate.
Invalid records can be inspected and exported; their visualization panels are
not opened. A new upload clears previous results and resets selection.

Choose **Download CSV** or **Download TSV**. CSV is convenient for spreadsheet
applications, while TSV uses tabs as delimiters and is convenient for many
bioinformatics workflows. Both formats use UTF-8 and quote fields containing
the delimiter, quotes, or line breaks; use a delimited-file reader that supports
quoted fields. Spreadsheet formula-like text cells receive an apostrophe prefix.

Downloads include all records by default. **Download scope** can restrict the
export to the selected record, retaining its original record number. Fields
include the raw sequence, validation and prediction status, class ID, label,
full-precision class-1 and per-class scores, model name, verification flags,
accuracy note, warnings, and errors. Missing or unavailable predictions produce
blank prediction fields. Scores are not exported as calibrated confidence, and
these files do not establish model accuracy.

## Test FASTA files

Two small supplied test fixtures are versioned under `source/provided/`. Other supplied assets and model weights are ignored by Git and require the workspace asset bundle. Useful files include:

- `source/provided/uniprotkb_accession_Q9H1E1_2025_08_15.fasta` — sequence shown in the original mockup.
- `source/provided/testinf_file_amr.fasta` — AMR test sequence.
- `source/provided/testing_file_non_amr.fasta` — supplied fixture whose header identifies resistance protein MexB; its filename is not a trustworthy non-AMR label.

## Public pilot test panel

Downloaded protein references are separate from the supplied assets:

- `source/public/amr.fasta` — public AMR references.
- `source/public/non_amr_controls.fasta` — presumed non-AMR bacterial metabolic controls.
- `source/public/combined.fasta` — both groups for a multi-sequence upload.
- `source/public/manifest.csv` — source URLs, annotation-based labels, sequence checksums, and exact matches against the supplied CARD file.
- `source/public/README.md` — selection criteria and limitations.

These files are ignored by Git alongside the model weights. The small panel is for diagnostic testing; annotation-based negative controls and unknown training overlap prevent an independent accuracy claim.

With the backend environment activated, run from the repository root on macOS/Linux or Windows:

```text
python ampstruct-backend/download_public_references.py
python ampstruct-backend/benchmark_public.py
```

Results are written to `source/public/benchmark_results.csv` and `source/public/benchmark_summary.json`. The class mapping remains provisional; the script does not tune the mapping or classifier to these examples. Restart the backend after the asset reorganization. Update any custom `ESM_MODEL_PATH` or `CLASSIFIER_MODEL_PATH` values that still point to `source/model/`.

## Collaboration workflow

### Feature 2 sequence viewer

The interactive sequence viewer uses the installed `biojs-vis-sequence` 0.1.9 package through a local adapter; it does not load a runtime CDN or perform model inference. It validates protein input, renders BioJS residue positions, supports range selection, motif navigation, line-length/text-size controls, and independent hydrophobic and polar/charged annotation tracks. Empty, invalid, loading, timeout, and initialization-error states are shown explicitly. These qualitative tracks are not classifier attributions or predicted structural domains.

Enable automatic maintenance of the project map in `AGENTS.md` once per clone:

```bash
python3 scripts/install_git_hooks.py
```

On Windows PowerShell:

```powershell
py -3 scripts/install_git_hooks.py
```

The hooks refresh and stage only the generated map before commits. Every push
checks the committed map against the pushed files. A stale map is refreshed
locally and the push stops until the correction is committed; hooks do not
create or amend commits during a push. To refresh manually, run
`python scripts/update_project_map.py` using your Python 3 interpreter.
Dependencies, caches, and downloaded record listings are omitted; optional
local documentation and asset locations remain visible for navigation.

Before editing:

```bash
git switch ui-improvements
git pull --ff-only
```

Make focused changes, test the frontend with `npm start`, and check the relevant loading, invalid-file, empty, and API-error states. Keep large datasets, model files, and downloaded project assets under `source/`; that folder is intentionally ignored by Git.

The project should remain cross-platform. Prefer Node/npm scripts, Python standard-library path handling, environment variables, and documented shell alternatives over OS-specific commands or hardcoded paths. Test frontend behavior on both macOS and Windows when making changes to file upload, local API URLs, or process startup.

Do not create a pull request until the team has reviewed the branch changes together.
