# Skills reference collection

A curated copy of the Stellar/Soroban "agent skill" collection that the project
owner supplied for reference during development of this crowdfunding platform.

These files are **reference documentation**: guidance, checklists and examples
to consult while writing contracts, frontend code and compliance documents.
They are not installed or executed by this repository, and copying them into a
folder does not give any tool new capabilities. Nothing here is wired into CI,
the backend or the contracts.

## What is included

Skills are copied into `skills/` when the right to publish them is
established. See `NOTICE.md` for attribution and `INDEX.md` for the full
catalog - the 222 supplied entries plus the skills discovered on GitHub on
2026-10-30 - with the provenance, rights and include now / include for later
/ not include status of each.

- 44 owner-authored EU compliance and legal guides (originally 46; the two
  duplicate pairs were merged on 2026-10-30 with the owner's approval - the
  merge map is in `INDEX.md`). The project owner confirmed his authorship on
  2026-10-29, and the guides were reviewed against current official EU
  sources; see `ASSESSMENT.md` for the review notes. They are published as
  written by the owner, with no license granted yet - all rights reserved by
  the owner.
- 17 skills from [nrxschool/blockchain-skills](https://github.com/nrxschool/blockchain-skills)
  (CC-BY-4.0 content / MIT code), verified identical to upstream.
- `soroban-common-mistakes` (MIT, Aayush Gupta), `stellar-prices-api`
  (MIT, Rumble Fish Poland) and `stellar-scout` (MIT, Stellar Light),
  LICENSE files preserved; all three verified byte-identical to their
  upstream repositories.
- 29 skills discovered on GitHub on 2026-10-30 (testing, database and
  operations, security and accessibility, payments, documentation and
  design, Stellar tooling), each content-read and license-verified at its
  upstream source, plus 2 supplied entries (`stellar-anchor-skill`,
  `scaffold-stellar`) whose upstream licenses were verified the same day.
  Sources and licenses are listed in `NOTICE.md`.

## What is not included, and why

The remaining supplied skills have no license file or an unverified origin
(third-party authors, community collections without a clear license, or no
stated author at all). The same applies to discovered candidates whose rights
could not be verified. Because this repository is public, they are not copied
here. `INDEX.md` lists each one with its status.

To keep the full collection available locally without publishing it, copy the
original archive into `docs/skills-reference/private/` — that path is in
`.gitignore`, so it never gets committed.

## How to use a skill

1. Open `INDEX.md`, find the topic (contract security, testing, Freighter
   integration, EU compliance, ...).
2. Read the skill's `SKILL.md` as a checklist while doing that work.
3. Treat every claim as a starting point: verify Stellar/Soroban details
   against the official docs (developers.stellar.org) and legal/compliance
   content against official EU sources. Nothing here is legal advice.

## Maintenance

- Update an included skill by replacing its folder with a newer upstream
  version and re-checking the upstream license.
- Record any newly added third-party skill in `NOTICE.md` and `INDEX.md`.
