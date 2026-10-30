# Skills index

Full catalog: the 222 skill entries the project owner supplied on 2026-10-29, plus the skills discovered across GitHub on 2026-10-30 (29 newly included, 2 supplied entries promoted to included, and the candidates reviewed and not included, each with its reason).

Each skill appears under its subject category in one of three decision tables:

- **Include now** - copied into `skills/`, useful for the current testnet demo.
- **Include for later** - copied into `skills/` with verified rights, useful for the real product rather than the current demo.
- **Not include** - kept out of this repository. The reason column gives the rights status (no license file, unverified origin, license conflict, or copyleft needing a deliberate decision) and the usefulness assessment where one was made.

The 44 owner-authored EU compliance guides are published with the project owner's authorization (no license granted yet). Every included third-party skill's license was verified at the linked upstream file - attribution in NOTICE.md, per-entry assessment in ASSESSMENT.md. Usefulness is independent of inclusion: a useful skill stays out while its rights are unclear.

## Stellar development (63 supplied + 2 discovered)

Include now (16):

| Skill | Rights | Why |
|---|---|---|
| `skills/accounts` | CC-BY-4.0 docs / MIT code (nrxschool) | Stellar account model - keypairs, funding, signers, sponsorship, minimum balances. |
| `skills/assets` | CC-BY-4.0 docs / MIT code (nrxschool) | Asset issuance, trustlines, custom tokens, Stellar Asset Contract (SAC). |
| `skills/fees` | CC-BY-4.0 docs / MIT code (nrxschool) | Stellar fee model - base fees, resource fees, surge pricing, fee strategies. |
| `skills/frontend-integration` | CC-BY-4.0 docs / MIT code (nrxschool) | Wallet connections, transaction signing, React patterns, browser SDK usage. |
| `skills/horizon-legacy` | CC-BY-4.0 docs / MIT code (nrxschool) | Horizon REST API for classic operations. Bounded auxiliary fit: helps the classic trustline/funding queries the testnet flow still uses; prefer `stellar-rpc` for new work. |
| `skills/mcp-servers` | CC-BY-4.0 docs / MIT code (nrxschool) | MCP servers for Stellar - Model Context Protocol integrations, XDR decoder, AI-assisted development. |
| `skills/operations` | CC-BY-4.0 docs / MIT code (nrxschool) | All Stellar transaction operations - Payment, CreateAccount, ManageOffers, PathPayment. |
| `skills/soroban-common-mistakes` | MIT (Aayush Gupta) | Review Soroban (Rust) contracts for common security mistakes, logic errors and code quality. |
| `skills/soroban-contracts` | CC-BY-4.0 docs / MIT code (nrxschool) | Soroban contract development - Rust/WASM, storage, auth, cross-contract calls, deployment. |
| `skills/soroban-security` | CC-BY-4.0 docs / MIT code (nrxschool) | Soroban security patterns - access control, reentrancy, integer safety, auth best practices. |
| `skills/soroban-testing` | CC-BY-4.0 docs / MIT code (nrxschool) | Testing Soroban contracts - unit tests, integration tests, testnet deployment, Stellar CLI testing. |
| `skills/smart-contract-security` | CC-BY-4.0 docs / MIT code (nrxschool) | Smart contract security on Stellar - OpenZeppelin contracts, audit patterns, common vulnerabilities. (Published since 2026-10-29; the row was omitted from the previous index by mistake.) |
| `skills/stellar-cli` | CC-BY-4.0 docs / MIT code (nrxschool) | Stellar CLI - contract management, key management, network configuration, development workflows. |
| `skills/stellar-rpc` | CC-BY-4.0 docs / MIT code (nrxschool) | Stellar RPC JSON-RPC API - simulateTransaction, sendTransaction, getEvents, getLedgerEntries. |
| `skills/stellar-sdks` | CC-BY-4.0 docs / MIT code (nrxschool) | Stellar SDKs - JavaScript, Python, Go, Rust client libraries. |
| `skills/oz-stellar` | Apache-2.0 (SentinelFi) | OpenZeppelin Stellar Contracts v0.6.0 reference - access control, pausable, upgradeable, RWA tokens. Fills the catalog's rights-blocked `openzeppelin` need. Added 2026-10-30. |

Include for later (4):

| Skill | Rights | Why |
|---|---|---|
| `skills/dex-amm` | CC-BY-4.0 docs / MIT code (nrxschool) | Built-in DEX and AMM - order books, manage offers, path payments, liquidity pools. |
| `skills/seps-anchors` | CC-BY-4.0 docs / MIT code (nrxschool) | SEP standards and anchor ecosystem - SEP-6, SEP-10, SEP-24, SEP-31, stellar.toml, fiat on/off-ramps. |
| `skills/scaffold-stellar` | Apache-2.0 (stellar-scaffold) | Build full-stack Stellar dApps with the `stellar scaffold` CLI plugin. Promoted 2026-10-30 (was listed below as rights unclear; upstream license verified). |
| `skills/stellar-core-code-review` | Apache-2.0 (Stellar Development Foundation) | Stellar protocol review skill (`high-level-code-review` upstream). This single skill was reviewed; the repo's subsystem-reference family was not individually reviewed. Added 2026-10-30. |

Also included with the nrxschool set: `skills/nearx-contributing-guide` (CC-BY-4.0 docs / MIT code) - the contribution guide for the upstream collection; published but not a fit for this project's use.

Not include:

| Skill | Rights | Reason |
|---|---|---|
| `dapp`, `frontend`, `testing`, `freighter-best-practices`, `state-archival` | No license stated / origin unverified | Useful now (Freighter integration, testnet E2E, TTL/state restoration), but rights unclear. |
| `assets`, `data`, `openzeppelin`, `smart-contracts`, `soroban`, `standards`, `stellar-assets`, `stellar-cli`, `stellarskills-accounts`, `stellarskills-assets`, `stellarskills-fees`, `stellarskills-operations`, `stellarskills-rpc`, `storage`, `tools`, `security` | Declared-only or unverified license (stellarskills family and circulating copies) | Useful now, but rights unclear. |
| `develop-secure-contracts` | AGPL-3.0-only (verified upstream, OpenZeppelin) | Useful now, but strong copyleft: publishing a copy needs a deliberate decision and a separate license boundary. |
| `horizon` | Rights unclear | Bounded auxiliary fit, as `horizon-legacy`. |
| `passkeys`, `smart-accounts`, `anchors`, `data-indexers`, `dex`, `openzeppelin-relayer`, `oracles`, `seps`, `setup-stellar-contracts`, `soroswap-sdk`, `stellar-builder-quickstart`, `stellar-help`, `upgrade-stellar-contracts` | Rights unclear | Useful later. |
| `bridge`, `check-balance`, `cross-chain`, `cross-chain2`, `privacy`, `send-payment`, `send-raw`, `zk-proofs` | Rights unclear | Not a fit for this project. |
| sickn33/agentic-awesome-skills soroban set (discovered 2026-10-30) | MIT | Read in full; template-grade filler. Not recommended. |
| Soneso / StellarCN SDK skills (discovered 2026-10-30) | Unverified | Kotlin/PHP/Python SDK guidance - stack mismatch for the current demo. |
| `stellar-dev` circulating copies (discovered 2026-10-30) | Canonical upstream unverified | Rights unclear. |

## EU compliance and legal (46 supplied, consolidated to 44 on 2026-10-30)

Owner-authored guides; the project owner confirmed his authorship on 2026-10-29. Published as written, no license granted yet (all rights reserved by the owner). Every guide was read in full and re-checked on 2026-10-30; the legal review record is in ASSESSMENT.md.

Include now (5; usable in the current demo work - contract engineering and audit, API design, crowdfunding UX, accessibility):

`eu-compliant-stellar-crowdfunding-engineering`, `eu-web-accessibility-compliance-wcag-eaa`, `fintech-ux-design-for-eu-crowdfunding`, `stellar-eu-crowdfunding-smart-contract-auditor`, `stellar-eu-tokenization-api-design`

Include for later (39; the compliance, licensing and operations groundwork for the real product):

`crowdfunding-partnership-outreach`, `crowdfunding-secondary-market-advisor-eu-stellar`, `compliant-eu-tokenization-cloud-infrastructure`, `dora-ict-operational-resilience-compliance`, `dora-ict-operational-resilience-specialist`, `ecspr-crowdfunding-compliance-specialist`, `eu-crowdfunding-governance-risk-advisor`, `eu-crowdfunding-investor-suitability-assessment`, `eu-crowdfunding-sanctions-compliance`, `eu-crowdfunding-tokenization-compliance`, `eu-crowdfunding-tokenization-compliance-advisor`, `eu-crowdfunding-tokenization-compliance-writer`, `eu-crowdfunding-tokenization-insurance-advisor`, `eu-crowdfunding-tokenization-tax-compliance`, `eu-crypto-aml-ctf-compliance-officer`, `eu-crypto-asset-crowdfunding-cybersecurity-compliance`, `eu-crypto-asset-investor-education`, `eu-crypto-crowdfunding-compliance-integration`, `eu-crypto-crowdfunding-incident-response`, `eu-data-privacy-for-tokenized-crowdfunding`, `eu-mica-casp-licensing-counsel`, `eu-prospectus-and-tokenization-compliance-counsel`, `eu-securities-legal-counsel-crowdfunding-tokenization`, `eu-tokenization-expansion-specialist`, `eu-web3-governance-advisor`, `select-eu-compliant-stellar-funding-portals`, `stella-eu-payment-rails-integration`, `stellar-eu-crowdfunding-community-manager`, `stellar-eu-crowdfunding-compliance-devrel`, `stellar-eu-crowdfunding-compliance-risk`, `stellar-eu-crowdfunding-compliance-support`, `stellar-eu-crowdfunding-growth-analytics`, `stellar-eu-crowdfunding-gtm-strategy`, `stellar-eu-crowdfunding-regulatory-compliance`, `stellar-eu-tokenization-architecture`, `stellar-eu-tokenization-custodian`, `stellar-eu-tokenization-transfer-agent`, `stellar-eu-tokenization-treasury-management`, `stellar-eu-tokenized-crowdfunding-compliance`

Merge record (owner approved the consolidation of genuinely overlapping guides on 2026-10-30):

| Original guide | Merged into | What was preserved |
|---|---|---|
| `stellar-eu-tokenization-treasurymanagement` | `stellar-eu-tokenization-treasury-management` | Its two unique operational points were folded into the canonical guide: SEPA-to-mint coordination (memo-mapped minting with an investment example) and the XLM operations reserve constraint. |
| `stellar-eu-compliance-monitor` | `stellar-eu-crowdfunding-community-manager` | The removed guide was byte-identical to the canonical one, so no content was lost. A rewritten monitor guide covering ongoing compliance monitoring was prepared in review and remains a parked proposal - not approved, not published. |

Reviewed and kept separate (overlapping titles, distinct scope - not duplicates): `dora-ict-operational-resilience-compliance` vs `dora-ict-operational-resilience-specialist`, and the `eu-crowdfunding-tokenization-compliance` family (base, advisor, writer).

## Stellar Community Fund (13 supplied)

Not include:

| Skill | Rights | Reason |
|---|---|---|
| `scf-budget-builder`, `scf-claim-verifier`, `scf-competitor-analyst`, `scf-interest-form-drafter`, `scf-live-context`, `scf-prescreen-checker`, `scf-referral-preparer`, `scf-reviewer`, `scf-round-reviewer`, `scf-round-watcher`, `scf-submission-drafter`, `scf-submission-radar`, `scf-tranche-reporter` | Rights unclear | Useful later - direct fit for a Stellar Community Fund application. |

## Product and workflow (BMAD-style) (17 supplied)

Not include:

| Skill | Rights | Reason |
|---|---|---|
| `code-review` | Rights unclear | Useful now. |
| `advanced-elicitation`, `brainstorming`, `bri-tech-writer`, `create-architecture`, `create-epics-and-stories`, `create-ux-design`, `dev-story`, `elliot-dev`, `justin-analyst`, `kaan-ux-designer`, `nicole-pm`, `party-mode`, `prd`, `prfaq`, `product-brief`, `tyler-architect` | Rights unclear | Useful later. |
| obra `brainstorming` (discovered 2026-10-30) | MIT (verified) | Duplicates the catalogued BMAD `brainstorming` entry - not counted, to avoid inflating the list. |

## Third-party project skills (32 supplied)

Include for later (1):

| Skill | Rights | Why |
|---|---|---|
| `skills/stellar-anchor-skill` | Apache-2.0 (Cheesecake Labs) | Fiat on/off-ramp implementation layer for Stellar anchors. Promoted 2026-10-30 (was listed below as rights unclear; upstream license verified). |

Not include:

| Skill | Rights | Reason |
|---|---|---|
| `sozu-faucet` | Declares MIT in its own file (author: blessedux), upstream repository no longer reachable to verify | Useful now - one-command testnet USDC. |
| `blux`, `caatinga`, `cosmospay`, `lumenloop-mcp-connect`, `pollar-wallet-auth`, `stellartools-payments`, `trustless-work-dev` | Rights unclear | Useful later. |
| `agentic-payments`, `cogladius`, `contextio`, `defindex-sdk-skill`, `eunomia`, `mpp`, `nirium-agentic-payments`, `pay-link`, `pay-per-call`, `pmll`, `sodax`, `stellar-agent-search-mcp`, `wasit`, `x402`, `x402-stellar-checks`, `x402-stellar-context`, `xoxno-lending`, `xoxno-lending-contracts`, `xoxno-lending-data`, `xoxno-lending-liquidations`, `xoxno-lending-sdk`, `xoxno-lending-troubleshooting`, `xoxno-swap-aggregator` | Rights unclear | Not a fit for this project (agent-to-agent payment protocols, DeFi lending, cross-chain DeFi, unrelated agent tooling). |
| barolivera/avalon stellar-anchors-ramps (discovered 2026-10-30) | Unverified | Spanish-language project doc - reference only. |

## Ecosystem intelligence (13 supplied)

Include for later (2):

| Skill | Rights | Why |
|---|---|---|
| `skills/stellar-scout` | MIT (Stellar Light), verified byte-identical to upstream | Scouts the Stellar ecosystem before you build: existing projects, open SCF-funded RFPs, SCF pitch drafting, audit firms, primary-source citations. |
| `skills/stellar-prices-api` | MIT (Rumble Fish Poland) | USD/XLM price of any Stellar asset - current prices, 24h change. Price display belongs to the real product, not the testnet demo. |

Not include:

| Skill | Rights | Reason |
|---|---|---|
| `find-stellar-idea`, `stellar-competitive-landscape`, `stellar-content-auditor`, `stellar-developer-activity`, `stellar-disbursement-platform`, `stellar-ecosystem-digest`, `stellar-ecosystem-scout`, `stellar-integration-finder`, `stellar-knowledge`, `stellar-project-dossier`, `stellar-registry` | Rights unclear | Useful later. |

## Research and writing (14 supplied)

Not include:

| Skill | Rights | Reason |
|---|---|---|
| `deep-research` | Rights unclear | Useful now - supports the project's ongoing regulatory and ecosystem research. |
| `fetch-external-doc` | Rights unclear | Useful later - belongs to the SCF workflow. |
| `crypto-ai-acknowledgements`, `crypto-benchmarking`, `crypto-correlation-accounting`, `crypto-implementation-evaluation-writing`, `crypto-literature-evidence`, `crypto-manuscript-qa`, `crypto-prior-work-comparison`, `crypto-proof-auditor`, `crypto-protocol-implementation`, `crypto-research-artifacts`, `crypto-research-framing`, `cryptography-writing` | Rights unclear | Not a fit - academic cryptography research and paper writing. |

## Agent workflow infrastructure (24 supplied)

Not include:

| Skill | Rights | Reason |
|---|---|---|
| `investigate` | Rights unclear | Useful now - debugging during active demo development. |
| `agent-browser-webauthn` | Rights unclear | Useful later on paper, but not applicable to extension wallets such as Freighter. |
| `audit-reviewability`, `ingest-sdk`, `review-edge-case-hunter`, `why` | Rights unclear | Useful later - codebase hardening and production data pipeline. |
| `bench-skills`, `cloudflare-observability-review`, `discover`, `golden-truth`, `improvements-pipeline`, `learning-loop`, `live-drift-resolution`, `navigate-skills`, `onboard`, `optimize-skills`, `reprompt`, `retrieval-system-audit`, `routing-agent-work`, `run-evals`, `skill router stellar new`, `stellarskills-zk-proofs`, `sub-rosa`, `truth-maintenance` | Rights unclear | Not a fit - these maintain the skill-collection tooling itself, plus ZK/sealed-bid and orchestration meta-tooling. |
| supabase and microsoft/vscode skills (discovered 2026-10-30) | Unverified | Internal tooling for those products - not relevant here. |

## Testing and quality (discovered 2026-10-30)

Include now (8):

| Skill | Rights | Why |
|---|---|---|
| `skills/webapp-testing` | Apache-2.0 (Anthropic) | Playwright testing of the demo frontend, including Freighter flows. |
| `skills/playwright-skill` | MIT (LambdaTest) | Production-grade E2E test generation. |
| `skills/vitest-skill` | MIT (LambdaTest) | Vitest unit tests for the JS stack. |
| `skills/jest-skill` | MIT (LambdaTest) | Jest unit tests for the JS stack. |
| `skills/cicd-pipeline-skill` | MIT (LambdaTest) | GitHub Actions test pipelines. |
| `skills/api-health-monitoring` | MIT (LambdaTest) | Health endpoints, SLA/SLO and alerting for the backend. |
| `skills/test-driven-development` | MIT (Jesse Vincent) | TDD workflow. |
| `skills/systematic-debugging` | MIT (Jesse Vincent) | Structured debugging method. |

Not include:

| Skill | Rights | Reason |
|---|---|---|
| obra `root-cause-tracing` | - | Does not exist under that name; the real skill is `systematic-debugging` (included above). |

## Database and operations (discovered 2026-10-30)

Include now (4):

| Skill | Rights | Why |
|---|---|---|
| `skills/neon` | Apache-2.0 (Neon) | Official Neon skill - the demo runs on Neon Postgres (branching, migrations, auth). |
| `skills/logging-best-practices` | MIT (Neon) | Wide-event logging; supports the incident-recovery gap. |
| `skills/atlas` | Apache-2.0 (Ariga) | Official schema migrations for the journal database. |
| `skills/postgres-readonly` | Apache-2.0 (sanjay3290) | Safe read-only database inspection (writes blocked). Upstream folder named `postgres`. |

Include for later (2):

| Skill | Rights | Why |
|---|---|---|
| `skills/incident-response` | Apache-2.0 (Giant Swarm) | Live-incident method (Kubernetes-flavored; adapt to the project's hosting). Supports DORA duties. |
| `skills/incident-postmortem` | MIT (Girardelli Tecnologia) | Blameless postmortems and incident runbooks. |

Not include:

| Skill | Rights | Reason |
|---|---|---|
| `neon-postgres`, `neon-auth` (neondatabase/website) | No LICENSE file in that repository | Content read; rights unresolved. |
| hashicorp terraform skills | Not reviewed; likely MPL-2.0 | Verify if infrastructure skills are wanted later. |

## Security and accessibility (discovered 2026-10-30)

Include now (2):

| Skill | Rights | Why |
|---|---|---|
| `skills/web-security-testing` | MIT (Daniel (San) Ávila) | OWASP Top 10 testing workflow for backend and frontend. |
| `skills/wcag` | MIT (Caleb Hendren) | Practical WCAG 2.2/EAA audit and remediation; complements the owner-authored accessibility guide. |

Not include:

| Skill | Rights | Reason |
|---|---|---|
| `kyc-aml-patterns` (HermeticOrmus/LibreFinTech-Claude-Code) | MIT (verified) | Makes regulatory claims - needs the same content review protocol as the owner-authored EU guides before inclusion. |
| `regdata-kyc-aml` (ThomasMoreAI/legal-skills-open) | License conflict: repository says Apache-2.0, skill header says MIT, upstream author is Nolpak14/getregdata | Resolve the conflict before any inclusion. |
| jthack/ffuf_claude_skill | No LICENSE file in repository | Rights unresolved. |
| NeoLabHQ/context-engineering-kit | GPL copyleft (verified) | Same deliberate-decision category as the catalog's AGPL entry. |
| ScaleDockHQ/scaledock-skills | Mirror collection | The CalebHendren/davila7 entries cover the same ground with clearer provenance. |
| Ormus-Solutions/LibreFinTech-Claude-Code | Fork without LICENSE | The canonical HermeticOrmus repository is the one assessed above. |

## Payments and fiat rails (discovered 2026-10-30)

Include for later (4):

| Skill | Rights | Why |
|---|---|---|
| `skills/stripe-pay` | MIT (Stripe) | Fiat payment rails for the product. |
| `skills/connect-recommend` | MIT (Stripe) | Stripe Connect marketplace/payout patterns. |
| `skills/upgrade-stripe` | MIT (Stripe) | Stripe API/SDK upgrades. |
| `skills/stripe-docs` | MIT (Stripe) | Stripe documentation lookup. |

## Documentation and design (discovered 2026-10-30)

Include for later (7):

| Skill | Rights | Why |
|---|---|---|
| `skills/theme-factory` | Apache-2.0 (Anthropic) | Themed artifacts for marketing and pitch material. |
| `skills/frontend-design` | Apache-2.0 (Anthropic) | UI/UX design guidance. |
| `skills/web-artifacts-builder` | Apache-2.0 (Anthropic) | React/Tailwind artifact prototyping. |
| `skills/canvas-design` | Apache-2.0 (Anthropic) | Visual/poster generation. |
| `skills/internal-comms` | Apache-2.0 (Anthropic) | Status reports, newsletters, FAQs. |
| `skills/mcp-builder` | Apache-2.0 (Anthropic) | MCP server authoring - only if the project builds MCP integrations. |
| `skills/writing-user-docs` | MIT (Callstack Incubator) | House style for user-facing documentation. |

Not include:

| Skill | Rights | Reason |
|---|---|---|
| `doc-coauthoring` (anthropics/skills) | Its folder has no LICENSE file (other anthropics example skills verified Apache-2.0 per folder) | Rights unresolved. |
| `brand-guidelines` (anthropics/skills) | Apache-2.0 (verified) | Applies Anthropic's own brand - low direct value for this project. |
| anthropics `docx`, `pdf`, `pptx`, `xlsx` | Source-available, NOT open source per the repository README | Reference only - do not copy in. |
| Marketing/GTM mega-collections (from curated lists) | Unverified | Names surveyed; quality and licenses unverified. |
