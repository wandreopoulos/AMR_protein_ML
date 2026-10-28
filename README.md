# AMPstruct — UI team branch

This branch is the working area for interface improvements to AMPstruct. It is based on Krushna’s `krushna_thakkar_AMR_repo` branch.

Branch: `ui-improvements`

## Quick start for teammates

Clone the branch:

```bash
git clone --branch ui-improvements https://github.com/wandreopoulos/AMR_protein_ML.git
cd AMR_protein_ML
```

### Start the frontend

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

### Start the backend

Open a second terminal at the repository root:

```bash
cd ampstruct-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

The Flask API listens on `http://localhost:5001`.

On Windows PowerShell, use:

```powershell
cd ampstruct-backend
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

If PowerShell blocks activation, use `python app.py` from an activated terminal, or configure the user-level execution policy according to your organization’s rules.

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

The current backend `/predict` endpoint parses and validates the uploaded FASTA file and returns sequence records. It does not yet run the classifier or generate ESM-2 predictions. The frontend then renders the returned records through the result card, feature highlights, BioJS viewer, and structure panels.

## Where to work

- `ampstruct-frontend/src/App.js` — page composition and result flow.
- `ampstruct-frontend/src/components/FileUploader.js` — upload and API request.
- `ampstruct-frontend/src/components/ResultCard.js` — sequence metadata/result card.
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

## Test FASTA files

The local test assets are in the ignored `source/` folder, so they are not included in a fresh Git clone. If you have the workspace asset bundle, useful files include:

- `source/krushna_ampstruct_assets/uniprotkb_accession_Q9H1E1_2025_08_15.fasta` — sequence shown in the original mockup.
- `source/krushna_ampstruct_assets/testinf_file_amr.fasta` — AMR test sequence.
- `source/krushna_ampstruct_assets/testing_file_non_amr.fasta` — non-AMR test sequence.

## Collaboration workflow

Before editing:

```bash
git switch ui-improvements
git pull --ff-only
```

Make focused changes, test the frontend with `npm start`, and check the relevant loading, invalid-file, empty, and API-error states. Keep large datasets, model files, and downloaded project assets under `source/`; that folder is intentionally ignored by Git.

The project should remain cross-platform. Prefer Node/npm scripts, Python standard-library path handling, environment variables, and documented shell alternatives over OS-specific commands or hardcoded paths. Test frontend behavior on both macOS and Windows when making changes to file upload, local API URLs, or process startup.

Do not create a pull request until the team has reviewed the branch changes together.
