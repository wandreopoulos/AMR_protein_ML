"""Integration checks for project-map hooks, using disposable local repositories."""

from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


SOURCE = Path(__file__).resolve().parent.parent


class ProjectMapHooksTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'checkout'
        self.root.mkdir()
        for directory in ['scripts', '.githooks']:
            (self.root / directory).mkdir()
        for name in ['update_project_map.py', 'install_git_hooks.py']:
            shutil.copy2(SOURCE / 'scripts' / name, self.root / 'scripts' / name)
        for name in ['pre-commit', 'pre-push', 'run-project-map']:
            shutil.copy2(SOURCE / '.githooks' / name, self.root / '.githooks' / name)
        (self.root / 'AGENTS.md').write_text(
            'Context stays intact.\n<!-- PROJECT_MAP:START -->\nold map\n<!-- PROJECT_MAP:END -->\nMore context.\n'
        )
        (self.root / '.gitignore').write_text('docs/\nsource/\nnode_modules/\n.env\n')
        self.git('init', '--quiet')
        self.git('config', 'user.name', 'Project Map Test')
        self.git('config', 'user.email', 'map-test@example.invalid')
        self.python('install_git_hooks.py')
        self.python('update_project_map.py')
        self.git('add', '.')
        self.git('commit', '--quiet', '-m', 'Initial disposable test tree')

    def git(self, *args, check=True):
        return subprocess.run(['git', *args], cwd=self.root, capture_output=True, text=True, check=check)

    def python(self, script, *args, check=True, input=None):
        return subprocess.run(
            [sys.executable, str(self.root / 'scripts' / script), *args],
            cwd=self.root, capture_output=True, text=True, check=check, input=input,
        )

    def remote(self):
        path = Path(self.temp.name) / 'remote.git'
        self.git('init', '--bare', '--quiet', str(path))
        self.git('remote', 'add', 'test-remote', str(path))

    def test_refresh_is_stable_and_omits_private_and_generated_files(self):
        for name in ['docs/private-study.md', 'node_modules/library/private.js', 'build/output.js', '.env']:
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text('not part of the navigation map')
        self.python('update_project_map.py')
        document = (self.root / 'AGENTS.md').read_text()
        self.assertNotIn('private-study', document)
        self.assertNotIn('private.js', document)
        self.assertNotIn('output.js', document)
        self.assertNotIn('.env', document)
        self.assertIn('source/', document)
        self.assertIn('provided/', document)
        self.assertIn('public/', document)
        self.python('update_project_map.py', '--check')
        self.python('update_project_map.py')
        self.assertEqual(document, (self.root / 'AGENTS.md').read_text())

    def test_commit_stages_map_without_staging_unrelated_agent_notes(self):
        agents = self.root / 'AGENTS.md'
        agents.write_text(agents.read_text() + '\nUNSTAGED PERSONAL NOTE\n')
        (self.root / 'new_component.py').write_text('print("example")\n')
        self.git('add', 'new_component.py')
        self.git('commit', '--quiet', '-m', 'Add component')
        committed = self.git('show', 'HEAD:AGENTS.md').stdout
        self.assertIn('new_component.py', committed)
        self.assertNotIn('UNSTAGED PERSONAL NOTE', committed)
        self.assertIn('UNSTAGED PERSONAL NOTE', agents.read_text())
        self.assertIn('UNSTAGED PERSONAL NOTE', self.git('diff', '--', 'AGENTS.md').stdout)

    def test_push_checks_head_and_stops_stale_commit_then_allows_correction(self):
        self.remote()
        self.git('push', '--quiet', 'test-remote', 'HEAD:refs/heads/ui-improvements')
        original_remote = self.git('ls-remote', 'test-remote', 'refs/heads/ui-improvements').stdout
        (self.root / 'added_without_hook.py').write_text('print("example")\n')
        self.git('add', 'added_without_hook.py')
        self.git('commit', '--quiet', '--no-verify', '-m', 'Simulate skipped hook')
        rejected = self.git('push', '--quiet', 'test-remote', 'HEAD:refs/heads/ui-improvements', check=False)
        self.assertNotEqual(rejected.returncode, 0)
        self.assertIn('stale project map', rejected.stderr)
        self.assertEqual(original_remote, self.git('ls-remote', 'test-remote', 'refs/heads/ui-improvements').stdout)
        self.assertIn('added_without_hook.py', (self.root / 'AGENTS.md').read_text())
        self.git('add', 'AGENTS.md')
        self.git('commit', '--quiet', '-m', 'Refresh map')
        self.git('push', '--quiet', 'test-remote', 'HEAD:refs/heads/ui-improvements')
        remote_sha = self.git('ls-remote', 'test-remote', 'refs/heads/ui-improvements').stdout.split()[0]
        self.assertEqual(self.git('rev-parse', 'HEAD').stdout.strip(), remote_sha)

    def test_push_validates_committed_files_even_with_uncommitted_work(self):
        self.remote()
        (self.root / 'future_uncommitted_component.py').write_text('uncommitted')
        self.git('push', '--quiet', 'test-remote', 'HEAD:refs/heads/ui-improvements')

    def test_commit_updates_renamed_and_removed_paths(self):
        original = self.root / 'old_component.py'
        original.write_text('example')
        self.git('add', 'old_component.py')
        self.git('commit', '--quiet', '-m', 'Add original component')
        original.rename(self.root / 'renamed_component.py')
        self.git('add', '-A')
        self.git('commit', '--quiet', '-m', 'Rename component')
        document = self.git('show', 'HEAD:AGENTS.md').stdout
        self.assertNotIn('old_component.py', document)
        self.assertIn('renamed_component.py', document)
        (self.root / 'renamed_component.py').unlink()
        self.git('add', '-A')
        self.git('commit', '--quiet', '-m', 'Remove component')
        self.assertNotIn('renamed_component.py', self.git('show', 'HEAD:AGENTS.md').stdout)

    def test_installer_preserves_a_different_existing_hook_configuration(self):
        self.git('config', '--local', 'core.hooksPath', 'custom-hooks')
        rejected = self.python('install_git_hooks.py', check=False)
        self.assertNotEqual(rejected.returncode, 0)
        self.assertEqual('custom-hooks', self.git('config', '--get', 'core.hooksPath').stdout.strip())

    def test_deleted_remote_branch_does_not_require_a_map(self):
        update = 'refs/heads/old ' + '0' * 40 + ' refs/heads/old ' + '1' * 40 + '\n'
        self.python('update_project_map.py', '--pre-push', input=update)


if __name__ == '__main__':
    unittest.main()
