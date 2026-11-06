# Translations (i18n pipeline)

State as of 2026-11-06; verify against the repo before relying.

- The site UI ships 11 languages. String sources are TypeScript in
  `frontend/src/i18n/locales/`; exported JSON in `frontend/i18n-json/ui/`
  is what Weblate edits. Both are tracked; `i18n:export` and `i18n:check`
  gate consistency in CI.
- Weblate (self-hosted on the Oracle VM) has **read-only** GitHub access;
  public registration is closed. ~1,138 UI strings + 181 legal-document
  units per language were imported 2026-11-01.
- Legal documents go through a custom codec
  (`frontend/scripts/i18n-legal-codec.mjs`, with tests).
- Weblate checks catch errors and inconsistencies, not translation quality
  - natural-language review is still a human step.
- This docs portal is English-only for now (repo rule: committed content in
  English). Docusaurus i18n is native; wiring doc locales through Weblate
  is possible later but not done.

## Return flow (weblate/l10n -> main)

Weblate's JSON writer drops unit-less empty containers (e.g. `"news": []`)
and pretty-expands short arrays onto one line per element, so a raw
weblate/l10n branch can never be merged directly. The return flow is:

1. Merge current main into the weblate branch. Resolve JSON conflicts by
   taking the weblate side; step 3 re-canonicalizes formatting.
2. `npm run i18n:repair` (in `frontend/`): restores empty containers the
   serializer dropped, using the merge-base revision of each file as the
   structural reference, and re-orders keys back to base order.
   `--check` fails closed when such drift is present. Requires a git
   checkout (it queries the merge base) - deliberately not part of the
   archive-safe `i18n:check` gate. Never restores non-empty subtrees or
   scalars: a missing non-empty key is a different failure class and
   stays visible in the diff.
3. `npm run i18n:import` then `npm run i18n:export`: regenerate the TS
   locales and canonical JSON from the repaired files.
4. Standard gate (prettier, lint, tests, portal build) on a pristine
   archive of the exact commit, then merge. The resulting diff against
   main must show only real translation edits.

Behavioral coverage: `frontend/scripts/i18n-weblate-repair.test.mjs`.
