#!/usr/bin/env python3
"""Check every digest and byte count in the repository's font manifest."""
import hashlib
from pathlib import Path, PurePosixPath
import re


def verify_manifest(assets: Path) -> int:
    manifest = assets / 'fonts/SHA256SUMS.txt'
    seen = set()
    errors = []
    for number, line in enumerate(manifest.read_text(encoding='utf-8').splitlines(), 1):
        parts = line.split(maxsplit=2)
        if len(parts) != 3:
            raise ValueError(f'line {number}: expected SHA256, byte count and path')
        digest, size, name = parts
        path = PurePosixPath(name)
        if (not re.fullmatch(r'[0-9a-f]{64}', digest) or not size.isdecimal()
                or path.is_absolute() or '..' in path.parts
                or not path.parts or path.parts[0] != 'fonts'
                or name in seen):
            raise ValueError(f'line {number}: invalid or duplicate manifest entry')
        seen.add(name)
        target = assets.joinpath(*path.parts)
        if any(p.is_symlink() for p in [target, *target.parents]):
            raise ValueError(f'line {number}: symlinks are not font archive files')
        if not target.is_file():
            errors.append(f'{name}: missing file')
            continue
        data = target.read_bytes()
        if len(data) != int(size) or hashlib.sha256(data).hexdigest() != digest:
            errors.append(f'{name}: digest or byte count mismatch')
    if not seen:
        raise ValueError('font manifest is empty')
    if errors:
        raise ValueError('\n'.join(errors))
    return len(seen)


if __name__ == '__main__':
    try:
        count = verify_manifest(Path(__file__).resolve().parents[1] / 'assets')
    except (OSError, ValueError) as error:
        raise SystemExit(f'Font archive verification failed: {error}')
    print(f'Font archive: {count} entries verified (SHA256 and byte count)')
