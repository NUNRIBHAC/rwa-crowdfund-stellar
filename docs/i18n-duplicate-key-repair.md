# Raw JSON duplicate-key repair, prepared separately

Baseline: main 806ae365626b83e732cc1c7de5b5a03f977376fe, 26 November 2026.

## Defect

Every `frontend/i18n-json/ui/<locale>.json` for the 11 supported locales
contains two occurrences of `community.passwordShow`,
`community.passwordHide`, and `community.passwordStrength`. The last is a
four-leaf object. This is 33 repeated object keys and 66 redundant string
occurrences, not 66 duplicate Weblate contexts. JavaScript JSON parsing keeps
the last value. In French, the earlier strength values have ordinary spaces
before colons and the later values have NBSP. Runtime uses the later values.

## Repair and proof

The canonical exporter emits one effective value per key. The repair removes
the redundant definitions and preserves every parsed catalog value, including
the French NBSP. No runtime TypeScript file, UI behavior, translation text,
whitespace signature, Weblate record or translation history is changed.

A raw-token duplicate-key guard now runs before JSON projection checks. Its
regressions cover equal values, different values, escaped equivalent names,
arrays, separate object scopes, escaped strings and malformed JSON. It checks
all UI, legal and mail catalogs plus the whitespace baseline. It rejects the
unrepaired baseline with exactly 33 repeated keys and accepts the repaired 34
catalog files. All 11 before/after parsed catalogs compare equal. The ordinary
import/export and whitespace checks still pass.

The earlier whole-catalog Weblate comparison remains evidence of equality to
the parsed JSON's effective units, not raw duplicate-key absence or
byte-preserving import/export. This guard closes that specific gap. There is
no evidence from this defect that the deployed password controls failed.

This is separate from the 176-entry assistant documentary example batch.
No Weblate mutation is needed for an effective-value-preserving JSON repair.
PR publication, merge and deployment remain subject to their existing gates.
