# Skills index

Full catalog: the 222 skill entries the project owner supplied on 2026-10-29, plus the skills discovered across GitHub on 2026-10-30 (29 newly included, 2 supplied entries promoted to included, and the candidates reviewed and not included). Every supplied entry and every individually assessed discovered candidate appears in its own row with its rights status and decision.

Each skill appears under its subject category in one of three decision tables:

- **Include now** - copied into `skills/`, useful for the current testnet demo.
- **Include for later** - copied into `skills/` with verified rights, useful for the real product rather than the current demo.
- **Not include** - kept out of this repository. Each row gives the skill's own rights status (no license file, unverified origin, license conflict, or copyleft needing a deliberate decision) and its usefulness classification where one was made. A useful skill stays here while its rights are unclear - usefulness and inclusion rights are assessed separately.

The 44 owner-authored EU compliance guides are published with the project owner's authorization (no license granted yet). Every included third-party skill's license was verified at the linked upstream file - attribution in NOTICE.md, per-entry assessment in ASSESSMENT.md.
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
| `dapp` | No license stated, origin unverified | Useful now - Freighter and Wallets Kit integration patterns. |
| `frontend` | Declared-only license (stellarskills family) | Useful now - Freighter and Wallets Kit integration patterns. |
| `testing` | Declared-only license (stellarskills family) | Useful now - testnet E2E patterns. |
| `freighter-best-practices` | No license stated, origin unverified | Useful now - the only guide written for the Freighter extension codebase itself. |
| `state-archival` | Declared-only license (stellarskills family) | Useful now - TTL and state restoration rules. |
| `assets` | Declared-only or unverified license (stellarskills family / circulating copies) | Useful now. |
| `data` | Declared-only or unverified license (stellarskills family / circulating copies) | Useful now. |
| `openzeppelin` | Declared-only or unverified license (stellarskills family / circulating copies) | Useful now. |
| `smart-contracts` | Declared-only or unverified license (stellarskills family / circulating copies) | Useful now. |
| `soroban` | Declared-only or unverified license (stellarskills family / circulating copies) | Useful now. |
| `standards` | Declared-only or unverified license (stellarskills family / circulating copies) | Useful now. |
| `stellar-assets` | Declared-only or unverified license (stellarskills family / circulating copies) | Useful now. |
| `stellar-cli` | Declared-only or unverified license (stellarskills family / circulating copies) | Useful now. |
| `stellarskills-accounts` | Declared-only or unverified license (stellarskills family / circulating copies) | Useful now. |
| `stellarskills-assets` | Declared-only or unverified license (stellarskills family / circulating copies) | Useful now. |
| `stellarskills-fees` | Declared-only or unverified license (stellarskills family / circulating copies) | Useful now. |
| `stellarskills-operations` | Declared-only or unverified license (stellarskills family / circulating copies) | Useful now. |
| `stellarskills-rpc` | Declared-only or unverified license (stellarskills family / circulating copies) | Useful now. |
| `storage` | Declared-only or unverified license (stellarskills family / circulating copies) | Useful now. |
| `tools` | Declared-only or unverified license (stellarskills family / circulating copies) | Useful now. |
| `security` | Declared-only or unverified license (stellarskills family / circulating copies) | Useful now. |
| `develop-secure-contracts` | AGPL-3.0-only (verified upstream, OpenZeppelin) | Useful now, but strong copyleft: publishing a copy needs a deliberate decision and a separate license boundary. |
| `horizon` | Rights unclear | Bounded auxiliary fit, as `horizon-legacy`. |
| `passkeys` | File declares no license (references kalepail/passkey-kit, MIT verified upstream) | Useful later - the wallet-upgrade path. |
| `smart-accounts` | Declared-only license (stellarskills family) | Useful later - the wallet-upgrade path. |
| `anchors` | Rights unclear | Useful later. |
| `data-indexers` | Rights unclear | Useful later. |
| `dex` | Rights unclear | Useful later. |
| `openzeppelin-relayer` | Rights unclear | Useful later. |
| `oracles` | Rights unclear | Useful later. |
| `seps` | Rights unclear | Useful later. |
| `setup-stellar-contracts` | Rights unclear | Useful later. |
| `soroswap-sdk` | Rights unclear | Useful later. |
| `stellar-builder-quickstart` | Rights unclear | Useful later. |
| `stellar-help` | Rights unclear | Useful later. |
| `upgrade-stellar-contracts` | Rights unclear | Useful later. |
| `bridge` | Rights unclear | Not a fit for this project. |
| `check-balance` | Rights unclear | Not a fit for this project. |
| `cross-chain` | Rights unclear | Not a fit for this project. |
| `cross-chain2` | Rights unclear | Not a fit for this project. |
| `privacy` | Rights unclear | Not a fit for this project. |
| `send-payment` | Rights unclear | Not a fit for this project. |
| `send-raw` | Rights unclear | Not a fit for this project. |
| `zk-proofs` | Rights unclear | Not a fit for this project. |
| sickn33/agentic-awesome-skills soroban set (collection) | MIT | Read in full; template-grade filler. Not recommended. |
| Soneso / StellarCN SDK skills (collection) | Unverified | Kotlin/PHP/Python SDK guidance - stack mismatch for the current demo. |
| `stellar-dev` circulating copies | Canonical upstream unverified | Rights unclear. |
## EU compliance and legal (46 supplied, consolidated to 44 on 2026-10-30)

Owner-authored guides; the project owner confirmed his authorship on 2026-10-29. Published as written, no license granted yet (all rights reserved by the owner). Every guide was read in full and re-checked on 2026-10-30; the legal review record is in ASSESSMENT.md.

Include now (5; usable in the current demo work - contract engineering and audit, API design, crowdfunding UX, accessibility):

| Skill | Rights | Why |
|---|---|---|
| `skills/eu-compliant-stellar-crowdfunding-engineering` | Owner-authored, all rights reserved | Escrow, refund and atomic-settlement mechanics for the demo contract. |
| `skills/eu-web-accessibility-compliance-wcag-eaa` | Owner-authored, all rights reserved | Accessibility compliance for the current demo UI. |
| `skills/fintech-ux-design-for-eu-crowdfunding` | Owner-authored, all rights reserved | Crowdfunding UX patterns for the current demo UI. |
| `skills/stellar-eu-crowdfunding-smart-contract-auditor` | Owner-authored, all rights reserved | The audit method applies to the demo contract. |
| `skills/stellar-eu-tokenization-api-design` | Owner-authored, all rights reserved | Endpoint and XDR-envelope patterns for the demo backend. |

Include for later (39; the compliance, licensing and operations groundwork for the real product):

| Skill | Rights | Why |
|---|---|---|
| `crowdfunding-partnership-outreach` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `crowdfunding-secondary-market-advisor-eu-stellar` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `compliant-eu-tokenization-cloud-infrastructure` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `dora-ict-operational-resilience-compliance` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `dora-ict-operational-resilience-specialist` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `ecspr-crowdfunding-compliance-specialist` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `eu-crowdfunding-governance-risk-advisor` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `eu-crowdfunding-investor-suitability-assessment` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `eu-crowdfunding-sanctions-compliance` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `eu-crowdfunding-tokenization-compliance` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `eu-crowdfunding-tokenization-compliance-advisor` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `eu-crowdfunding-tokenization-compliance-writer` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `eu-crowdfunding-tokenization-insurance-advisor` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `eu-crowdfunding-tokenization-tax-compliance` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `eu-crypto-aml-ctf-compliance-officer` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `eu-crypto-asset-crowdfunding-cybersecurity-compliance` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `eu-crypto-asset-investor-education` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `eu-crypto-crowdfunding-compliance-integration` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `eu-crypto-crowdfunding-incident-response` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `eu-data-privacy-for-tokenized-crowdfunding` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `eu-mica-casp-licensing-counsel` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `eu-prospectus-and-tokenization-compliance-counsel` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `eu-securities-legal-counsel-crowdfunding-tokenization` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `eu-tokenization-expansion-specialist` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `eu-web3-governance-advisor` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `select-eu-compliant-stellar-funding-portals` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `stella-eu-payment-rails-integration` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `stellar-eu-crowdfunding-community-manager` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `stellar-eu-crowdfunding-compliance-devrel` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `stellar-eu-crowdfunding-compliance-risk` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `stellar-eu-crowdfunding-compliance-support` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `stellar-eu-crowdfunding-growth-analytics` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `stellar-eu-crowdfunding-gtm-strategy` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `stellar-eu-crowdfunding-regulatory-compliance` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `stellar-eu-tokenization-architecture` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `stellar-eu-tokenization-custodian` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `stellar-eu-tokenization-transfer-agent` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `stellar-eu-tokenization-treasury-management` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |
| `stellar-eu-tokenized-crowdfunding-compliance` | Owner-authored, all rights reserved | Useful later - compliance, licensing and operations groundwork for the real product. |

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
| `scf-budget-builder` | Rights unclear | Useful later - direct fit for a Stellar Community Fund application. |
| `scf-claim-verifier` | Rights unclear | Useful later - direct fit for a Stellar Community Fund application. |
| `scf-competitor-analyst` | Rights unclear | Useful later - direct fit for a Stellar Community Fund application. |
| `scf-interest-form-drafter` | Rights unclear | Useful later - direct fit for a Stellar Community Fund application. |
| `scf-live-context` | Rights unclear | Useful later - direct fit for a Stellar Community Fund application. |
| `scf-prescreen-checker` | Rights unclear | Useful later - direct fit for a Stellar Community Fund application. |
| `scf-referral-preparer` | Rights unclear | Useful later - direct fit for a Stellar Community Fund application. |
| `scf-reviewer` | Rights unclear | Useful later - direct fit for a Stellar Community Fund application. |
| `scf-round-reviewer` | Rights unclear | Useful later - direct fit for a Stellar Community Fund application. |
| `scf-round-watcher` | Rights unclear | Useful later - direct fit for a Stellar Community Fund application. |
| `scf-submission-drafter` | Rights unclear | Useful later - direct fit for a Stellar Community Fund application. |
| `scf-submission-radar` | Rights unclear | Useful later - direct fit for a Stellar Community Fund application. |
| `scf-tranche-reporter` | Rights unclear | Useful later - direct fit for a Stellar Community Fund application. |
## Product and workflow (BMAD-style) (17 supplied)

Not include:

| Skill | Rights | Reason |
|---|---|---|
| `code-review` | Rights unclear | Useful now. |
| `advanced-elicitation` | Rights unclear | Useful later. |
| `brainstorming` | Rights unclear | Useful later. |
| `bri-tech-writer` | Rights unclear | Useful later. |
| `create-architecture` | Rights unclear | Useful later. |
| `create-epics-and-stories` | Rights unclear | Useful later. |
| `create-ux-design` | Rights unclear | Useful later. |
| `dev-story` | Rights unclear | Useful later. |
| `elliot-dev` | Rights unclear | Useful later. |
| `justin-analyst` | Rights unclear | Useful later. |
| `kaan-ux-designer` | Rights unclear | Useful later. |
| `nicole-pm` | Rights unclear | Useful later. |
| `party-mode` | Rights unclear | Useful later. |
| `prd` | Rights unclear | Useful later. |
| `prfaq` | Rights unclear | Useful later. |
| `product-brief` | Rights unclear | Useful later. |
| `tyler-architect` | Rights unclear | Useful later. |
| obra `brainstorming` (discovered 2026-10-30) | MIT (verified) | Duplicates the catalogued BMAD `brainstorming` entry - not counted, to avoid inflating the list. |
## Third-party project skills (32 supplied)

Include for later (1):

| Skill | Rights | Why |
|---|---|---|
| `skills/stellar-anchor-skill` | Apache-2.0 (Cheesecake Labs) | Fiat on/off-ramp implementation layer for Stellar anchors. Promoted 2026-10-30 (was listed below as rights unclear; upstream license verified). |
Not include:

| Skill | Rights | Reason |
|---|---|---|
| `sozu-faucet` | Declares MIT in its own file (author: blessedux); upstream repository no longer reachable to verify | Useful now - one-command testnet USDC. |
| `blux` | Rights unclear | Useful later. |
| `caatinga` | Rights unclear | Useful later. |
| `cosmospay` | Rights unclear | Useful later. |
| `lumenloop-mcp-connect` | Rights unclear | Useful later. |
| `pollar-wallet-auth` | Rights unclear | Useful later. |
| `stellartools-payments` | Rights unclear | Useful later. |
| `trustless-work-dev` | Rights unclear | Useful later. |
| `agentic-payments` | Rights unclear | Not a fit for this project - agent-to-agent payment protocols. |
| `mpp` | Rights unclear | Not a fit for this project - agent-to-agent payment protocols. |
| `x402` | Rights unclear | Not a fit for this project - agent-to-agent payment protocols. |
| `x402-stellar-checks` | Rights unclear | Not a fit for this project - agent-to-agent payment protocols. |
| `x402-stellar-context` | Rights unclear | Not a fit for this project - agent-to-agent payment protocols. |
| `nirium-agentic-payments` | Rights unclear | Not a fit for this project - agent-to-agent payment protocols. |
| `pay-link` | Rights unclear | Not a fit for this project - agent-to-agent payment protocols. |
| `pay-per-call` | Rights unclear | Not a fit for this project - agent-to-agent payment protocols. |
| `wasit` | Rights unclear | Not a fit for this project - agent-to-agent payment protocols. |
| `xoxno-lending` | Rights unclear | Not a fit for this project - DeFi lending. |
| `xoxno-lending-contracts` | Rights unclear | Not a fit for this project - DeFi lending. |
| `xoxno-lending-data` | Rights unclear | Not a fit for this project - DeFi lending. |
| `xoxno-lending-liquidations` | Rights unclear | Not a fit for this project - DeFi lending. |
| `xoxno-lending-sdk` | Rights unclear | Not a fit for this project - DeFi lending. |
| `xoxno-lending-troubleshooting` | Rights unclear | Not a fit for this project - DeFi lending. |
| `xoxno-swap-aggregator` | Rights unclear | Not a fit for this project - DeFi lending. |
| `defindex-sdk-skill` | Rights unclear | Not a fit for this project - cross-chain DeFi. |
| `sodax` | Rights unclear | Not a fit for this project - cross-chain DeFi. |
| `cogladius` | Rights unclear | Not a fit for this project - unrelated agent tooling. |
| `contextio` | Rights unclear | Not a fit for this project - unrelated agent tooling. |
| `eunomia` | Rights unclear | Not a fit for this project - unrelated agent tooling. |
| `pmll` | Rights unclear | Not a fit for this project - unrelated agent tooling. |
| `stellar-agent-search-mcp` | Rights unclear | Not a fit for this project - unrelated agent tooling. |
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
| `find-stellar-idea` | Rights unclear | Useful later. |
| `stellar-competitive-landscape` | Rights unclear | Useful later. |
| `stellar-content-auditor` | Rights unclear | Useful later. |
| `stellar-developer-activity` | Rights unclear | Useful later. |
| `stellar-disbursement-platform` | Rights unclear | Useful later. |
| `stellar-ecosystem-digest` | Rights unclear | Useful later. |
| `stellar-ecosystem-scout` | Rights unclear | Useful later. |
| `stellar-integration-finder` | Rights unclear | Useful later. |
| `stellar-knowledge` | Rights unclear | Useful later. |
| `stellar-project-dossier` | Rights unclear | Useful later. |
| `stellar-registry` | Rights unclear | Useful later. |
## Research and writing (14 supplied)

Not include:

| Skill | Rights | Reason |
|---|---|---|
| `deep-research` | Rights unclear | Useful now - supports the project's ongoing regulatory and ecosystem research. |
| `fetch-external-doc` | Rights unclear | Useful later - belongs to the SCF workflow. |
| `crypto-ai-acknowledgements` | Rights unclear | Not a fit for this project - academic cryptography research and paper writing. |
| `crypto-benchmarking` | Rights unclear | Not a fit for this project - academic cryptography research and paper writing. |
| `crypto-correlation-accounting` | Rights unclear | Not a fit for this project - academic cryptography research and paper writing. |
| `crypto-implementation-evaluation-writing` | Rights unclear | Not a fit for this project - academic cryptography research and paper writing. |
| `crypto-literature-evidence` | Rights unclear | Not a fit for this project - academic cryptography research and paper writing. |
| `crypto-manuscript-qa` | Rights unclear | Not a fit for this project - academic cryptography research and paper writing. |
| `crypto-prior-work-comparison` | Rights unclear | Not a fit for this project - academic cryptography research and paper writing. |
| `crypto-proof-auditor` | Rights unclear | Not a fit for this project - academic cryptography research and paper writing. |
| `crypto-protocol-implementation` | Rights unclear | Not a fit for this project - academic cryptography research and paper writing. |
| `crypto-research-artifacts` | Rights unclear | Not a fit for this project - academic cryptography research and paper writing. |
| `crypto-research-framing` | Rights unclear | Not a fit for this project - academic cryptography research and paper writing. |
| `cryptography-writing` | Rights unclear | Not a fit for this project - academic cryptography research and paper writing. |
## Agent workflow infrastructure (24 supplied)

Not include:

| Skill | Rights | Reason |
|---|---|---|
| `investigate` | Rights unclear | Useful now - debugging during active demo development. |
| `agent-browser-webauthn` | Rights unclear | Automated passkey tests in a browser; not applicable to extension wallets such as Freighter. |
| `audit-reviewability` | Rights unclear | Useful later - codebase hardening before production. |
| `ingest-sdk` | Rights unclear | Useful later - production ledger data pipeline. |
| `review-edge-case-hunter` | Rights unclear | Useful later - codebase hardening before production. |
| `why` | Rights unclear | Useful later - Stellar positioning for SCF and go-to-market. |
| `bench-skills` | Rights unclear | Not a fit - maintains the stellar-build / stellar-raven-codemode skill-collection tooling itself. |
| `cloudflare-observability-review` | Rights unclear | Not a fit - maintains the stellar-build / stellar-raven-codemode skill-collection tooling itself. |
| `golden-truth` | Rights unclear | Not a fit - maintains the stellar-build / stellar-raven-codemode skill-collection tooling itself. |
| `improvements-pipeline` | Rights unclear | Not a fit - maintains the stellar-build / stellar-raven-codemode skill-collection tooling itself. |
| `learning-loop` | Rights unclear | Not a fit - maintains the stellar-build / stellar-raven-codemode skill-collection tooling itself. |
| `live-drift-resolution` | Rights unclear | Not a fit - maintains the stellar-build / stellar-raven-codemode skill-collection tooling itself. |
| `navigate-skills` | Rights unclear | Not a fit - maintains the stellar-build / stellar-raven-codemode skill-collection tooling itself. |
| `optimize-skills` | Rights unclear | Not a fit - maintains the stellar-build / stellar-raven-codemode skill-collection tooling itself. |
| `retrieval-system-audit` | Rights unclear | Not a fit - maintains the stellar-build / stellar-raven-codemode skill-collection tooling itself. |
| `run-evals` | Rights unclear | Not a fit - maintains the stellar-build / stellar-raven-codemode skill-collection tooling itself. |
| `truth-maintenance` | Rights unclear | Not a fit - maintains the stellar-build / stellar-raven-codemode skill-collection tooling itself. |
| `discover` | Rights unclear | Not a fit - MPP/agent-wallet payment tooling. |
| `onboard` | Rights unclear | Not a fit - MPP/agent-wallet payment tooling. |
| `reprompt` | Rights unclear | Not a fit - orchestration meta-tooling. |
| `routing-agent-work` | Rights unclear | Not a fit - orchestration meta-tooling. |
| `skill router stellar new` | Rights unclear | Not a fit - orchestration meta-tooling. |
| `stellarskills-zk-proofs` | Rights unclear | Not a fit - ZK/sealed-bid tooling. |
| `sub-rosa` | Rights unclear | Not a fit - ZK/sealed-bid tooling. |
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
| `neon-postgres` (neondatabase/website) | No LICENSE file in that repository | Content read; rights unresolved. |
| `neon-auth` (neondatabase/website) | No LICENSE file in that repository | Content read; rights unresolved. |
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
| `doc-coauthoring` (anthropics/skills) | No LICENSE file in its folder | Rights unresolved. |
| `brand-guidelines` (anthropics/skills) | Apache-2.0 (verified) | Applies Anthropic's own brand - low direct value for this project. |
| `docx` (anthropics/skills) | Source-available, NOT open source per the repository README | Reference only - do not copy in. |
| `pdf` (anthropics/skills) | Source-available, NOT open source per the repository README | Reference only - do not copy in. |
| `pptx` (anthropics/skills) | Source-available, NOT open source per the repository README | Reference only - do not copy in. |
| `xlsx` (anthropics/skills) | Source-available, NOT open source per the repository README | Reference only - do not copy in. |
| Marketing/GTM mega-collections (from curated lists) | Unverified | Names surveyed; quality and licenses unverified. |

## Prisma Postgres, ORM and Composer (11 owner-requested, added 2026-11-06)

Requested by the project owner on 2026-11-06. Nine skills from the official
[prisma/skills](https://github.com/prisma/skills) repository (upstream main
`8ea289b730c2e89f7ff1f518af128b113d842a92`, MIT),
`prisma-composer-core-concepts` from
[prisma/composer](https://github.com/prisma/composer) (upstream main
`48b12382509e08f56a4722004d2cef43aa9d5667`, Apache-2.0), and `prisma-8` from
[prisma/orm](https://github.com/prisma/orm) (upstream main
`27848960349a0a124c1bdc0e56a649df19dbfcbc`, Apache-2.0). SKILL.md and
reference content verified byte-identical to the pinned upstream commits;
each upstream LICENSE file copied into the skill folder. These are reference
copies for the database migration work (raw `pg` driver against Prisma
Postgres); the project does not use Prisma ORM. Per the owner's standing
rule, skills in this collection are there to be consulted and used in project
work where relevant, not archived-only; that never authorizes executing their
commands, installing packages, or changing architecture by itself.

Include now (11):

| Skill | Rights | Why |
|---|---|---|
| `skills/prisma-cli` | MIT (Prisma) | Prisma ORM 7 CLI reference. |
| `skills/prisma-client-api` | MIT (Prisma) | Prisma Client API reference (queries, filters, transactions). |
| `skills/prisma-upgrade-v7` | MIT (Prisma) | Prisma ORM v6 to v7 migration guide. |
| `skills/prisma-mongodb-upgrade` | MIT (Prisma) | Prisma ORM MongoDB v6 decision and migration guide. |
| `skills/prisma-database-setup` | MIT (Prisma) | Provider setup guides (deprecated compatibility name for `prisma-orm-setup`; requested by name). |
| `skills/prisma-postgres` | MIT (Prisma) | Prisma Postgres workflows (deprecated compatibility name for `prisma-postgres-setup`; requested by name). |
| `skills/prisma-postgres-setup` | MIT (Prisma) | Provision or reuse a Prisma Postgres database and connect an application - the live migration reference. |
| `skills/prisma-compute` | MIT (Prisma) | Deploy and operate apps on Prisma Compute (Prisma 8 CLI). |
| `skills/prisma-driver-adapter-implementation` | MIT (Prisma) | Prisma ORM 7 SQL driver adapter implementation reference. |
| `skills/prisma-composer-core-concepts` | Apache-2.0 (Prisma) | Prisma Composer mental model and authoring API. Pinned reference copy - upstream keeps the canonical version inside the `@prisma/composer` package, so re-sync if Composer is adopted. |
| `skills/prisma-8` | Apache-2.0 (Prisma) | Prisma ORM 8 full reference: contracts, queries, migrations, client setup, upgrade paths. Pinned reference copy - upstream ships the canonical version inside the `@prisma/orm-*` packages, so re-sync if the ORM is adopted. |
