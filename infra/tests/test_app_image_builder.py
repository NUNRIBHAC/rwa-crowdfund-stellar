import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'build-app-image.sh'


class AppBuilderTest(unittest.TestCase):
    def invoke(self, args, *, free='9000000000', inspect_status=0, build_status=0, during_free=None, post_free=None):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            commands = root / 'commands'
            binary = root / 'bin'
            binary.mkdir()
            (root / 'Dockerfile').write_text('FROM scratch\n')
            (binary / 'docker').write_text(
                '#!/usr/bin/env python3\n'
                'import os,sys,json,time\n'
                'with open(os.environ["COMMANDS"],"a") as f: f.write(json.dumps(sys.argv[1:])+"\\n")\n'
                'if sys.argv[1:3]==["buildx","inspect"]: sys.exit(int(os.environ["INSPECT_STATUS"]))\n'
                'time.sleep(2 if os.environ.get("DURING_FREE") else 0.03)\n'
                'sys.exit(int(os.environ["BUILD_STATUS"]))\n'
            )
            (binary / 'df').write_text(
                '#!/usr/bin/env python3\n'
                'import os,pathlib\np=pathlib.Path(os.environ["COMMANDS"]+".df")\nn=int(p.read_text()) if p.exists() else 0\np.write_text(str(n+1))\nprint("Avail")\nprint(os.environ.get("POST_FREE") if n>=4 and os.environ.get("POST_FREE") else (os.environ.get("DURING_FREE") if n>=2 and os.environ.get("DURING_FREE") else os.environ["FREE"]))\n'
            )
            for file in binary.iterdir():
                file.chmod(0o755)
            environment = {
                **os.environ,
                'PATH': str(binary) + ':' + os.environ['PATH'],
                'COMMANDS': str(commands),
                'FREE': free,
                'INSPECT_STATUS': str(inspect_status),
                'BUILD_STATUS': str(build_status),
                'DURING_FREE': during_free or '',
                'POST_FREE': post_free or '',
            }
            result = subprocess.run(
                ['bash', str(SCRIPT), '--context', str(root), *args],
                capture_output=True, text=True, env=environment, timeout=10,
            )
            calls = [json.loads(line) for line in commands.read_text().splitlines()] if commands.exists() else []
            return result, calls

    def test_default_is_dedicated_builder_and_only_builds(self):
        result, calls = self.invoke(['--tag', 'blockallisto-app:test'])
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(calls[0], ['buildx', 'inspect', 'app-oled'])
        self.assertEqual(calls[1][:4], ['buildx', 'build', '--builder', 'app-oled'])
        self.assertIn('--load', calls[1])
        self.assertFalse(any('up' in call or 'create' in call for call in calls))

    def test_explicit_fallback(self):
        result, calls = self.invoke(['--builder', 'default', '--tag', 'blockallisto-app:test'])
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(calls[0], ['buildx', 'inspect', 'default'])

    def test_low_space_refuses_before_any_docker_call(self):
        result, calls = self.invoke(['--tag', 'blockallisto-app:test'], free='3355443199')
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(calls, [])

    def test_unmeasurable_space_refuses(self):
        result, calls = self.invoke(['--tag', 'blockallisto-app:test'], free='unknown')
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(calls, [])

    def test_no_silent_fallback_if_builder_unavailable(self):
        result, calls = self.invoke(['--tag', 'blockallisto-app:test'], inspect_status=1)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(calls, [['buildx', 'inspect', 'app-oled']])

    def test_build_failure_is_preserved(self):
        result, _ = self.invoke(['--tag', 'blockallisto-app:test'], build_status=7)
        self.assertEqual(result.returncode, 7)

    def test_during_build_disk_guard_cancels_without_deploy(self):
        result, calls = self.invoke(['--tag', 'blockallisto-app:test'], during_free='3355443199')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Build canceled', result.stderr)
        self.assertFalse(any('up' in call for call in calls))

    def test_post_build_floor_fails_without_activation(self):
        result, calls = self.invoke(['--tag', 'blockallisto-app:test'], post_free='3221225471')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Do not activate', result.stderr)
        self.assertEqual(len(calls), 2)

    def test_invalid_options_and_non_app_tags_fail_closed(self):
        for args in [[], ['--tag', 'other:test'], ['--builder', 'unknown', '--tag', 'blockallisto-app:test'], ['--tag']]:
            with self.subTest(args=args):
                result, calls = self.invoke(args)
                self.assertEqual(result.returncode, 2)
                self.assertEqual(calls, [])


if __name__ == '__main__':
    unittest.main()
