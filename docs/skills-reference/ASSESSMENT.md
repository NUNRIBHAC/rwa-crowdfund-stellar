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
6. The Soroban security set - access control, cap and refund checks are
   current work on the live testnet contract. `soroban-security`,
   `smart-contract-security` and `soroban-common-mistakes` are published
   here (licenses verified); `security` and `develop-secure-contracts` are
   not. `develop-secure-contracts` declares AGPL-3.0-only (author:
   OpenZeppelin), verified against the upstream repository - a real license,
   but strong copyleft; publishing a copy needs a deliberate decision and a
   separate license boundary. Reclassified from "useful later" on 2026-10-30.
7. Five of the 46 owner-authored guides whose core content applies to the
   current demo: `eu-compliant-stellar-crowdfunding-engineering` (escrow,
   refund and atomic-settlement mechanics), `stellar-eu-crowdfunding-smart-contract-auditor`
   (the audit method applies to the demo contract),
   `stellar-eu-tokenization-api-design` (endpoint and XDR-envelope patterns
   for the demo backend), `fintech-ux-design-for-eu-crowdfunding` and
   `eu-web-accessibility-compliance-wcag-eaa` (both apply to the current
   demo UI). Reclassified on 2026-10-30; the remaining 41 stay useful later.

## Useful later, for the real product

- 41 of the 46 owner-authored EU compliance guides - published in
  `skills/`; reviewed below. The other 5 are useful now (above).
- The SCF set (13 guides) - direct fit for a Stellar Community Fund
  application. Rights unclear; names only in `INDEX.md`.
- `passkeys` + `smart-accounts` - the wallet-upgrade path. `passkeys`
  references kalepail/passkey-kit (MIT verified upstream), but the file
  itself declares no license; `smart-accounts` is stellarskills family.
- `agent-browser-webauthn` - automated passkey tests in a browser. Not
  applicable to extension wallets such as Freighter. Rights unclear.
- The ecosystem scouting set - `stellar-scout` is published here (MIT,
  Stellar Light; verified byte-identical to the upstream repository); the
  rest declare nothing and stay out.

## Legal review of the 46 owner-authored guides

Every guide was read in full and its concrete legal claims (thresholds,
deadlines, article references, investor-protection rules) were checked
against official sources on 2026-10-29. The guides are checklists and
technical guidance, not legal advice.

National and vendor specifics were checked where the guides make concrete
claims, with these qualifications:
- MiCA licensing figures (eu-mica-casp-licensing-counsel): the capital
  classes EUR 50,000 / 125,000 / 150,000 with operation of a trading
  platform in Class 3 at EUR 150,000, or one quarter of the preceding
  year's fixed overheads, match ESMA's interactive rulebook for MiCA
  Article 67(1)(a) and Annex IV. The Central Bank of Ireland is confirmed
  as Ireland's MiCA competent authority (designated by S.I. No. 607/2024,
  per centralbank.ie). AMF (France) and BaFin (Germany) are confirmed as
  competent authorities via their own sites for both crowdfunding
  (ECSPR) and crypto-asset (MiCA) authorisation - BaFin:
  bafin.de crowdfunding and cryptoasset-services pages; AMF:
  amf-france.org PSFP page.
- DORA scope: crowdfunding service providers are listed in Article
  2(1)(s) of Regulation (EU) 2022/2554. The owning source is EUR-Lex
  (https://eur-lex.europa.eu/eli/reg/2022/2554/oj/eng). The Article 2
  text was confirmed against a verbatim mirror of the Official Journal
  text plus EUR-Lex recital-level context; the official full text was
  not independently confirmed line by line.
- EU VAT framing in the tax guide: single-purpose vouchers taxed at
  issuance and multi-purpose vouchers at redemption match the EU voucher
  rules (Directive 2006/112/EC as amended; see Council Directive
  (EU) 2016/1065 recitals); "security tokens generally VAT-exempt" matches
  the financial-services exemptions in Article 135(1) - both are general
  EU framings, not member-state filing advice.
- France: the 30% flat-tax figure matches official impots.gouv.fr guidance
  for occasional (non-professional) disposals of digital assets by French
  tax residents (12.8% income tax plus 17.2% social levies; regime in
  force since 1 January 2023). Scope conditions apply: French tax
  residence, occasional rather than professional trading, and digital-
  asset classification. Tokenized securities and distributions (dividends,
  interest, redemption proceeds) can fall under different regimes, so the
  figure must not be read as covering every token.
- EURC: the ACPR's official REGAFI register (updated 28/10/2026) lists
  the issuer entity, Circle Internet Financial Europe SAS, SIREN
  953 990 934, as an authorised electronic-money institution (agreement
  CIB 17788, France), matching the licence number Circle publishes. The
  register confirms the entity's authorisation; the claim that EURC
  itself is a MiCA-compliant e-money token rests on Circle's MiCA EURC
  white paper (an issuer document): https://www.circle.com/legal/mica-eurc-whitepaper
- Bitbond: a name search for "Bitbond" in the official BaFin
  Unternehmensdatenbank (data as of 28/10/2026) returned no matching
  entry, so current authorisation is not confirmed - legal entities,
  aliases or entity types may differ from the queried name. It remains
  only a historical example (the first BaFin-approved STO, 2019, per
  Bitbond's own materials), and the guides do not present it as a
  current provider.
What was NOT re-verified: member-state administrative practice (BaFin/AMF
processes) and the national tax, insurance and custody details beyond
these concrete claims - those sections point to local professionals and
should be read that way.

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
2. Investor limits: ECSPR Article 21(7) requires, each time a
   non-sophisticated investor invests more than the higher of EUR 1,000 or
   5% of net worth in an individual crowdfunding offer, a risk warning, the
   investor's explicit consent, and proof that the investor understands the
   investment and its risks - and the platform must prevent the investment
   if that proof is missing. Article 21(5) separately requires a simulation
   of the ability to bear loss, calculated as 10% of net worth; failing the
   knowledge test or the simulation does not by itself bar investing
   (Article 21(6)). `eu-compliant-stellar-crowdfunding-engineering` cites
   the EUR 1,000 / 5% figure as a "rule for specific crowdfunding tiers",
   which misdescribes this per-offer safeguard;
   `eu-crowdfunding-tokenization-compliance-writer`'s "EUR 5,000 or 10% net
   worth limit per project" matches neither threshold; and
   `eu-crowdfunding-investor-suitability-assessment` frames the 10%
   loss-simulation base as a hard "maximum investment limit", which it is
   not.
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
   72 hours, and a final report within one month (Delegated Regulation
   (EU) 2025/301 on reporting content and time limits; Delegated Regulation
   (EU) 2024/1772 on classification), not "end of the business day"
   (`dora-ict-operational-resilience-specialist`).
   Reports go to the national competent authority, not the ESAs
   (`dora-ict-operational-resilience-compliance`). That file's "annual basic
   TLPT" conflates annual basic resilience testing with TLPT, which runs at
   least every three years and only when designated.
6. Withdrawal periods: the 14-day retail withdrawal right is MiCA
   Article 13, applying to retail holders who buy crypto-assets other than
   asset-referenced tokens and e-money tokens directly from the offeror or
   from a CASP placing them; it does not apply where the crypto-assets were
   admitted to trading before the purchase, and cannot be exercised after
   the end of a time-limited subscription period. The ECSPR reflection
   period is 4 days for non-sophisticated investors.
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
9. Stale vendor and product references: the `EURT` examples predated
   current market reality - EURT on Stellar was issued by the Tempo anchor,
   whose current availability or authorization could not be confirmed
   against any official source, so the guides should not present EURT as a
   current funding asset. Examples now use `EURC`, which its issuer
   (Circle) states is issued by its French electronic-money institution
   licensed by the ACPR as a MiCA-compliant e-money token - the issuer's
   own statements, not independently register-checked
   (`stellar-eu-crowdfunding-community-manager`,
   `stellar-eu-compliance-monitor`,
   `stellar-eu-crowdfunding-growth-analytics`); "Rabe" corrected to the
   Rabet wallet (`stellar-eu-crowdfunding-compliance-support`); the
   payment-rails guide no longer names Tempo or Bitbond as live providers
   and instead tells the reader to verify a provider's current
   authorization in the relevant national register
   (`stella-eu-payment-rails-integration`).
10. Protocol references checked against the live Stellar ecosystem index:
    SEP-20 was cited "for self-custody" in `stellar-eu-crowdfunding-gtm-strategy`
    - SEP-20 is self-verification of validator nodes, so the reference was
    removed and the guide now says not to cite it as a custody mechanism;
    "SEP-12 (Identity API)" corrected to its actual title, KYC API
    (`eu-tokenization-expansion-specialist`); SEP-30 relabelled from a
    self-custody mechanism to what it is, a recoverysigner (multi-party key
    management) protocol (`stellar-eu-tokenization-custodian`); SEP-8
    (Regulated Assets) and SEP-24/31 usages verified correct.
11. Unverified authority attributions removed: the GTM example claimed
    Stellar's Clawback feature "satisfies BaFin's requirements for asset
    recovery" - no such BaFin requirement could be found at any BaFin
    source, so the example now presents clawback as an optional design
    choice, consistent with the corrected custodian guide.
12. Incident notification guidance in `eu-crypto-crowdfunding-incident-response`
    no longer cites generic "24-72 hours": crowdfunding service providers
    are in scope of DORA (Article 2(1)(s)), so the guide now carries the
    binding Delegated Regulation (EU) 2025/301 windows (initial 4h from
    classification and no later than 24h from awareness; intermediate 72h;
    final one month), and the "notify the AMF via their portal" step now
    says to use the channel the competent authority designates (the AMF is
    confirmed as France's crowdfunding competent authority).
13. `eu-crowdfunding-tokenization-insurance-advisor` now states the ECSPR
    Article 11 prudential safeguard precisely, verified against the full
    article text: at least the higher of EUR 25,000 or one quarter of the
    preceding year's fixed overheads, as own funds, an insurance policy
    covering the territories where offers are actively marketed (or a
    comparable guarantee), or a combination of the two - the "comparable
    guarantee" is an alternative within the insurance limb of Article
    11(2), not a standalone form (previously "at least EUR 25,000 or a
    percentage", which understated it, and "PII is mandatory", which
    overstated one permitted form).
14. `crowdfunding-partnership-outreach` no longer asserts "reduce
    administrative overhead by 40%" - an unevidenced figure - and now asks
    the sender to insert their own evidenced figure.
15. Duplicates: `stellar-eu-compliance-monitor` is byte-identical to
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
  `soroban-common-mistakes`, `stellar-prices-api`, `stellar-scout`
  (see `NOTICE.md`).
- Declared in the files but not verified at an upstream source:
  `sozu-faucet` (MIT, author blessedux; the candidate upstream repository
  carries no license), `stellartools-payments` (MIT, author Payroutes; no
  public source repository found) and `trustless-work-dev` (Apache-2.0,
  author Trustless Work; no matching public repository found). A
  declaration by a verified author is a real grant; these stay unpublished
  until the authorship is verified.
- Verified but deliberately not included: `stellar-anchor-skill`
  (Apache-2.0, Cheesecake Labs; verified byte-identical to upstream) - the
  earlier assessment grouped anchors with skills to skip for this project,
  so it is left out unless the owner asks for it.
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

## Second-pass review of the 46 owner guides (2026-10-30)

At the owner's request, all 46 guides were re-read in full on 2026-10-30 -
not only the 28 corrected in the first pass. For every guide this pass
checked: the full text end to end; its concrete legal claims (thresholds,
deadlines, article references, investor-protection mechanics, flag and SEP
references) against the sources listed below; internal consistency with the
corrected set; and fit with the current app (a testnet Soroban escrow demo
with non-transferable contribution balances, all-or-nothing funding and
atomic cap enforcement; identity, KYC, valuation, cashout and legal rights
are not implemented). This remains a documentation review, not legal advice
or certification.

Sources (the 2026-10-29 verified baseline, plus one fresh check marked
"fresh"):

- S1: ECSPR, Regulation (EU) 2020/1503, EUR-Lex - thresholds, Art. 11
  prudential safeguards, Art. 21 investor protections, Art. 23 KIIS,
  Art. 25 bulletin board.
- S2: MiCA, Regulation (EU) 2023/1114 - Art. 13 retail withdrawal, Art. 67
  and Annex IV capital, white paper rules. Art. 75 custody segregation was
  re-verified fresh on 2026-10-30 against the ESMA interactive rulebook
  (Art. 75(7): client crypto-assets segregated from the CASP's own holdings).
- S3: DORA, Regulation (EU) 2022/2554, plus Delegated Regulation (EU)
  2025/301 (reporting windows) and Delegated Regulation (EU) 2024/1772
  (classification).
- S4: Transfer of Funds Regulation (EU) 2023/1113 - travel rule.
- S5: ESMA interactive rulebook - MiCA service classes and capital.
- S6: ACPR REGAFI register (EURC issuer authorization) and Circle's MiCA
  EURC white paper.
- S7: BaFin Unternehmensdatenbank and BaFin/AMF sites.
- S8: impots.gouv.fr - French 30% flat tax framing.
- S9: Stellar ecosystem references - SEP-8/10/12/24/30/31/41 and CAP-0035.
- S10: European Accessibility Act, Directive (EU) 2019/882; WCAG 2.1/2.2 AA.
- S11: GDPR, Regulation (EU) 2016/679 - directional guidance.
- S12: Prospectus Regulation (EU) 2017/1129 - perimeter.

### Corrections made in the second pass

16. Clawback framing, remaining instances: the first pass corrected four
    guides (item 3 above); this pass found the same "clawback or freeze is
    required by EU law" framing in six more and corrected all of them to the
    design-choice wording, noting the conflict with non-transferable token
    designs: `eu-crowdfunding-tokenization-compliance`,
    `eu-crowdfunding-tokenization-compliance-writer`,
    `eu-crypto-asset-crowdfunding-cybersecurity-compliance`,
    `eu-tokenization-expansion-specialist`,
    `stellar-eu-tokenization-architecture`,
    `stellar-eu-crowdfunding-compliance-devrel`. The hard constraint in
    `stellar-eu-crowdfunding-compliance-risk` ("do not approve any asset that
    lacks clawback") and the conflated "KYC/AML clawback requirements"
    wording in `stellar-eu-tokenized-crowdfunding-compliance` were corrected
    the same way. No EU rule mandates clawback; this restates the position
    verified against EUR-Lex in the first pass.
17. `select-eu-compliant-stellar-funding-portals`: removed the "SEP-20"
    reference (SEP-20 is self-verification of validator nodes, not a portal
    standard; the relevant standards are SEP-24/SEP-6 for anchored flows and
    SEP-8 for regulated assets). The Bitbond example no longer presents
    Bitbond as currently BaFin-regulated: the BaFin Unternehmensdatenbank
    name search on 2026-10-28 returned no match, so the guide keeps Bitbond
    only as the historical 2019 STO example and tells the reader to verify
    any provider's current authorization in the relevant national register,
    consistent with `stella-eu-payment-rails-integration`. US terminology
    ("Broker-Dealer / Funding Portal") was replaced with the EU categories
    (ECSP, CASP, MiFID II investment firm).
18. `eu-crypto-asset-crowdfunding-cybersecurity-compliance`: incident
    reporting updated from a flat "24-hour window" to the binding Delegated
    Regulation (EU) 2025/301 windows (initial 4 hours from classification as
    major and no later than 24 hours from awareness; intermediate 72 hours;
    final one month), consistent with the two DORA guides.
19. Duplicates, handled conservatively: `stellar-eu-compliance-monitor` is
    byte-identical to `stellar-eu-crowdfunding-community-manager` and
    `stellar-eu-tokenization-treasurymanagement` is a near-duplicate of
    `stellar-eu-tokenization-treasury-management`. Both copies now carry a
    duplicate notice, and the monitor copy's frontmatter `name:` field -
    which literally carried the community-manager name - was corrected. A
    rewritten, monitoring-specific version of `stellar-eu-compliance-monitor`
    and a fold of the treasury copy's two unique operational points
    (SEPA-to-mint coordination, XLM operations reserve) into the canonical
    guide were prepared but NOT applied: rewriting a guide's purpose and
    moving content between guides are substantive authored changes, proposed
    to the owner separately rather than made unilaterally.

### Review record, all 46 guides

For every guide: full text re-read end to end; concrete claims compared
against the sources in the "Checked against" column (codes above);
consistency with the corrected set and with the current app checked.
"Corrections" names the pass that changed the guide. "Unresolved" lists what
this review did not establish. Guides not listed under any correction item
needed no change - the reasons are visible in the per-guide rows.

| Guide | Checked against | Corrections | Unresolved | App fit |
|---|---|---|---|---|
| `compliant-eu-tokenization-cloud-infrastructure` | S3, S9, S11 | Pass 1 (SEP-3/SEP-12 note) | Member-state hosting/administrative practice not re-verified | Real product only (production infrastructure) |
| `crowdfunding-partnership-outreach` | S1, S6, S9 | Pass 1 (SEP numbering, EUR 500k-8M range, unevidenced figure) | None identified | Real product only (issuer outreach) |
| `crowdfunding-secondary-market-advisor-eu-stellar` | S1 (Art. 25), S2, S9 | None | Market-making/proprietary-trading boundary is directional guidance | Real product only; the demo token is deliberately non-transferable |
| `dora-ict-operational-resilience-compliance` | S3 | Pass 1 (reporting windows, TLPT cadence, NCA routing) | None identified | Real product only |
| `dora-ict-operational-resilience-specialist` | S3 | Pass 1 (reporting windows) | None identified | Real product only |
| `ecspr-crowdfunding-compliance-specialist` | S1, S9 | None | None identified | Closest match to the demo's product shape, but none of the compliance flow is implemented |
| `eu-compliant-stellar-crowdfunding-engineering` | S1 (Art. 21(7)), S9 | Pass 1 (SEP-41, Art. 21(7) mechanics, clawback) | None identified | Usable now: escrow, refund and atomic-settlement mechanics map to the demo contract; the compliance hooks are for the real product |
| `eu-crowdfunding-governance-risk-advisor` | S1, S2 | None | Board 'fit and proper' detail is member-state specific | Real product only |
| `eu-crowdfunding-investor-suitability-assessment` | S1 (Art. 21(5)-(7)) | Pass 1 (simulation vs. limit framing) | None identified | Real product only (no investor checks in the demo) |
| `eu-crowdfunding-sanctions-compliance` | S1, S4, S12 | Pass 1 (prospectus approver, high-risk third countries) | None identified | Real product only |
| `eu-crowdfunding-tokenization-compliance` | S1, S9 | Pass 2 (clawback framing, item 16) | None identified | Real product only |
| `eu-crowdfunding-tokenization-compliance-advisor` | S1, S9 | Pass 1 ('3-page KIIS') | None identified | Real product only |
| `eu-crowdfunding-tokenization-compliance-writer` | S1, S9 | Pass 1 (SEP numbering, investor limits); pass 2 (clawback 'mandatory' constraint, item 16) | None identified | Real product only |
| `eu-crowdfunding-tokenization-insurance-advisor` | S1 (Art. 11) | Pass 1 (prudential safeguard precision) | Insurance-market specifics not re-verified | Real product only |
| `eu-crowdfunding-tokenization-tax-compliance` | S8, S2 | None | Member-state tax detail beyond the verified French example | Real product only |
| `eu-crypto-aml-ctf-compliance-officer` | S4, S7 | None | None identified | Real product only |
| `eu-crypto-asset-crowdfunding-cybersecurity-compliance` | S2 (Art. 75, fresh check 2026-10-30), S3, S9 | Pass 2 (freeze capability framing, DORA windows; items 16, 18) | None identified | Real product only |
| `eu-crypto-asset-investor-education` | S1 | None | None identified | Real product only |
| `eu-crypto-crowdfunding-compliance-integration` | S4, S9 | Pass 1 (EUR 1,000 TFR scope) | None identified | Real product only |
| `eu-crypto-crowdfunding-incident-response` | S3, S7 | Pass 1 (DORA windows, AMF channel) | None identified | Real product only |
| `eu-data-privacy-for-tokenized-crowdfunding` | S11, S9 | None | GDPR application to on-chain data is directional guidance | Real product only; overlaps current good practice (the demo keeps PII off-chain) |
| `eu-mica-casp-licensing-counsel` | S2, S5 | Pass 1 (capital-by-class) | None identified | Real product only |
| `eu-prospectus-and-tokenization-compliance-counsel` | S1, S9, S12 | Pass 1 (SEP-41) | None identified | Real product only |
| `eu-securities-legal-counsel-crowdfunding-tokenization` | S1, S2, S12 | None | None identified | Real product only |
| `eu-tokenization-expansion-specialist` | S1, S6, S9 | Pass 1 (SEP-12 title); pass 2 (clawback example, item 16) | None identified | Real product only |
| `eu-web-accessibility-compliance-wcag-eaa` | S10 | None | None identified | Usable now: accessibility applies to the current demo UI |
| `eu-web3-governance-advisor` | S2 | Pass 1 (Swiss foundation) | Legal-wrapper detail is member-state specific | Real product only |
| `fintech-ux-design-for-eu-crowdfunding` | S1 | None | None identified | Usable now: jargon translation, disclosure layout, dual-currency display and wallet UX apply to the demo UI |
| `select-eu-compliant-stellar-funding-portals` | S7, S9 | Pass 2 (SEP-20 removed, Bitbond currency, EU terminology; item 17) | No provider's current authorization is verified; the guide now instructs register checks | Real product only |
| `stella-eu-payment-rails-integration` | S6, S9 | Pass 1 (provider verification wording) | Provider availability changes fast; verify at integration time | Real product only (the demo uses testnet USDC) |
| `stellar-eu-compliance-monitor` | S1, S6 (current content is the community-manager text) | Pass 2 (duplicate notice; frontmatter name corrected - it carried the community-manager name; item 19) | The rewritten monitoring version is proposed to the owner separately | Real product only |
| `stellar-eu-crowdfunding-community-manager` | S1, S6 | Pass 1 (KIIS terminology, EURC) | None identified | Real product only |
| `stellar-eu-crowdfunding-compliance-devrel` | S1, S9 | Pass 1 (SEP numbering); pass 2 (clawback framing, item 16) | None identified | Real product only |
| `stellar-eu-crowdfunding-compliance-risk` | S2 (Art. 13), S4, S9 | Pass 1 (clawback, withdrawal periods, TFR scope); pass 2 (clawback constraint, item 16) | None identified | Real product only |
| `stellar-eu-crowdfunding-compliance-support` | S1, S9 | Pass 1 (SEP-41, knowledge-test terminology, Rabet) | None identified | Real product only |
| `stellar-eu-crowdfunding-growth-analytics` | S1, S6 | Pass 1 (EURC) | None identified | Real product only |
| `stellar-eu-crowdfunding-gtm-strategy` | S1, S9 | Pass 1 (SEP-20 custody mis-cite, BaFin/clawback claim) | None identified | Real product only |
| `stellar-eu-crowdfunding-regulatory-compliance` | S1, S9 | None | None identified | Real product only |
| `stellar-eu-crowdfunding-smart-contract-auditor` | S9 (plus consistency with the Soroban security set) | None | None identified | Usable now: the audit method (reentrancy, overflow, access control, cap/refund invariants) applies to the demo contract |
| `stellar-eu-tokenization-api-design` | S2, S9, S11 | None | None identified | Usable now: endpoint and XDR-envelope patterns fit the demo backend; the MiCA/KYC metadata layer is for the real product |
| `stellar-eu-tokenization-architecture` | S1, S9 | Pass 1 (EUR 5M scope); pass 2 (clawback 'as required by EU law', item 16) | None identified | Real product only |
| `stellar-eu-tokenization-custodian` | S2 (Art. 75, fresh check 2026-10-30), S9 | Pass 1 (SEP-30, CAP-0035, clawback) | None identified | Real product only |
| `stellar-eu-tokenization-transfer-agent` | S1, S9 | None | None identified | Real product only |
| `stellar-eu-tokenization-treasury-management` | S1, S9 | Pass 1 (SEP numbering, Art. 12 mis-cite) | The 1:1 reserve framing is backing practice for fiat-backed tokens, not a platform legal mandate (noted in text) | Real product only |
| `stellar-eu-tokenization-treasurymanagement` | S1, S9 | Pass 2 (near-duplicate notice, item 19) | Folding its two unique points into the canonical guide is proposed to the owner separately | Real product only |
| `stellar-eu-tokenized-crowdfunding-compliance` | S1, S9 | Pass 1 (clawback); pass 2 (KYC/AML clawback conflation, item 16) | None identified | Real product only |

Count reconciliation: the first pass corrected 28 guides; the second pass
changed 11 more guides (items 16-19), of which 4
(`eu-crowdfunding-tokenization-compliance`,
`eu-crypto-asset-crowdfunding-cybersecurity-compliance`,
`select-eu-compliant-stellar-funding-portals`,
`stellar-eu-tokenization-treasurymanagement`) had no first-pass correction.
So 32 of the 46 guides carry at least one correction across both passes, and
14 needed no change in either pass. 7 of the 11 second-pass changes are
further corrections to guides already corrected in the first pass.

Remaining limits, unchanged from the first pass: member-state administrative
practice (BaFin/AMF processes) and national tax, insurance and custody detail
beyond the concrete claims listed above were not re-verified; those sections
point to local professionals and should be read that way. This review found
and fixed documentation errors; it is not legal advice or certification.

## Usefulness classification of the full collection (2026-10-30)

Every catalog entry was classified against the current project: the live
testnet demo (Soroban escrow contract, Freighter wallet, backend;
non-transferable contribution balances, all-or-nothing funding, atomic cap)
and the intended real product (an EU-compliant tokenized crowdfunding
platform). **Useful** = useful now, for the demo and its ongoing development.
**Useful but not for now** = useful later, for the real product. **Not a fit
for this project** = no relevant use in either. Classification is independent
of inclusion; rights status is unchanged.

### Stellar development

Useful now (included): `soroban-contracts`, `stellar-cli`, `stellar-rpc`,
`stellar-sdks`, `soroban-testing` - the contract, tooling and test stack the
demo is built on. `accounts`, `assets`, `operations`, `fees` - account,
asset, transaction and fee mechanics every demo flow touches.
`frontend-integration` - wallet connection and signing in the demo UI.
`mcp-servers` - AI-assisted development tooling for Stellar.
`soroban-security`, `smart-contract-security`, `soroban-common-mistakes` -
access control, cap and refund checks on the live testnet contract are
current work, not a future concern. `horizon-legacy` - bounded auxiliary
use: the guide itself says prefer RPC for new work, but it helps with the
existing classic trustline/funding queries the testnet flow still uses.

Useful now (not included): `smart-contracts`, `soroban`, `storage`, `tools`,
`standards`, `data` - same development areas as the included set (contract
work, storage/TTL, local tooling, standards reference, chain-data queries).
`assets`, `stellar-assets`, `stellar-cli`, `stellarskills-accounts`,
`stellarskills-assets`, `stellarskills-fees`, `stellarskills-operations`,
`stellarskills-rpc` - content overlaps the included nrxschool versions.
`openzeppelin` - audited contract building blocks for the demo contract.
`security` (overlaps the included security set) and `develop-secure-contracts`
(AGPL-3.0-only; inclusion decision unchanged) - secure contract work is
current work. `horizon` - same bounded auxiliary use as `horizon-legacy`.

Useful later (included): `dex-amm` (trading and liquidity; the demo token is
non-transferable), `seps-anchors` (fiat rails for the real product).

Useful later (not included): `anchors`, `seps` (anchor and KYC standards for
real money flows), `dex`, `soroswap-sdk` (secondary market and swaps, subject
to the secondary-market rules), `oracles` (price/valuation feeds),
`data-indexers`, `openzeppelin-relayer` (production data and transaction
infrastructure), `scaffold-stellar`, `setup-stellar-contracts`,
`stellar-builder-quickstart` (the production rebuild),
`upgrade-stellar-contracts` (contract upgrade path), `stellar-help` (belongs
with the BMAD workflow set), plus the previously classified `passkeys` and
`smart-accounts`.

Not a fit (included): `nearx-contributing-guide` (about contributing to a
different repository).

Not a fit (not included): `bridge`, `cross-chain`, `cross-chain2`,
`send-payment`, `send-raw`, `check-balance` (EVM bridging and agent-executed
payments), `privacy`, `zk-proofs` (confidential-transfer tooling pulls
against a KYC-transparent regulated product).

### EU compliance and legal (46)

Each guide was read in full and re-checked on 2026-10-30 (record above).
Five are useful now, because their core content applies to the current demo
work even though their compliance layer targets the real product:
`eu-compliant-stellar-crowdfunding-engineering` (escrow, refund and
atomic-settlement mechanics for the Soroban contract),
`stellar-eu-crowdfunding-smart-contract-auditor` (the audit method applies to
the demo contract), `stellar-eu-tokenization-api-design` (endpoint and
XDR-envelope patterns for the demo backend), `fintech-ux-design-for-eu-crowdfunding`
and `eu-web-accessibility-compliance-wcag-eaa` (both apply to the current
demo UI). The other 41 are useful but not for now: licensing, investor
protection, custody, tax, sanctions, treasury and go-to-market groundwork
that only binds once the platform handles real investors and real money.

### Stellar Community Fund (13)

Unchanged: all 13 useful but not for now (direct fit for an SCF application).

### Product and workflow (BMAD-style)

Useful now: `code-review` (review of ongoing demo changes).
Useful but not for now: the other 16 - product discovery, PRD, architecture,
UX, story execution and documentation for the real product build.

### Third-party project skills

Useful now: `sozu-faucet` (unchanged).
Useful but not for now: `pollar-wallet-auth`, `blux` (wallet onboarding for
non-crypto-native users), `caatinga` (deployment orchestration for the
production build), `cosmospay`, `stellartools-payments` (payment/checkout
integration options; regulated investment flows still need licensed rails),
`trustless-work-dev` (escrow building blocks; the demo's model is
all-or-nothing escrow), `lumenloop-mcp-connect` (powers the ecosystem
scouting set), `stellar-anchor-skill` (fiat on/off-ramp implementation layer;
the inclusion decision is unchanged).
Not a fit: `agentic-payments`, `mpp`, `x402`, `x402-stellar-checks`,
`x402-stellar-context`, `nirium-agentic-payments`, `pay-link`, `pay-per-call`,
`wasit` (agent-to-agent payment protocols), `xoxno-lending`,
`xoxno-lending-contracts`, `xoxno-lending-data`, `xoxno-lending-liquidations`,
`xoxno-lending-sdk`, `xoxno-lending-troubleshooting`, `xoxno-swap-aggregator`,
`defindex-sdk-skill`, `sodax` (DeFi lending and cross-chain DeFi),
`cogladius`, `contextio`, `eunomia`, `pmll`, `stellar-agent-search-mcp`
(unrelated agent tooling).

### Ecosystem intelligence

Unchanged: `stellar-scout` and the 11 not-included scouting skills are useful
but not for now. `stellar-prices-api` joins them: price display and valuation
cross-checks belong to the real product, not the testnet demo.

### Research and writing

Useful now: `deep-research` (supports the project's ongoing regulatory and
ecosystem research). Useful but not for now: `fetch-external-doc` (belongs to
the SCF workflow). Not a fit: the 12 `crypto-*` skills (academic
cryptography research and paper writing).

### Agent workflow infrastructure

Useful now: `investigate` (debugging during active demo development).
Useful but not for now: `agent-browser-webauthn` (previously classified),
`audit-reviewability`, `review-edge-case-hunter` (codebase hardening before
production), `ingest-sdk` (production ledger data pipeline), `why` (Stellar
positioning for SCF and go-to-market).
Not a fit: `bench-skills`, `cloudflare-observability-review`,
`golden-truth`, `improvements-pipeline`, `learning-loop`,
`live-drift-resolution`, `navigate-skills`, `optimize-skills`,
`retrieval-system-audit`, `run-evals`, `truth-maintenance` (these maintain
the stellar-build / stellar-raven-codemode skill-collection tooling itself),
`discover`, `onboard` (MPP/agent-wallet payment tooling), `reprompt`,
`routing-agent-work`, `skill router stellar new` (orchestration meta-tooling),
`stellarskills-zk-proofs`, `sub-rosa` (ZK/sealed-bid tooling).

## 2026-10-30 GitHub discovery and consolidation

### What was searched

35+ GitHub code-search query families across all public repositories, covering
soroban, stellar, freighter/wallet-kit, SEP anchors, escrow/trustless-work,
Stellar DeFi, accessibility/WCAG, incident response/postmortem,
postgres/backup/migration, e2e testing, OWASP security testing, disaster
recovery, KYC/identity, observability, GDPR/privacy, financial modeling and
marketing/SEO; plus org-scoped sweeps (stellar, stripe, neondatabase,
supabase, microsoft, callstackincubator, LambdaTest) and a dedicated
Stellar-ecosystem sweep (stellar-core, CheesecakeLabs, SentinelFi, Soneso,
StellarCN, stellar-scaffold, Micopay, Trustless-Work, and others).

Limits: public GitHub only, sampled not exhaustive - this cannot certify every
repository. Every skill recommended below was individually opened: its full
skill file read and its license verified at the linked upstream file. Items
not fully verified are listed under "not included" in INDEX.md with their
reasons.

### Included now (15 new skills, each content-read and license-verified)

| Skill | Why it helps the demo now | Source |
|---|---|---|
| `webapp-testing` | Playwright testing of the demo frontend (incl. Freighter flows) | anthropics/skills, Apache-2.0 |
| `playwright-skill` | Production-grade E2E test generation | LambdaTest/agent-skills, MIT |
| `vitest-skill` | Vitest unit tests for the JS stack | LambdaTest/agent-skills, MIT |
| `jest-skill` | Jest unit tests for the JS stack | LambdaTest/agent-skills, MIT |
| `cicd-pipeline-skill` | GitHub Actions test pipelines | LambdaTest/agent-skills, MIT |
| `api-health-monitoring` | Health endpoints, SLA/SLO, alerting for the backend | LambdaTest/agent-skills, MIT |
| `neon` | Official Neon skill - the demo runs on Neon Postgres | neondatabase/agent-skills, Apache-2.0 |
| `logging-best-practices` | Wide-event logging; supports the incident-recovery gap | neondatabase/mcp-server-neon, MIT |
| `atlas` | Official schema migrations for the journal database | ariga/atlas, Apache-2.0 |
| `postgres-readonly` | Safe read-only DB inspection (writes blocked) | sanjay3290/ai-skills, Apache-2.0 |
| `wcag` | Practical WCAG 2.2/EAA audit; complements the owner-authored accessibility guide | CalebHendren/wcag, MIT |
| `web-security-testing` | OWASP Top 10 testing workflow | davila7/claude-code-templates, MIT |
| `test-driven-development` | TDD workflow | obra/superpowers, MIT |
| `systematic-debugging` | Structured debugging method | obra/superpowers, MIT |
| `oz-stellar` | OpenZeppelin Stellar contracts v0.6.0 reference; fills the rights-blocked `openzeppelin` need | SentinelFi/sentinel_soroban_v3, Apache-2.0 |

### Included for later (14 new skills, each content-read and license-verified)

| Skill | Why later | Source |
|---|---|---|
| `stripe-pay`, `connect-recommend`, `upgrade-stripe`, `stripe-docs` | Fiat payment rails, Connect marketplace patterns, upgrades, docs lookup | stripe/ai, MIT |
| `incident-response` | Live-incident method (Kubernetes-flavored; adapt to the project's hosting); supports DORA duties | giantswarm/agent-skills, Apache-2.0 |
| `incident-postmortem` | Blameless postmortems and runbooks | camilooscargbaptista/cto-toolkit, MIT |
| `writing-user-docs` | House style for user-facing documentation | callstackincubator/agent-skills, MIT |
| `stellar-core-code-review` | Stellar protocol review skill (`high-level-code-review` upstream); this single skill reviewed, the repo's subsystem-reference family was not | stellar/stellar-core, Apache-2.0 |
| `theme-factory`, `frontend-design`, `web-artifacts-builder`, `canvas-design`, `internal-comms`, `mcp-builder` | Marketing/pitch artifacts, UI design, prototyping, comms; `mcp-builder` only if the project builds MCP integrations | anthropics/skills, Apache-2.0 |

### Promotions (2 supplied entries, previously "rights unclear")

| Catalog entry | Upstream verified | License |
|---|---|---|
| `stellar-anchor-skill` | CheesecakeLabs/stellar-anchor-skill | Apache-2.0 |
| `scaffold-stellar` | stellar-scaffold/cli | Apache-2.0 |

### Consolidation of the owner-authored guides (approved 2026-10-30)

The 46 owner-authored guides were checked for genuine content overlap. Two
merges were made; nothing unique was dropped:

- `stellar-eu-tokenization-treasurymanagement` was a near-duplicate of
  `stellar-eu-tokenization-treasury-management`. Its two unique operational
  points - SEPA-to-mint coordination (memo-mapped minting, with the
  new-investment example) and the XLM operations reserve constraint - were
  folded into the canonical guide, which stays at
  `skills/stellar-eu-tokenization-treasury-management/`.
- `stellar-eu-compliance-monitor` was byte-identical to
  `stellar-eu-crowdfunding-community-manager`; the duplicate was removed and
  the canonical guide kept. A rewritten monitor guide covering ongoing
  compliance monitoring was prepared in review and remains a parked proposal
  - not approved, not published.

Reviewed and kept separate as distinct-scope documents (title overlap only):
`dora-ict-operational-resilience-compliance` vs
`dora-ict-operational-resilience-specialist`, and the
`eu-crowdfunding-tokenization-compliance` family (base, advisor, writer).

The guide count is therefore 44, and the corrections published on 2026-10-30
(commit `66e1226`) are preserved unchanged - this update only merges the two
duplicate pairs and records the map in INDEX.md.

### Reviewed and not included (watchlist)

- `kyc-aml-patterns` (HermeticOrmus/LibreFinTech-Claude-Code, MIT verified) -
  makes regulatory claims; needs the same content review protocol as the 46
  EU guides before inclusion.
- `regdata-kyc-aml` (ThomasMoreAI/legal-skills-open) - license conflict:
  repository says Apache-2.0, skill header says MIT, upstream author is
  Nolpak14/getregdata.
- `neon-postgres`, `neon-auth` (neondatabase/website) - content read, but no
  LICENSE file exists in that repository.
- `doc-coauthoring` (anthropics/skills) - its folder has no LICENSE file.
- hashicorp terraform skills - not reviewed; likely MPL-2.0.
- obra `root-cause-tracing` - does not exist under that name; the real skill
  is `systematic-debugging` (included).
- obra `brainstorming` - MIT verified, but duplicates the catalogued BMAD
  `brainstorming`; not counted.
- anthropics `brand-guidelines` - Apache-2.0 verified, but applies
  Anthropic's own brand; low direct value.
- anthropics `docx`, `pdf`, `pptx`, `xlsx` - source-available, NOT open
  source per the repository README; reference only.
- sickn33/agentic-awesome-skills soroban set - read in full; template-grade
  filler despite MIT license.
- jthack/ffuf_claude_skill - no LICENSE file.
- Ormus-Solutions/LibreFinTech-Claude-Code - fork without LICENSE; the
  canonical HermeticOrmus repository was used for `kyc-aml-patterns`.
- NeoLabHQ/context-engineering-kit - GPL copyleft (same deliberate-decision
  category as the catalog's AGPL entry).
- ScaleDockHQ/scaledock-skills - mirror collection; the CalebHendren/davila7
  entries cover the same ground with clearer provenance.
- barolivera/avalon stellar-anchors-ramps - Spanish-language project doc.
- Soneso/StellarCN SDK skills (Kotlin/PHP/Python) - stack mismatch for the
  current demo.
- supabase and microsoft/vscode skills - internal tooling for those products.
- Marketing/GTM mega-collections from curated lists - names surveyed; quality
  and licenses unverified.
