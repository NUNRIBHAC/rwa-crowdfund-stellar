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
- The ecosystem scouting set - `stellar-scout` is published here (MIT,
  Stellar Light; verified byte-identical to the upstream repository); the
  rest declare nothing and stay out.
- `develop-secure-contracts` declares AGPL-3.0-only (author: OpenZeppelin),
  verified against the upstream repository. A real license, but strong
  copyleft; publishing a copy needs a deliberate decision and a separate
  license boundary.

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
  (https://eur-lex.europa.eu/eli/reg/2022/2554/oj/eng); direct inline
  retrieval of the Article 2 text was bounded (EUR-Lex fetch truncates
  before Article 2; EUR-Lex browser access blocked in this environment;
  EBA/ESMA interactive rulebooks carry no inline article text), so the
  item was confirmed against a verbatim mirror of the Official Journal
  text plus EUR-Lex recital-level context.
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
