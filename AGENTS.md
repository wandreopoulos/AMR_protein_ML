# AMPstruct interface context

## Purpose

AMPstruct is a full-stack web application for analyzing antimicrobial peptide (AMP) sequences from FASTA files. Its audience is researchers and bioinformaticians who need fast, interpretable sequence predictions and structural context.

This workspace now contains the cloned AMPstruct application plus the project brief, embedded screenshots, and Krushna’s downloaded assets. Treat the brief as product context and the cloned React/Flask code as the implementation source of truth.

Source reviewed:

- `docs/Krushna Thakkar web UI updates - API for finetuning w features - API for viz.md`

Current team task list:

- `TODO.md` — assignments and priorities for the UI, model exploration, AI integration, and deployment work.

Read `TODO.md` alongside this file when planning project work. Keep durable project context and working conventions here; keep active assignments and proposed tasks in `TODO.md`.

## Colab notebook findings

The downloaded notebook is `docs/AMRNONAMR.ipynb`. Its actual pipeline is:

1. Mount Google Drive and load up to 6,500 AMR sequences, up to 6,500 non-AMR sequences, and one Q9H1E1 query sequence.
2. Filter out sequences shorter than 30 amino acids.
3. Load `esm2_t33_650M_UR50D` through `esm.pretrained.load_model_and_alphabet`.
4. Mean-pool the per-residue representation from layer 33 into one embedding per sequence.
5. Save embeddings and labels as `all_embeddings.npy` and `all_labels.npy`; the query receives label `-1` and is excluded from classifier training.
6. Run t-SNE with `n_components=2`, `perplexity=30`, and `random_state=42` for visualization.
7. Split labeled data 80/20 with stratification and train `lgb.LGBMClassifier` using the documented hyperparameters.
8. Evaluate with classification report, ROC AUC, confusion matrix, precision-recall curve, calibration curves, Brier scores, and 5-fold cross-validation.
9. Save the trained notebook model as `amr_lightgbm_model.pkl`, along with predictions, probabilities, labels, and a text report.

Important integration facts:

- The notebook’s trained model is LightGBM (`amr_lightgbm_model.pkl`), while the downloaded archive contains `model/amr_pipeline_xgb.pkl`. Do not assume these are interchangeable; identify the authoritative artifact before implementing inference.
- The notebook loads ESM-2 through the fair-esm package, which can download/load the 650M model. The local weights are now present at `source/provided/model/esm2_t33_650M_UR50D.pt` (approximately 2.6 GB). The extracted `esm_embedding.py` expects a model path relative to its own location, so verify that path before running it.
- The notebook’s top feature-importance plot labels features as embedding dimensions (`F0`, `F1`, etc.). Those are not directly human-readable biological features, so a UI explanation layer will need a separate attribution strategy if it is meant to explain hydrophobicity, polarity, residues, or domains.
- The notebook includes duplicate precision-recall plotting cells; treat this as exploratory notebook history rather than a production API contract.

## Product and ML model

- Input: FASTA file containing one or more peptide/protein sequences.
- Data sources mentioned: CARD and UniProt.
- Embeddings: Meta AI ESM-2, specifically `esm2_t33_650M_UR50D`; embeddings may be per-residue or mean-pooled and are stored as `.npy` files.
- Visualization research step: t-SNE with `n_components=2`, `perplexity=30`, `random_state=42`.
- Classifier: LightGBM on ESM-2 embeddings.
- Documented model settings: `n_estimators=500`, `learning_rate=0.03`, `num_leaves=64`, `subsample=0.8`, `colsample_bytree=0.8`, `reg_lambda=1.0`, `class_weight='balanced'`.
- Labels: the brief uses both AMP/non-AMP and AMR/non-AMR terminology. This is an important product-language issue to resolve before improving copy or visual hierarchy. Unknown/query sequences are represented by label `-1` in the training description.
- Planned outputs include prediction label, confidence/probability, sequence name, downloadable results, and eventually t-SNE and structural visualizations.

## Current interface model

The screenshots show a centered, vertically scrolling single-page interface with a light background, white cards, soft shadows, rounded corners, and a restrained blue/gray palette. The page is content-dense and science-oriented rather than dashboard-oriented.

Observed sections, in order:

1. Header: small DNA/peptide emoji icon and title `AMPstruct: AMR Protein Classifier`.
2. Compact controls near the header: a `Choose File` input, a selected filename/status area, and a classification/action control. Exact labels are difficult to read in the screenshot and should be verified in the implementation.
3. `FASTA File Sequences`: sequence metadata card showing sequence ID, length, and a `Valid` status, followed by the sequence text.
4. `Feature 1: Color-Based Sequence Highlights`: explanatory copy for hydrophobicity and polarity, plus color-coded residue strings.
   - Hydrophobicity is shown in green-toned residue chips.
   - Polarity is shown in yellow/pink/purple-toned residue chips.
   - The page explains that hydrophobicity and polarity help reveal AMP sequence signatures.
5. `Interactive Sequence Viewer (BioJS)`: a section intended for zooming/inspection and additional sequence-level structural detail. The screenshot shows a large mostly empty/light viewer area, so loading, empty, and error states need attention.
6. `Feature 3: Structure Prediction`: a pale blue panel with explanatory copy, a predicted secondary-structure string, and a `3D Structure Viewer`.
7. 3D viewer: large black canvas with a colored ribbon model. This is the strongest visual focal point in the current screenshots.

The brief also describes expected workflow capabilities that are not clearly visible in the screenshots: prediction labels/confidence, t-SNE plots, CSV/PNG export, feedback, token-authenticated API access, and robust multi-sequence result handling.

## Intended end-to-end flow

```text
Upload FASTA
  -> validate and parse sequences
  -> generate ESM-2 embeddings
  -> run LightGBM classifier
  -> show labels, confidence, and sequence names
  -> inspect residue feature highlights
  -> inspect BioJS sequence rendering
  -> inspect secondary/tertiary structure
  -> export or access results through API
```

## Interface improvement priorities

### Make the primary task obvious

- Establish a clear upload/submit area as the first visual step.
- Show progress for parsing, embedding, prediction, and structure loading; these are potentially long-running operations.
- Make the prediction result visible before the explanatory feature sections. A user should not have to scroll through the page to learn whether a sequence is predicted AMP/AMR.
- Separate per-sequence results when a FASTA contains multiple records. Consider a sequence list/table with selection driving the detail panels.

### Improve information hierarchy

- Use a consistent status system for `valid`, `invalid`, `processing`, `predicted`, `failed`, and `not available`.
- Pair every model output with plain-language interpretation and confidence; avoid presenting a probability as certainty.
- Distinguish clearly between sequence input, model prediction, explanatory feature visualization, and structural prediction.
- Add visible section navigation or a compact stepper if the page remains long.

### Resolve terminology and trust issues

- Decide whether the product predicts antimicrobial activity (AMP) or antimicrobial resistance (AMR). The brief and UI title currently mix these terms.
- Explain what confidence means, what training labels represent, and when a result is outside the model’s supported domain.
- The documented ROC curve reports AUC 1.00 and the confusion matrix shows 23 false negatives and no false positives. Treat these as model-evaluation artifacts, not user-facing claims, until validated on an independent dataset.
- Add model/version, timestamp, and sequence validation details to result metadata.

### Make visualizations useful

- Add legends and tooltips to residue color coding; color alone is insufficient for accessibility.
- Provide a compact residue legend and allow toggling hydrophobicity/polarity layers.
- Give the BioJS viewer explicit loading, empty, unavailable, and error states; the screenshot suggests a large blank area when no rendering is visible.
- Make the secondary-structure string readable with wrapping, residue indexing, and a legend.
- Provide 3D controls (rotate, zoom, reset, representation/color mode) and a fallback message when no structure is available.
- If t-SNE is exposed, explain that it is exploratory and show class legend, query points, and dataset context.

### Accessibility and usability

- Do not rely on green/red or color chips alone to communicate validity or prediction.
- Ensure residue text remains readable at normal zoom and on narrow screens.
- Use semantic headings, labeled controls, keyboard-accessible viewers, visible focus states, and screen-reader labels for canvases.
- Preserve raw FASTA text and provide copy/download actions.
- Use responsive layouts; the current screenshots are desktop-width and do not establish mobile behavior.

## Current project map

This generated map follows the application files, not the brief's conceptual
layout. `docs/` and most of `source/` are optional local assets: their documented
locations are shown even in fresh clones, while downloaded records, model
contents, dependencies, build output, and runtime caches are omitted. CSS and
test files sit beside the components they support.

<!-- PROJECT_MAP:START -->
```text
AMPstruct/
├── .githooks/  # automatic map refresh and push checks
│   ├── pre-commit
│   ├── pre-push
│   └── run-project-map
├── ampstruct-backend/  # Flask API and experimental inference
│   ├── utils/
│   │   ├── esm_embedding.py  # lazy ESM-2 loading and layer-33 mean pooling
│   │   └── fasta_parser.py  # FASTA parsing and amino acid validation
│   ├── app.py  # FASTA upload endpoint and classifier
│   ├── benchmark_public.py  # run the public diagnostic panel
│   ├── download_public_references.py  # download annotated UniProt protein references
│   ├── Procfile
│   └── requirements.txt
├── ampstruct-frontend/  # React application
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── src/
│   │   ├── components/
│   │   │   ├── Feature1.css
│   │   │   ├── Feature1.js  # sequence property highlights
│   │   │   ├── Feature2.css
│   │   │   ├── Feature2.js  # BioJS sequence viewer
│   │   │   ├── Feature3.css
│   │   │   ├── Feature3.js  # structure section
│   │   │   ├── FileUploader.css
│   │   │   ├── FileUploader.js  # upload, analyzing, success, and error states
│   │   │   ├── FileUploader.test.js
│   │   │   ├── Header.js
│   │   │   ├── ResultCard.css
│   │   │   ├── ResultCard.js  # provisional predictions, scores, and accuracy warnings
│   │   │   ├── ResultCard.test.js
│   │   │   ├── Structure2D.css
│   │   │   ├── Structure2D.js  # current secondary-structure demo
│   │   │   ├── Structure3D.css
│   │   │   ├── Structure3D.js  # current fixed-PDB demo viewer
│   │   │   └── Widgets.js
│   │   ├── App.css
│   │   ├── App.js  # page composition and per-sequence panels
│   │   ├── index.css
│   │   └── index.js
│   ├── .gitignore
│   ├── package.json
│   └── README.md
├── docs/  # optional local documentation; ignored by Git
│   ├── AMRNONAMR.ipynb  # supplied LightGBM training notebook
│   ├── Krushna Thakkar web UI updates - API for finetuning w features - API for viz.md
│   └── Krushna Thakkar web UI updates - API for finetuning w features - API for viz.zip
├── scripts/  # repository maintenance tools
│   ├── install_git_hooks.py
│   ├── test_project_map.py
│   └── update_project_map.py
├── source/  # local assets; only two supplied fixtures are versioned
│   ├── provided/  # supplied sequences, scripts, and model weights
│   │   ├── model/  # local ESM-2 weights and experimental XGBoost pipeline
│   │   │   ├── amr_pipeline_xgb.pkl
│   │   │   └── esm2_t33_650M_UR50D.pt
│   │   ├── esm_embedding.py  # supplied legacy helper; API code is in backend/utils
│   │   ├── fasta_parser.py
│   │   ├── non_amr_hbb.fasta  # nucleotide-like fixture; not a protein negative control
│   │   ├── protein_fasta_protein_homolog_model.fasta
│   │   ├── README.md
│   │   ├── testinf_file_amr.fasta
│   │   ├── testing_file_non_amr.fasta  # contains resistance protein MexB despite its filename
│   │   └── uniprotkb_accession_Q9H1E1_2025_08_15.fasta
│   ├── public/  # downloaded public diagnostic panel; ignored by Git
│   │   ├── amr/  # individual AMR reference FASTA files
│   │   ├── metadata/  # raw UniProt annotations and evidence
│   │   ├── non_amr_controls/  # individual presumed-negative protein controls
│   │   ├── amr.fasta
│   │   ├── benchmark_results.csv  # per-protein experimental predictions
│   │   ├── benchmark_summary.json  # panel agreement and limitations
│   │   ├── combined.fasta
│   │   ├── manifest.csv  # labels, source URLs, versions, checksums, and overlap flags
│   │   ├── non_amr_controls.fasta
│   │   └── README.md
│   ├── verification/  # earlier generated runtime diagnostics; ignored by Git
│   └── README.md
├── .gitignore
├── AGENTS.md  # project context and this generated navigation map
├── README.md  # setup, local servers, and public benchmark commands
├── requirements.txt
├── TODO.md  # team priorities and assignments
└── TOVERIFY.md  # runtime verification and model accuracy limitations
```
<!-- PROJECT_MAP:END -->

### Automatic maintenance

- Do not edit the generated block by hand. Run `python scripts/update_project_map.py`
  after adding, moving, or removing files.
- Enable repository-local hooks once per checkout with
  `python scripts/install_git_hooks.py` (macOS/Linux can use `python3`; Windows
  can use `py -3`). Hooks are enabled in the current workspace.
- Before each commit, the hook regenerates the map from staged paths and stages
  only the generated block. Other unstaged edits to this file stay unstaged.
- Before every push, the hook checks each pushed tree against its committed
  map. If stale, it refreshes the working map and stops the push; commit the
  correction with the relevant files and push again. It never creates or amends
  commits during a push. `--no-verify` bypasses Git hooks; do not use it to skip
  map maintenance.
- The generator uses a small documented list of optional local asset locations;
  update that list and descriptions in `scripts/update_project_map.py` when the
  asset layout or component responsibilities change. It does not enumerate
  private documents or model files.

Relevant external references in the brief:

- GitHub: `https://github.com/wandreopoulos/AMR_protein_ML/tree/krushna_thakkar_AMR_repo`
- Deployment: `https://ampstruct-frontend.onrender.com`
- 3D structure demo video: Google Drive link in the source brief

## Relevant Krushna project sources

These links and paths were supplied by the team and should be treated as relevant source material for future interface and data work:

- Google Doc: `https://docs.google.com/document/d/1wrelx_0m3bSHS2y07gGTDbuHAbh3Ur8phiwmmSSxpQM/edit?tab=t.0`
- Web interface mockup/repository: `https://github.com/wandreopoulos/AMR_protein_ML/tree/krushna_thakkar_AMR_repo`
- Google Drive dataset folder: `https://drive.google.com/drive/folders/1PIjmw0ZhhcFX0Cis-sJvN_sQAJlFzhR3`
- Historical supplied archive filename: `drive-download-20261028T013335Z-1-002.zip` (not present during the October 29 reorganization)
- Supplied working assets: `source/provided/`
- Downloaded public test panel: `source/public/` (FASTA, source metadata, manifest, benchmark outputs)

The Colab notebook linked from the Google Doc used these Google Drive FASTA inputs:

```text
amr_path = "/content/drive/MyDrive/GeneCode/card-data/protein_fasta_protein_homolog_model.fasta"
non_amr_path = "/content/drive/MyDrive/GeneCode/balanced_non_amr_from_allgenomes.faa"
query_path = "/content/drive/MyDrive/GeneCode/uniprotkb_accession_Q9H1E1_2025_08_15.fasta"
save_dir = "/content/drive/MyDrive/GeneCode/esm_embeddings"
```

The supplied assets are organized under `source/provided/` and documented in `source/provided/README.md`. The historical ZIP filename is recorded above, but the ZIP was not present during the October 29 reorganization; no original ZIP was deleted. The supplied folder contains FASTA fixtures, `fasta_parser.py`, `esm_embedding.py`, a `Procfile`, and `model/amr_pipeline_xgb.pkl`. Preserve the original ZIP if restored. The classifier is a StandardScaler/XGBoost pipeline, distinct from the documented LightGBM model.

Public pilot fixtures are downloaded with `python ampstruct-backend/download_public_references.py` and evaluated with `python ampstruct-backend/benchmark_public.py`. Raw UniProt records, FASTA files, a label/provenance manifest, and results live under ignored `source/public/`. The 10 negative examples are presumed bacterial metabolic controls, not experimentally proven absence of AMR function. Seven of the 10 AMR examples exactly match the supplied CARD FASTA, and complete training overlap is unknown. Treat this as a diagnostic panel, not an independent accuracy estimate. Keep class mapping provisional; do not reverse labels to fit these examples.

## Working rules for future interface changes

- Preserve the scientific workflow, but optimize for progressive disclosure: result first, explanation second, deep visualization third.
- Keep prediction state and visualization state explicit; a viewer should never look like it is loaded when it is empty or stale.
- Prefer reusable components for upload/status, sequence metadata, result summary, residue legend, visualization panels, and export actions.
- Keep terminology consistent across title, labels, API responses, and documentation.
- When changing visual styling, inspect both the full-page flow and long-sequence behavior. Dense residue chips can create wrapping and accessibility problems.
- For every UI change, check loading, empty, invalid FASTA, multiple sequences, model/API failure, no-structure, and narrow viewport states.
- Treat macOS and Windows as supported development environments. Avoid OS-specific paths and commands in application code; document both shell variants when setup instructions differ.

## Open questions

- Is the user-facing prediction target AMP activity, AMR status, or both?
- Which backend endpoints and response schema are actually implemented?
- Are ESM-2 embedding generation and structure prediction synchronous or asynchronous?
- What are the supported FASTA limits (file size, sequence count, sequence length, alphabet)?
- Is BioJS currently functional in production, or only represented as a planned feature?
- Which structure provider is authoritative: SPIDER3, AlphaFold, or another service?
- What export formats and authentication behavior are implemented today?
