# Translations (i18n pipeline)

State as of 2026-11-01; verify against the repo before relying.

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
