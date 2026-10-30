# Skills index

Full catalog of the skill collection the project owner supplied on 2026-10-29 (222 entries).

- **Included** entries are copied into `skills/`: the 46 owner-authored EU compliance guides are published with the project owner's authorization (no license added to them); every third-party entry's license was verified to permit publication (see NOTICE.md).
- **Not included** entries have unclear publication rights (no license file or unverified provenance), so their content stays out of this public repository. Only the skill names are listed. See README.md for how to keep a private local copy.
- **Useful** and **Useful but not for now** are subcategories from the assessment (see ASSESSMENT.md): useful means useful now, for the current testnet demo; useful but not for now means useful later, for the real product. Usefulness is independent of inclusion - a useful skill stays out while its rights are unclear.
- **Not a fit for this project** entries were assessed and found not relevant to this project's demo or product direction (for example other chains' DeFi tooling, agent-to-agent payment protocols, or tooling that maintains the skill collection itself). Every entry in the catalog was classified on 2026-10-30; the per-entry reasons are in ASSESSMENT.md.

## Stellar development (63)

Included:

**Useful:**

| Skill | Description | License |
|---|---|---|
| `skills/soroban-testing` | Testing Soroban smart contracts — unit tests, integration tests, testnet deployment, Stellar CLI testing. Use when writing tests or debugging contract... | CC-BY-4.0 / MIT (nrxschool) |
| `skills/smart-contract-security` | Smart contract security on Stellar — OpenZeppelin contracts, audit patterns, common vulnerabilities. Use when securing Soroban contracts or preparing... | CC-BY-4.0 / MIT (nrxschool) |
| `skills/soroban-common-mistakes` | Review Soroban (Rust) smart contracts for common security mistakes, logic errors, and code-quality issues. Use this skill whenever the user writes, re... | MIT |
| `skills/soroban-security` | Soroban smart contract security patterns — access control, reentrancy, integer safety, auth best practices. Use when auditing or securing Soroban cont... | CC-BY-4.0 / MIT (nrxschool) |
| `skills/horizon-legacy` | Horizon REST API for classic Stellar operations — accounts, transactions, effects, streaming. Use when maintaining legacy integrations. Do NOT use for... | CC-BY-4.0 / MIT (nrxschool) Bounded auxiliary fit: helps with the classic trustline/funding queries the testnet flow still uses; prefer `stellar-rpc` for new work. |
| `skills/accounts` | Stellar account model — keypairs, funding, signers, sponsorship, and minimum balances. Use when creating accounts, managing signers, or understanding... | CC-BY-4.0 / MIT (nrxschool) |
| `skills/assets` | Stellar asset issuance, trustlines, custom tokens, and Stellar Asset Contract (SAC). Use when issuing tokens, managing trustlines, or bridging classic... | CC-BY-4.0 / MIT (nrxschool) |
| `skills/fees` | Stellar fee model — base fees, resource fees, surge pricing, and fee strategies. Use when optimizing transaction costs or understanding fee mechanics.... | CC-BY-4.0 / MIT (nrxschool) |
| `skills/frontend-integration` | Frontend integration with Stellar — wallet connections, transaction signing, React patterns, and browser SDK usage. Use when building web apps on Stel... | CC-BY-4.0 / MIT (nrxschool) |
| `skills/mcp-servers` | MCP servers for Stellar — Model Context Protocol integrations, XDR decoder, AI-assisted development. Use when setting up AI agent tooling for Stellar.... | CC-BY-4.0 / MIT (nrxschool) |
| `skills/operations` | All Stellar transaction operations — Payment, CreateAccount, ManageOffers, PathPayment, and more. Use when building or submitting transactions. Do NOT... | CC-BY-4.0 / MIT (nrxschool) |
| `skills/soroban-contracts` | Soroban smart contract development — Rust/WASM contracts, storage, auth, cross-contract calls, deployment. Use when writing, deploying, or invoking So... | CC-BY-4.0 / MIT (nrxschool) |
| `skills/stellar-cli` | Stellar CLI — contract management, key management, network configuration, and development workflows. Use when working with the Stellar CLI tool. Do NO... | CC-BY-4.0 / MIT (nrxschool) |
| `skills/stellar-rpc` | Stellar RPC JSON-RPC API — simulateTransaction, sendTransaction, getTransaction, getEvents, getLedgerEntries. Use when interacting with the Stellar ne... | CC-BY-4.0 / MIT (nrxschool) |
| `skills/stellar-sdks` | Stellar SDKs — JavaScript, Python, Go, Rust client libraries for interacting with the Stellar network. Use when choosing or using an SDK. Do NOT use f... | CC-BY-4.0 / MIT (nrxschool) |

**Useful but not for now:**

| Skill | Description | License |
|---|---|---|
| `skills/dex-amm` | Stellar built-in DEX and AMM — order books, manage offers, path payments, liquidity pools. Use when trading on Stellar or building DEX integrations. D... | CC-BY-4.0 / MIT (nrxschool) |
| `skills/seps-anchors` | Stellar SEP standards and anchor ecosystem — SEP-6, SEP-10, SEP-24, SEP-31, stellar.toml, fiat on/off-ramps. Use when integrating with anchors or impl... | CC-BY-4.0 / MIT (nrxschool) |

**Not a fit for this project:**

| Skill | Description | License |
|---|---|---|
| `skills/nearx-contributing-guide` | Guide for Nearx community members to contribute skills to this repository. Use when adding a new skill or understanding the contribution process. Do N... | CC-BY-4.0 / MIT (nrxschool) |

Not included (name only; rights unclear):

**Useful:**

`dapp`, `freighter-best-practices`, `frontend`, `state-archival`, `testing`, `assets`, `data`, `openzeppelin`, `smart-contracts`, `soroban`, `standards`, `stellar-assets`, `stellar-cli`, `stellarskills-accounts`, `stellarskills-assets`, `stellarskills-fees`, `stellarskills-operations`, `stellarskills-rpc`, `storage`, `tools`, `security`, `develop-secure-contracts` (verified AGPL-3.0-only; publishing a copy needs a deliberate decision and a separate license boundary), `horizon` (bounded auxiliary fit, as `horizon-legacy`)

**Useful but not for now:**

`passkeys`, `smart-accounts`, `anchors`, `data-indexers`, `dex`, `openzeppelin-relayer`, `oracles`, `scaffold-stellar`, `seps`, `setup-stellar-contracts`, `soroswap-sdk`, `stellar-builder-quickstart`, `stellar-help`, `upgrade-stellar-contracts`

**Not a fit for this project:**

`bridge`, `check-balance`, `cross-chain`, `cross-chain2`, `privacy`, `send-payment`, `send-raw`, `zk-proofs`

## EU compliance and legal (46)

Included (owner-authored, confirmed by the project owner on 2026-10-29; copied into `skills/`). Each guide was read in full and re-checked on 2026-10-30 (record in ASSESSMENT.md).

**Useful** (5; usable in the current demo work - contract engineering and audit, API design, crowdfunding UX, accessibility):

`eu-compliant-stellar-crowdfunding-engineering`, `eu-web-accessibility-compliance-wcag-eaa`, `fintech-ux-design-for-eu-crowdfunding`, `stellar-eu-crowdfunding-smart-contract-auditor`, `stellar-eu-tokenization-api-design`

**Useful but not for now** (41; the compliance, licensing and operations groundwork for the real product. `stellar-eu-tokenization-treasurymanagement` is a marked near-duplicate of `stellar-eu-tokenization-treasury-management`; `stellar-eu-compliance-monitor` is a marked byte-identical duplicate of `stellar-eu-crowdfunding-community-manager`):

`compliant-eu-tokenization-cloud-infrastructure`, `crowdfunding-partnership-outreach`, `crowdfunding-secondary-market-advisor-eu-stellar`, `dora-ict-operational-resilience-compliance`, `dora-ict-operational-resilience-specialist`, `ecspr-crowdfunding-compliance-specialist`, `eu-crowdfunding-governance-risk-advisor`, `eu-crowdfunding-investor-suitability-assessment`, `eu-crowdfunding-sanctions-compliance`, `eu-crowdfunding-tokenization-compliance`, `eu-crowdfunding-tokenization-compliance-advisor`, `eu-crowdfunding-tokenization-compliance-writer`, `eu-crowdfunding-tokenization-insurance-advisor`, `eu-crowdfunding-tokenization-tax-compliance`, `eu-crypto-aml-ctf-compliance-officer`, `eu-crypto-asset-crowdfunding-cybersecurity-compliance`, `eu-crypto-asset-investor-education`, `eu-crypto-crowdfunding-compliance-integration`, `eu-crypto-crowdfunding-incident-response`, `eu-data-privacy-for-tokenized-crowdfunding`, `eu-mica-casp-licensing-counsel`, `eu-prospectus-and-tokenization-compliance-counsel`, `eu-securities-legal-counsel-crowdfunding-tokenization`, `eu-tokenization-expansion-specialist`, `eu-web3-governance-advisor`, `select-eu-compliant-stellar-funding-portals`, `stella-eu-payment-rails-integration`, `stellar-eu-compliance-monitor`, `stellar-eu-crowdfunding-community-manager`, `stellar-eu-crowdfunding-compliance-devrel`, `stellar-eu-crowdfunding-compliance-risk`, `stellar-eu-crowdfunding-compliance-support`, `stellar-eu-crowdfunding-growth-analytics`, `stellar-eu-crowdfunding-gtm-strategy`, `stellar-eu-crowdfunding-regulatory-compliance`, `stellar-eu-tokenization-architecture`, `stellar-eu-tokenization-custodian`, `stellar-eu-tokenization-transfer-agent`, `stellar-eu-tokenization-treasury-management`, `stellar-eu-tokenization-treasurymanagement`, `stellar-eu-tokenized-crowdfunding-compliance`

## Stellar Community Fund (13)

Not included (name only; rights unclear):

**Useful but not for now** (all 13; direct fit for a Stellar Community Fund application):

`scf-budget-builder`, `scf-claim-verifier`, `scf-competitor-analyst`, `scf-interest-form-drafter`, `scf-live-context`, `scf-prescreen-checker`, `scf-referral-preparer`, `scf-reviewer`, `scf-round-reviewer`, `scf-round-watcher`, `scf-submission-drafter`, `scf-submission-radar`, `scf-tranche-reporter`

## Product and workflow (BMAD-style) (17)

Not included (name only; rights unclear):

**Useful:**

`code-review`

**Useful but not for now:**

`advanced-elicitation`, `brainstorming`, `bri-tech-writer`, `create-architecture`, `create-epics-and-stories`, `create-ux-design`, `dev-story`, `elliot-dev`, `justin-analyst`, `kaan-ux-designer`, `nicole-pm`, `party-mode`, `prd`, `prfaq`, `product-brief`, `tyler-architect`

## Third-party project skills (32)

Not included (name only; rights unclear):

**Useful:**

`sozu-faucet`

**Useful but not for now:**

`blux`, `caatinga`, `cosmospay`, `lumenloop-mcp-connect`, `pollar-wallet-auth`, `stellar-anchor-skill`, `stellartools-payments`, `trustless-work-dev`

**Not a fit for this project:**

`agentic-payments`, `cogladius`, `contextio`, `defindex-sdk-skill`, `eunomia`, `mpp`, `nirium-agentic-payments`, `pay-link`, `pay-per-call`, `pmll`, `sodax`, `stellar-agent-search-mcp`, `wasit`, `x402`, `x402-stellar-checks`, `x402-stellar-context`, `xoxno-lending`, `xoxno-lending-contracts`, `xoxno-lending-data`, `xoxno-lending-liquidations`, `xoxno-lending-sdk`, `xoxno-lending-troubleshooting`, `xoxno-swap-aggregator`

## Ecosystem intelligence (13)

Included:

**Useful but not for now:**

| Skill | Description | License |
|---|---|---|
| `skills/stellar-scout` | Scouts the Stellar ecosystem before you build: existing projects, open SCF-funded RFPs, SCF pitch drafting, audit firms, primary-source citations. Verified byte-identical to upstream Stellar-Light/stellar-scout. | MIT (Stellar Light) |
| `skills/stellar-prices-api` | Use when you need the USD or XLM price of a Stellar asset — XLM, USDC, any classic CODE:ISSUER asset or Soroban token — current prices, 24h change and... | MIT |

Not included (name only; rights unclear):

**Useful but not for now:**

`find-stellar-idea`, `stellar-competitive-landscape`, `stellar-content-auditor`, `stellar-developer-activity`, `stellar-disbursement-platform`, `stellar-ecosystem-digest`, `stellar-ecosystem-scout`, `stellar-integration-finder`, `stellar-knowledge`, `stellar-project-dossier`, `stellar-registry`

## Research and writing (14)

Not included (name only; rights unclear):

**Useful:**

`deep-research`

**Useful but not for now:**

`fetch-external-doc`

**Not a fit for this project:**

`crypto-ai-acknowledgements`, `crypto-benchmarking`, `crypto-correlation-accounting`, `crypto-implementation-evaluation-writing`, `crypto-literature-evidence`, `crypto-manuscript-qa`, `crypto-prior-work-comparison`, `crypto-proof-auditor`, `crypto-protocol-implementation`, `crypto-research-artifacts`, `crypto-research-framing`, `cryptography-writing`

## Agent workflow infrastructure (24)

Not included (name only; rights unclear):

**Useful:**

`investigate`

**Useful but not for now:**

`agent-browser-webauthn` (automated passkey tests in a browser; not applicable to extension wallets such as Freighter), `audit-reviewability`, `ingest-sdk`, `review-edge-case-hunter`, `why`

**Not a fit for this project:**

`bench-skills`, `cloudflare-observability-review`, `discover`, `golden-truth`, `improvements-pipeline`, `learning-loop`, `live-drift-resolution`, `navigate-skills`, `onboard`, `optimize-skills`, `reprompt`, `retrieval-system-audit`, `routing-agent-work`, `run-evals`, `skill router stellar new`, `stellarskills-zk-proofs`, `sub-rosa`, `truth-maintenance`
