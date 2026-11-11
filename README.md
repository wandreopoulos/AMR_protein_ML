# AMPstruct — Quick start

This branch contains the AMPstruct interface and experimental backend.

## Clone

```bash
git clone --branch ui-improvements https://github.com/wandreopoulos/AMR_protein_ML.git
cd AMR_protein_ML
```

## Quick start

For Windows (PowerShell):

```powershell
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { winget install --id OpenJS.NodeJS.LTS --exact --accept-source-agreements --accept-package-agreements; $env:Path += ";$env:ProgramFiles\nodejs" }; Set-Location ampstruct-frontend; npm install; $env:HOST = "localhost"; npm start
```

For macOS/Linux:

```bash
(command -v node >/dev/null 2>&1 || brew install node) && cd ampstruct-frontend && npm install && HOST=localhost npm start
```

If Node.js, Homebrew, or `winget` is unavailable, install Node.js LTS once
from [nodejs.org](https://nodejs.org/). Then open <http://localhost:3000>.

The quick start uses the configured deployed backend, so no Python or micromamba
setup is needed. For local backend setup, testing, model notes, exports, and
development workflow, see [docs/README.md](docs/README.md).

For local end-to-end development, start both services from the repository root:

```bash
(cd ampstruct-backend && .venv/bin/python app.py) & (cd ampstruct-frontend && REACT_APP_API_URL=http://localhost:5001 npm start)
```

Then open `http://localhost:3000`. The local backend runs the experimental
ESM-2/XGBoost classifier. The **Predict with ESMFold** control uses Meta's
public ESMFold API; its current public endpoint accepts sequences up to 400
residues. Analysis results receive an `analysis_id` and can later provide
JSON or TOON context to the planned chatbot. The ESM-2 embedding comparison
map is available through an explicit **Build map** action after uploading at
least two valid sequences.
