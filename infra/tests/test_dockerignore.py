"""The Dockerfile does COPY . . : without a .dockerignore, local secrets and
caches ignored by Git would still be sent to the builder. These tests parse
the committed .dockerignore with a matcher for the pattern subset we use and
assert (a) sensitive/local paths are excluded from the build context and
(b) every input the image build actually needs is still included."""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
IGNORE = ROOT / '.dockerignore'


def load_patterns():
    patterns = []
    for raw in IGNORE.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith('#'):
            continue
        patterns.append(line)
    return patterns


def _regex(pattern):
    """Compile one pattern (already stripped of !) to a regex over root-relative
    paths. ** crosses directories; * and ? stay within one segment. A pattern
    that matches a directory excludes everything below it."""
    parts = []
    for seg in pattern.split('/'):
        if seg == '**':
            parts.append('.*')
        else:
            body = ''
            for ch in seg:
                if ch == '*':
                    body += '[^/]*'
                elif ch == '?':
                    body += '[^/]'
                else:
                    body += re.escape(ch)
            parts.append(body)
    return re.compile('^' + '/'.join(parts) + '(/.*)?$')


def match(pattern, path):
    negated = pattern.startswith('!')
    if negated:
        pattern = pattern[1:]
    pattern = pattern.strip('/')
    if pattern.startswith('**/'):
        # Leading **/: the remainder may sit at any depth, including root.
        rest = _regex(pattern[3:])
        candidates = [path] + ['/'.join(path.split('/')[i:]) for i in range(1, len(path.split('/')))]
        hit = any(rest.match(c) for c in candidates)
    else:
        hit = bool(_regex(pattern).match(path))
    return negated, hit


def ignored(path):
    result = False
    for pattern in load_patterns():
        negated, hit = match(pattern, path)
        if hit:
            result = not negated
    return result


class DockerignoreTest(unittest.TestCase):
    def test_sensitive_and_local_paths_are_excluded(self):
        for path in [
            '.git/HEAD',
            '.env',
            '.env.local',
            'backend/.env',
            'backend/.creator.json',
            'backend/.demo-investors.json',
            'backend/data/community-store.json',
            'backend/debug-ops.ts',
            'data/community-store.json',
            'deploy/env/staging.env',
            'node_modules/left-pad/index.js',
            'backend/node_modules/express/index.js',
            'backend/dist/server.js',
            'frontend/dist/index.html',
            'backend/coverage/lcov.info',
            'frontend/screenshots/home.png',
            'contracts/crowdfund/target/release/x',
            'docs/skills-reference/private/notes.md',
            'portal/build-public/index.html',
            'debug.log',
            '__pycache__/x.pyc',
        ]:
            self.assertTrue(ignored(path), f'{path} must be excluded from the build context')

    def test_build_inputs_are_not_excluded(self):
        required = [
            'package.json',
            'package-lock.json',
            'backend/package.json',
            'frontend/package.json',
            'backend/src/server.ts',
            'backend/src/soroban.ts',
            'backend/scripts/host.mjs',
            'backend/scripts/media-index.mjs',
            'backend/scripts/check-reviewed-wasm.mjs',
            'backend/wasm/reviewed-crowdfund.wasm',
            'backend/assets/fonts/JetBrainsMono-Regular.ttf',
            'backend/tsconfig.json',
            'frontend/src/App.tsx',
            'frontend/index.html',
            'frontend/vite.config.ts',
            'frontend/tsconfig.json',
            'frontend/i18n-json/ui/en.json',
            'backend/.env.example',
        ]
        for path in required:
            self.assertTrue((ROOT / path).exists(), f'{path} missing from repo (test needs updating)')
            self.assertFalse(ignored(path), f'{path} must stay in the build context')


if __name__ == '__main__':
    unittest.main()
