import hashlib
import importlib.util
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('font_archive_check', ROOT / 'scripts/check-font-archive.py')
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


class FontArchiveIntegrityTests(unittest.TestCase):
    def fixture(self, root, data=b'font bytes'):
        fonts = root / 'fonts'
        fonts.mkdir()
        (fonts / 'sample.woff2').write_bytes(data)
        line = f'{hashlib.sha256(data).hexdigest()}  {len(data)}  fonts/sample.woff2\n'
        (fonts / 'SHA256SUMS.txt').write_text(line)
        return fonts, line

    def test_repository_manifest(self):
        self.assertEqual(checker.verify_manifest(ROOT / 'assets'), 501)

    def test_valid_digest_and_size(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.fixture(root)
            self.assertEqual(checker.verify_manifest(root), 1)

    def test_changed_bytes_fail_even_with_same_size(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            fonts, _ = self.fixture(root)
            (fonts / 'sample.woff2').write_bytes(b'FONT bytes')
            with self.assertRaisesRegex(ValueError, 'mismatch'):
                checker.verify_manifest(root)

    def test_wrong_size_fails_even_with_correct_digest(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            fonts, line = self.fixture(root)
            (fonts / 'SHA256SUMS.txt').write_text(line.replace('  10  ', '  11  '))
            with self.assertRaisesRegex(ValueError, 'mismatch'):
                checker.verify_manifest(root)

    def test_missing_file_fails(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            fonts, _ = self.fixture(root)
            (fonts / 'sample.woff2').unlink()
            with self.assertRaisesRegex(ValueError, 'missing'):
                checker.verify_manifest(root)

    def test_duplicate_and_unsafe_paths_fail(self):
        for name in ['fonts/sample.woff2', '../outside', '/absolute', 'other/font']:
            with self.subTest(name=name), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                fonts, line = self.fixture(root)
                entry = f'{hashlib.sha256(b"font bytes").hexdigest()}  10  {name}\n'
                (fonts / 'SHA256SUMS.txt').write_text(line + entry)
                with self.assertRaisesRegex(ValueError, 'invalid or duplicate'):
                    checker.verify_manifest(root)

    def test_malformed_or_empty_manifest_fails(self):
        for content in ['', 'bad\n', 'bad  10  fonts/sample.woff2\n']:
            with self.subTest(content=content), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                fonts, _ = self.fixture(root)
                (fonts / 'SHA256SUMS.txt').write_text(content)
                with self.assertRaises(ValueError):
                    checker.verify_manifest(root)

    def test_symlink_fails(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            fonts, _ = self.fixture(root)
            (fonts / 'sample.woff2').rename(fonts / 'actual.woff2')
            (fonts / 'sample.woff2').symlink_to(fonts / 'actual.woff2')
            with self.assertRaisesRegex(ValueError, 'symlinks'):
                checker.verify_manifest(root)
