# Skills collection assessment

Assessment date: 2026-10-29.

## What was assessed

- The supplied collection: 222 skill folders, 485 files. Every skill's
  summary was read; the decision-relevant guides were read in full.
- The GitHub sources the files link to, checked live where they exist.
- All 46 owner-authored EU compliance guides, reviewed in full against
  current official EU sources (EUR-Lex, ESMA). This is a documentation
  review, not legal advice or certification.

## Useful now, for the demo

1. `freighter-best-practices` - the only guide written for the Freighter
   extension codebase itself. Rights: no license stated, origin unverified,
   so not published here.
2. `dapp` + `frontend` - Freighter and Wallets Kit integration patterns.
   Rights: unstated origin (`dapp`); declared-only license (`frontend`,
   stellarskills family), so not published here.
3. `sozu-faucet` - one-command testnet USDC. Declares MIT in its own file
   (author: blessedux), but the upstream repository is no longer reachable
   to verify, so not published here.
4. `soroban-testing` + `testing` - testnet E2E patterns. `soroban-testing`
   is published here (nrxschool, license verified upstream); `testing` is
   stellarskills family (declared-only), so not published here.
5. `state-archival` - TTL and state restoration rules. stellarskills family,
   so not published here.

## Useful later, for the real product

- The 46 owner-authored EU compliance guides - published in `skills/`;
  reviewed below.
- The SCF set (13 guides) - direct fit for a Stellar Community Fund
  application. Rights unclear; names only in `INDEX.md`.
- The Soroban security set - `soroban-security`, `smart-contract-security`
  and `soroban-common-mistakes` are published with verified licenses;
  `stellar-eu-crowdfunding-smart-contract-auditor` is owner-authored and
  published.
- `passkeys` + `smart-accounts` - the wallet-upgrade path. `passkeys`
  references kalepail/passkey-kit (MIT verified upstream), but the file
  itself declares no license; `smart-accounts` is stellarskills family.
- `agent-browser-webauthn` - automated passkey tests in a browser. Not
  applicable to extension wallets such as Freighter. Rights unclear.
- The ecosystem scouting set - `stellar-scout` declares MIT (homepage only,
  unverified upstream); the rest declare nothing.
- `develop-secure-contracts` declares AGPL-3.0-only (author: OpenZeppelin),
  verified against the upstream repository. A real license, but strong
  copyleft; publishing a copy needs a deliberate decision and a separate
  license boundary.

## Legal review of the 46 owner-authored guides

Every guide was read in full and its concrete legal claims (thresholds,
deadlines, article references, investor-protection rules) were checked
against official sources on 2026-10-29. The guides are checklists and
technical guidance, not legal advice.

Key rules verified as stated: the ECSPR EUR 5,000,000 limit per project
owner over 12 months; the 4-day pre-contractual reflection period for
non-sophisticated investors; the entry knowledge test and simulation of
ability to bear loss; the KIIS under Article 23; prudential safeguards of
the higher of EUR 25,000 or one quarter of fixed overheads (Article 11);
the bulletin-board model under Article 25; DORA applying since
17 January 2025 and covering crowdfunding service providers; TLPT at least
every three years and only when designated; MiCA CASP service classes and
minimum capital by class; the MiCA 14-day retail right of withdrawal
(Article 13); Transfer of Funds Regulation travel-rule obligations.

### Proposed corrections (pending owner review; published files are unchanged originals)

1. SEP numbering (several guides): the Soroban token interface is SEP-41,
   not "SEP-20" (SEP-20 is self-verification of validator nodes); SEP-40 is
   the oracle consumer interface, not an asset standard; SEP-35 is
   operation IDs, not clawback (clawback is a native protocol feature,
   CAP-0035, enabled via account flags); SEP-3 (Compliance Protocol) is
   abandoned; KYC data is SEP-12, not SEP-1. Affected:
   `eu-compliant-stellar-crowdfunding-engineering`,
   `crowdfunding-partnership-outreach`,
   `eu-crowdfunding-tokenization-compliance-writer`,
   `eu-prospectus-and-tokenization-compliance-counsel`,
   `stellar-eu-crowdfunding-compliance-support`,
   `stellar-eu-crowdfunding-compliance-devrel`,
   `stellar-eu-tokenization-custodian`,
   `stellar-eu-tokenization-treasury-management`,
   `compliant-eu-tokenization-cloud-infrastructure`.
2. Investor limits: "EUR 1,000 or 5% of net worth"
   (`eu-compliant-stellar-crowdfunding-engineering`) and "EUR 5,000 or 10%
   of net worth per project" (`eu-crowdfunding-tokenization-compliance-writer`)
   are not EU crowdfunding rules. ECSPR uses the entry knowledge test plus a
   simulation of ability to bear loss referenced to 10% of net worth, which
   triggers a risk warning rather than a hard cap. The same nuance applies
   to the "maximum investment limit" framing in
   `eu-crowdfunding-investor-suitability-assessment`.
3. Clawback "mandatory": several guides describe clawback or freeze
   capability as mandatory under EU law. No EU rule mandates it; it is a
   design choice that supports court-ordered recovery. Affected:
   `eu-compliant-stellar-crowdfunding-engineering`,
   `stellar-eu-tokenization-custodian`,
   `stellar-eu-tokenized-crowdfunding-compliance`,
   `stellar-eu-crowdfunding-compliance-risk`.
4. Prospectus approval: prospectuses are approved by the home Member
   State's national competent authority, not ESMA
   (`eu-crowdfunding-sanctions-compliance`). The same guide's blanket ban on
   EU high-risk third countries overstates AML rules: those jurisdictions
   trigger enhanced due diligence, not an automatic prohibition.
5. DORA incident reporting: the binding deadlines are an initial
   notification within 4 hours of classifying the incident as major and no
   later than 24 hours from awareness, an intermediate report within
   72 hours, and a final report within one month (RTS (EU) 2024/1772), not
   "end of the business day" (`dora-ict-operational-resilience-specialist`).
   Reports go to the national competent authority, not the ESAs
   (`dora-ict-operational-resilience-compliance`). That file's "annual basic
   TLPT" conflates annual basic resilience testing with TLPT, which runs at
   least every three years and only when designated.
6. Withdrawal periods: the 14-day retail withdrawal right is MiCA
   Article 13 for crypto-assets other than asset-referenced tokens and
   e-money tokens; the ECSPR reflection period is 4 days.
   `stellar-eu-crowdfunding-compliance-risk` mixes the two.
7. Threshold and citation scope: the EUR 5M ceiling belongs to ECSPR and
   the Prospectus Regulation, not "MiCA limits"
   (`stellar-eu-tokenization-architecture`); the "EUR 500k-EUR 8M" issuer
   range exceeds the ECSPR ceiling (`crowdfunding-partnership-outreach`);
   "ECSPR Art. 12" cited for dividend distributions is the
   conflicts-of-interest article
   (`stellar-eu-tokenization-treasury-management`); "3-page KIIS" is not a
   defined limit (`eu-crowdfunding-tokenization-compliance-advisor`); CASP
   minimum capital is set by service class (EUR 50,000 / 125,000 / 150,000),
   not "higher depending on volume" (`eu-mica-casp-licensing-counsel`); a
   Swiss foundation is not an EU legal wrapper
   (`eu-web3-governance-advisor`); "EUR 1,000 standard AML trigger"
   misstates the Transfer of Funds Regulation - CASP transfers carry
   travel-rule data regardless of amount, and EUR 1,000 only marks the
   self-hosted wallet verification threshold
   (`eu-crypto-crowdfunding-compliance-integration`,
   `stellar-eu-crowdfunding-compliance-risk`).
8. Terminology: ECSPR's investor checks are the "entry knowledge test" and
   "simulation of ability to bear loss", not a MiFID "suitability test"
   (`stellar-eu-crowdfunding-compliance-support`); the disclosure document
   is the KIIS, not a PRIIPs "KID"
   (`stellar-eu-crowdfunding-community-manager`).
9. Duplicates: `stellar-eu-compliance-monitor` is byte-identical to
   `stellar-eu-crowdfunding-community-manager`;
   `stellar-eu-tokenization-treasury-management` and
   `stellar-eu-tokenization-treasurymanagement` are near-duplicates.
   Consolidation suggested.

### Design note

ECSPR covers transferable securities, admitted instruments for crowdfunding
purposes and loans, so the demo's deliberately non-transferable token does
not by itself settle whether ECSPR applies; and the clawback
recommendations in several guides pull against the non-transferable design.
The design direction is a decision for the owner with qualified EU counsel.

## Rights status of the remaining skills

- Published with verified permissive licenses: the 17 nrxschool skills,
  `soroban-common-mistakes`, `stellar-prices-api` (see `NOTICE.md`).
- Declared in the files but not verified at an upstream source:
  `sozu-faucet` (MIT, author blessedux; upstream repository unreachable),
  `stellar-scout` (MIT, homepage only), `stellartools-payments` (MIT,
  author Payroutes), `stellar-anchor-skill` and `trustless-work-dev`
  (Apache-2.0, authors Cheesecake Labs and Trustless Work). A declaration
  by a verified author is a real grant; these stay unpublished until the
  authorship is verified.
- Verified copyleft: `develop-secure-contracts` (AGPL-3.0-only,
  OpenZeppelin). The `openzeppelin` and `openzeppelin-relayer` folders are
  not OpenZeppelin's own files; they carry the stellarskills banner.
- Declared only in a source README, with no LICENSE file at the source: the
  stellarskills family (24 folders including `frontend`, `testing`,
  `security`, `state-archival`, `smart-accounts`, `stellar-knowledge`).
  Whether a README claim alone is an effective grant depends on the
  author's intent; unverified here.
- No license and no verified origin: the 13 SCF guides,
  `freighter-best-practices`, `dapp`, `agent-browser-webauthn`, the
  ecosystem scouting set, and the remaining entries. `INDEX.md` records
  their names only.
