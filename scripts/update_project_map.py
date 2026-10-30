"""Refresh AGENTS.md's generated project map, including optional local assets."""

import argparse
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parent.parent
START = '<!-- PROJECT_MAP:START -->'
END = '<!-- PROJECT_MAP:END -->'
NOTES = {
    'AGENTS.md': 'project context and this generated navigation map',
    'README.md': 'setup, local servers, and public benchmark commands',
    'TODO.md': 'team priorities and assignments',
    'TOVERIFY.md': 'runtime verification and model accuracy limitations',
    '.githooks/': 'automatic map refresh and push checks',
    'scripts/': 'repository maintenance tools',
    'ampstruct-backend/': 'Flask API and experimental inference',
    'ampstruct-backend/app.py': 'FASTA upload endpoint and classifier',
    'ampstruct-backend/benchmark_public.py': 'run the public diagnostic panel',
    'ampstruct-backend/download_public_references.py': 'download annotated UniProt protein references',
    'ampstruct-backend/utils/esm_embedding.py': 'lazy ESM-2 loading and layer-33 mean pooling',
    'ampstruct-backend/utils/fasta_parser.py': 'FASTA parsing and amino acid validation',
    'ampstruct-frontend/': 'React application',
    'ampstruct-frontend/src/App.js': 'upload flow and selected-sequence detail panels',
    'ampstruct-frontend/src/components/FileUploader.js': 'upload, analyzing, success, and error states',
    'ampstruct-frontend/src/components/ResultCard.js': 'provisional predictions, scores, and accuracy warnings',
    'ampstruct-frontend/src/components/ResultsToolbar.js': 'sequence selection and CSV/TSV download controls',
    'ampstruct-frontend/src/utils/exportResults.js': 'delimited export of scores, metadata, warnings, and sequences',
    'ampstruct-frontend/src/utils/prediction.js': 'shared prediction availability and score validation',
    'ampstruct-frontend/src/components/Feature1.js': 'sequence property highlights',
    'ampstruct-frontend/src/components/Feature2.js': 'BioJS sequence viewer',
    'ampstruct-frontend/src/components/Feature3.js': 'structure section',
    'ampstruct-frontend/src/components/Structure2D.js': 'current secondary-structure demo',
    'ampstruct-frontend/src/components/Structure3D.js': 'current fixed-PDB demo viewer',
    'docs/': 'optional local documentation; ignored by Git',
    'docs/AMRNONAMR.ipynb': 'supplied LightGBM training notebook',
    'source/': 'local assets; only two supplied fixtures are versioned',
    'source/provided/': 'supplied sequences, scripts, and model weights',
    'source/provided/model/': 'local ESM-2 weights and experimental XGBoost pipeline',
    'source/provided/esm_embedding.py': 'supplied legacy helper; API code is in backend/utils',
    'source/provided/non_amr_hbb.fasta': 'nucleotide-like fixture; not a protein negative control',
    'source/provided/testing_file_non_amr.fasta': 'contains resistance protein MexB despite its filename',
    'source/public/': 'downloaded public diagnostic panel; ignored by Git',
    'source/public/metadata/': 'raw UniProt annotations and evidence',
    'source/public/amr/': 'individual AMR reference FASTA files',
    'source/public/non_amr_controls/': 'individual presumed-negative protein controls',
    'source/public/manifest.csv': 'labels, source URLs, versions, checksums, and overlap flags',
    'source/public/benchmark_results.csv': 'per-protein experimental predictions',
    'source/public/benchmark_summary.json': 'panel agreement and limitations',
    'source/verification/': 'earlier generated runtime diagnostics; ignored by Git',
}
# These optional locations are intentionally stable across fresh clones. Never
# enumerate ignored downloads, private documents, model contents, or caches.
LOCAL_PATHS = [
    'docs/AMRNONAMR.ipynb',
    'docs/Krushna Thakkar web UI updates - API for finetuning w features - API for viz.md',
    'docs/Krushna Thakkar web UI updates - API for finetuning w features - API for viz.zip',
    'source/README.md', 'source/provided/README.md',
    'source/provided/esm_embedding.py', 'source/provided/fasta_parser.py',
    'source/provided/non_amr_hbb.fasta',
    'source/provided/model/esm2_t33_650M_UR50D.pt',
    'source/provided/model/amr_pipeline_xgb.pkl',
    'source/provided/protein_fasta_protein_homolog_model.fasta',
    'source/provided/uniprotkb_accession_Q9H1E1_2025_08_15.fasta',
    'source/public/README.md', 'source/public/amr/',
    'source/public/non_amr_controls/', 'source/public/metadata/',
    'source/public/amr.fasta', 'source/public/non_amr_controls.fasta',
    'source/public/combined.fasta', 'source/public/manifest.csv',
    'source/public/benchmark_results.csv', 'source/public/benchmark_summary.json',
    'source/verification/',
]


def git(*args, data=None):
    return subprocess.check_output(['git', *args], cwd=ROOT, input=data)


def visible(path):
    parts = Path(path).parts
    return not any(
        part in {'node_modules', 'build', '__pycache__', 'uploads', '.git'}
        or part.startswith(('.venv', '._')) for part in parts
    ) and not any(part.startswith('.') and part not in {'.github', '.githooks', '.gitignore'} for part in parts) and not path.endswith('package-lock.json')


def project_map(paths):
    tree = {}
    for path in sorted(set([p for p in paths if p and visible(p)] + LOCAL_PATHS)):
        branch = tree
        for part in path.rstrip('/').split('/'):
            branch = branch.setdefault(part, {})
    lines = ['```text', 'AMPstruct/']

    def walk(branch, prefix='', parent=''):
        names = sorted(branch, key=lambda name: (
            not (bool(branch[name]) or parent + name + '/' in LOCAL_PATHS), name.lower()
        ))
        for i, name in enumerate(names):
            last = i == len(names) - 1
            path = parent + name
            directory = bool(branch[name]) or path + '/' in LOCAL_PATHS
            label = name + ('/' if directory else '')
            note = NOTES.get(path + ('/' if directory else ''), '')
            lines.append(prefix + ('└── ' if last else '├── ') + label + ('  # ' + note if note else ''))
            walk(branch[name], prefix + ('    ' if last else '│   '), path + '/')

    walk(tree)
    lines.append('```')
    return '\n'.join(lines)


def replace_map(document, rendered):
    if document.count(START) != 1 or document.count(END) != 1:
        raise ValueError('AGENTS.md must contain exactly one project-map marker pair.')
    before, rest = document.split(START)
    _, after = rest.split(END)
    return before + START + '\n' + rendered + '\n' + END + after


def current_paths(staged=False):
    args = ['ls-files', '--cached', '-z']
    if not staged:
        args += ['--others', '--exclude-standard']
    paths = git(*args).decode().split('\0')
    return [p for p in paths if p and (staged or (ROOT / p).is_file())]


def refresh_worktree(rendered):
    path = ROOT / 'AGENTS.md'
    original = path.read_text(encoding='utf-8')
    updated = replace_map(original, rendered)
    if original != updated:
        path.write_text(updated, encoding='utf-8')
    return original != updated


def stage_map():
    rendered = project_map(current_paths(staged=True))
    original = git('show', ':AGENTS.md').decode()
    updated = replace_map(original, rendered)
    refresh_worktree(rendered)
    if original != updated:
        # Stage only the generated block, preserving unrelated unstaged prose.
        mode = git('ls-files', '--stage', '--', 'AGENTS.md').decode().split()[0]
        object_id = git('hash-object', '-w', '--stdin', data=updated.encode()).decode().strip()
        git('update-index', '--cacheinfo', f'{mode},{object_id},AGENTS.md')
        print('Updated and staged the AGENTS.md project map.')
    return 0


def check_push():
    stale = []
    for line in sys.stdin:
        local_ref, object_id, _, _ = line.split()
        if set(object_id) == {'0'}:
            continue
        paths = git('ls-tree', '-r', '--name-only', '-z', object_id).decode().split('\0')
        try:
            document = git('show', f'{object_id}:AGENTS.md').decode()
            if document != replace_map(document, project_map(paths)):
                stale.append(local_ref)
        except (subprocess.CalledProcessError, ValueError):
            stale.append(local_ref)
    if stale:
        if (ROOT / 'AGENTS.md').is_file():
            refresh_worktree(project_map(current_paths()))
        print('Push stopped: stale project map in ' + ', '.join(stale) + '.', file=sys.stderr)
        print('Commit the refreshed AGENTS.md with the relevant files, then push again. For another branch, refresh and commit on that branch.', file=sys.stderr)
        return 1
    print('Project map matches the branches being pushed.')
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument('--stage', action='store_true')
    modes.add_argument('--pre-push', action='store_true')
    modes.add_argument('--check', action='store_true')
    args = parser.parse_args()
    if args.stage:
        return stage_map()
    if args.pre_push:
        return check_push()
    rendered = project_map(current_paths())
    if args.check:
        document = (ROOT / 'AGENTS.md').read_text(encoding='utf-8')
        return int(document != replace_map(document, rendered))
    changed = refresh_worktree(rendered)
    print('Project map updated.' if changed else 'Project map is current.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
