"""Enable this repository's project-map hooks without changing global Git settings."""

from pathlib import Path
import subprocess


def main():
    root = Path(__file__).resolve().parent.parent
    existing = subprocess.run(['git', 'config', '--get', 'core.hooksPath'], cwd=root, capture_output=True, text=True)
    if existing.returncode not in (0, 1):
        raise RuntimeError(existing.stderr)
    if existing.stdout.strip() not in ('', '.githooks'):
        raise RuntimeError('A different hooksPath is configured. Integrate the map hooks with it before installing.')
    for name in ['pre-commit', 'pre-push', 'run-project-map']:
        hook = root / '.githooks' / name
        hook.chmod(hook.stat().st_mode | 0o111)
    subprocess.run(['git', 'config', '--local', 'core.hooksPath', '.githooks'], cwd=root, check=True)
    print('Enabled project-map hooks for this checkout. Global Git settings were not changed.')


if __name__ == '__main__':
    main()
