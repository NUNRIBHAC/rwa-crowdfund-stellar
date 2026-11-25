#!/usr/bin/env python3
"""Verify a scoped Weblate export preserves every unrelated JSON leaf.

Usage: python scripts/check-weblate-preservation.py BEFORE_DIR AFTER_DIR NAMESPACE
Directories contain the eleven UI JSON catalogs. No writes or network actions.
"""
import json
import pathlib
import sys

LANGUAGES = ('en', 'pt', 'ar', 'de', 'es', 'fr', 'hi', 'ja', 'ko', 'zh-CN', 'zh-TW')


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('duplicate JSON key: ' + key)
        result[key] = value
    return result


def leaves(value, path=()):
    if isinstance(value, dict) and value:
        return {key: leaf for name, child in value.items() for key, leaf in leaves(child, path + (name,)).items()}
    if isinstance(value, list) and value:
        return {key: leaf for index, child in enumerate(value) for key, leaf in leaves(child, path + (index,)).items()}
    return {path: value}


def verify(before, after, namespace):
    if not namespace or '.' in namespace:
        raise ValueError('one nonempty top-level namespace is required')
    result = {}
    for language in LANGUAGES:
        def load(directory):
            return leaves(json.loads((pathlib.Path(directory) / (language + '.json')).read_text(), object_pairs_hook=unique_object))
        old, new = load(before), load(after)
        differences = [path for path in old.keys() | new.keys() if path[0] != namespace and (path not in old or path not in new or old[path] != new[path])]
        if differences:
            raise ValueError(language + ': unrelated leaves changed: ' + repr(differences))
        result[language] = len([path for path in old if path[0] != namespace])
    return result


if __name__ == '__main__':
    print(json.dumps({'preservedLeavesPerLanguage': verify(*sys.argv[1:]), 'languages': len(LANGUAGES)}))
