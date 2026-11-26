"""Check the runtime image's explicit script COPY against local ESM imports.

This is a source-level packaging guard, not an image boot test.
"""
from pathlib import Path, PurePosixPath
import re
import shlex
import unittest

ROOT = Path(__file__).resolve().parents[2]


def missing_runtime_scripts(dockerfile, read_source):
    runtime = dockerfile.split(' AS runtime', 1)[1]
    copied = set()
    for line in runtime.splitlines():
        if line.startswith('COPY --from=build '):
            fields = shlex.split(line)
            if fields[-1] == 'backend/scripts/':
                copied.update(PurePosixPath(p).name for p in fields[2:-1])
    required = set()
    pending = ['host.mjs']
    while pending:
        name = pending.pop()
        if name in required:
            continue
        required.add(name)
        source = read_source(name)
        # Static import/export specifiers and literal dynamic imports only.
        for spec in re.findall(r'''(?:from\s*|import\s*\(\s*|import\s*)['"](\./[^'"]+\.mjs)['"]''', source):
            dependency = str(PurePosixPath(name).parent / spec)
            if '..' in PurePosixPath(dependency).parts:
                raise ValueError('script dependency escapes the runtime scripts directory')
            pending.append(dependency)
    return required - copied


class RuntimeScriptCopyTests(unittest.TestCase):
    def test_runtime_contains_transitive_host_script_imports(self):
        self.assertEqual(missing_runtime_scripts(
            (ROOT / 'Dockerfile').read_text(),
            lambda name: (ROOT / 'backend/scripts' / name).read_text(),
        ), set())

    def test_missing_route_module_is_detected(self):
        dockerfile = 'FROM node AS runtime\nCOPY --from=build /app/backend/scripts/host.mjs backend/scripts/\n'
        sources = {'host.mjs': "import { status } from './routes.mjs';", 'routes.mjs': 'export const status = 404;'}
        self.assertEqual(missing_runtime_scripts(dockerfile, sources.__getitem__), {'routes.mjs'})

    def test_transitive_missing_module_is_detected(self):
        dockerfile = 'FROM node AS runtime\nCOPY --from=build /app/backend/scripts/host.mjs /app/backend/scripts/routes.mjs backend/scripts/\n'
        sources = {'host.mjs': "import './routes.mjs';\nexport { status } from './routes.mjs';", 'routes.mjs': "const data = await import('./route-data.mjs');", 'route-data.mjs': 'export default [];'}
        self.assertEqual(missing_runtime_scripts(dockerfile, sources.__getitem__), {'route-data.mjs'})


if __name__ == '__main__':
    unittest.main()
