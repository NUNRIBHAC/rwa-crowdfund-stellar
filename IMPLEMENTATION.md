# Identity, valuation, governance and cash-out implementation

29 October 2026. Local, test-only extension to `NUNRIBHAC/rwa-crowdfund-stellar` at `13c9c2ace752e45024ed4ad8472db3e919709ed0`, including the previously delivered v6 backend fixes. Nothing has been pushed, deployed or sent to a blockchain or payment provider.

## Run it

From a clean reconstructed repository:

```
npm ci
npm test
npm run build
npm --workspace backend run infra:demo
```

The last command runs a complete offline flow: simulated identity review, signed valuation, policy proposal, independent approvals, eligibility check, cash-out request, independent review and simulated dispatch. It uses invented fixtures, ephemeral signing material and temporary storage, then deletes the temporary directory. It needs no credentials and sends no network requests. `loan`, `PT`, `EUR` and the fixture asset are test inputs, not your chosen economic model, target corridor or legal classification.

### Optional HTTP API

Use `npm --workspace backend run infra:dev` with these variables supplied locally:

- `INFRA_MODE=test_only` (any other value refuses startup).
- `INFRA_PORT=4100` (optional).
- `INFRA_STORE_PATH`: absolute path outside version control; optional default `backend/data/infrastructure.json` when run via the workspace script.
- `INFRA_CREDENTIALS_JSON`: JSON array of `{id,role,token}`. Roles: compliance, valuation, governor, operator, auditor. Unique principal IDs and unique tokens of at least 32 characters are required. Generate your own random credentials with your secrets manager, never paste production secrets into chat. No credentials ship with this bundle.
- `INFRA_VALUATION_KEYS_JSON`: object mapping authorised valuer ID to Ed25519 public key in PEM/SPKI format. Private appraisal signing keys stay outside the backend. Empty means no valuation can be accepted.

Listens only on 127.0.0.1. Prefix `/api/infrastructure`. Authenticate with `Authorization: Bearer <your-token>`. Status is public; all other endpoints require credentials. This is a local development service, not a hardened internet deployment. Tokens are bootstrap credentials, not identity federation. There is no token issuance, login UI or browser-held secret.

| Method/path | Role | Input / result |
| --- | --- | --- |
| GET /status | none | Always declares test_only, no live onboarding/payments or compliance certification |
| POST /identities | compliance | subject, country, outcome demo_pass/rejected/needs_info, reference; never verifies a real person |
| POST /valuations | valuation | `{valuation,signature}`; valuation fields below |
| POST /proposals | governor | kind pilot_policy/pause/resume, assetId, jurisdiction PT, rightsHash, economicModel, assetClass |
| POST /proposals/:id/approve | governor | Proposer cannot approve; two different additional governors required |
| POST /eligibility | authenticated | subject, assetId, network testnet; productionEligible is always false |
| POST /cashouts | operator | subject, assetId, amountMinor, currency EUR, destinationRef, idempotencyKey |
| POST /cashouts/:key/approve | compliance | Must be a different principal from requester |
| POST /cashouts/:key/dispatch | operator | Rechecks current eligibility and rights; mock outcome only |
| GET /audit | auditor | Local event history, not a tamper-proof external audit log |

All monetary inputs are positive integer strings in minor units. No float conversion or guessed FX rate. Do not supply bank account details or ID documents: destinationRef and identity reference are opaque fake references, and extra fields are rejected for the main domain schemas.

## What is implemented

### 1. Identity and legal-policy gates

Strict mock review states, country gate, short-lived eligibility, separate compliance role, explicit simulation-only output. Missing/rejected/expired/wrong-country records fail closed. An approved asset policy carries an explicit economic model, asset class and rights document hash. This records decisions; it does not make them legally valid. A hash alone is not evidence of title or investor rights.

No real KYC/KYB provider, AML transaction monitoring, sanctions/PEP screening, beneficial-owner checks, source-of-funds checks, legal classification or authorisation application is implemented. The only identity entrypoint creates mock records and cannot mark a person as genuinely verified.

### 2. RWA valuation ingestion

Ed25519-signed envelopes with a domain/version/test-only separator bind asset ID, integer EUR value, observation/expiry times, evidence hash, methodology and trusted signer. Signature, allowlisted public key, chronology, maximum validity (24 hours for this simulation), expiry and replay/rollback are checked. An evidence hash is a pointer/integrity commitment, not proof that the appraisal is correct. No data scraping, automated property valuation or on-chain oracle publishing is claimed. Appraisal cadence and validity must be tailored to the selected asset class before production.

Envelope: `{assetId,amountMinor,currency:'EUR',observedAt,expiresAt,evidenceHash,method,signer}`. Times are Unix milliseconds. Method is independent_appraisal, nav or cashflow. Sign UTF-8 `valuationPayload(envelope)` from the provided module, with Ed25519; submit a base64 signature. The offline demo shows the exact signing flow. Public keys are deployment configuration, not requester-controlled keys.

### 3. Governance controls

Role checks, proposer plus two distinct approvers, one-hour proposal expiry, durable approval ordering, pause/resume and a local event trail. Cash-outs recheck pause, identity and valuation just before dispatch. A changed rights hash invalidates an old cash-out request. The local audit log is mutable by a host administrator; it is not an immutable or independently witnessed audit system.

Not a DAO, not on-chain multisig and not enforcement over the existing campaign engine or Soroban prototype. Governance of real assets still requires legally appointed people, corporate authority, conflicts policy, emergency rules and off-chain enforceability.

### 4. Cash-out orchestration

`requested -> approved -> dispatching -> simulated | unknown`. Request idempotency binds the full request. Intent is fsynced before adapter invocation. Concurrent dispatch is held. Timeouts or a process crash leave unknown/dispatching and cannot automatically resend. Repeated completed mock dispatches do not re-invoke the adapter. No manual override endpoint is shipped: unknown outcomes require independent reconciliation and a reviewed future implementation, not editing the JSON and retrying.

The only shipped adapter is `MockCashoutAdapter`, has no HTTP/chain code, reports simulated rather than paid, and moves no funds. There is no anchor, quote service, bank payout, stablecoin transfer or provider webhook. External code could lie about an adapter's declared mode; the shipped code is not a sandbox for arbitrary third-party adapters. Do not replace it with a live adapter without a separate production design and approval.

## Integration boundaries you must not miss

This is a separate API on port 4100. It does NOT automatically gate the legacy campaign API on 4000, Freighter invest/build or invest/submit, finalize/refund, classic token transfers, nor the separate Soroban prototype. Running the original frontend does not make its campaign paths KYC-controlled. The separation is deliberate: a mock identity must never unlock real investment or cash-out. The frontend is unchanged; exercise the new API with the offline demo or an API client.

Before wiring any production investment route, bind an authenticated real subject to their Stellar account using a verified wallet challenge, enforce eligibility inside the same transactional operation as acceptance, and enforce transfer restrictions where required by the rights model. Client-supplied subject/network/asset identifiers are not proof of wallet ownership. No such proof is claimed here. Legacy backend fixes and this extension remain testnet demo code, not a real-funds system.

Storage is a mode-0600 fsynced JSON file with rename and directory fsync, with synchronous in-process mutation. Run ONE infrastructure process per file. No multiprocess transaction safety, database migrations, external immutable audit sink, encrypted PII store, key rotation service, distributed approval identity proof or production disaster recovery. Directory fsync failures propagate rather than being treated as success. A write can have landed before an error: reconcile state before retrying. Storage corruption fails closed.

## Legal and provider work that cannot be implemented by code

First select asset class, economic rights, issuer/owner structure, target investors and countries, custody and payment model. Counsel should produce a classification memo and enforceable subscription/loan/share/revenue/reward documents, title/security and default waterfall, servicing and insolvency plan, tax treatment and disclosure package. An SPV is not an automatic solution: ECSPR restricts its use. Pooled managed investment may require fund/AIF analysis. These are review questions, not conclusions that this project meets those regimes.

ECSPR is conditional: business lending or qualifying securities/admitted instruments through a crowdfunding service may fit, subject to scope and authorisation; it is not a blanket regime for all token sales. Its EUR 5 million cap is aggregated per project owner over 12 months under the regulation's calculation, not per token or campaign. Tokenized financial instruments remain financial instruments and are excluded from MiCA's crypto-asset scope. Other tokens and the separate custody/exchange/transfer services require their own MiCA assessment. A token referencing a real asset is not automatically an ART: stabilisation features and rights matter.

Portugal's Lei 69/2025 divides MiCA responsibilities between Banco de Portugal and CMVM. Its historic VASP transitional continuation ended by 1 July 2026 (or earlier authorisation/refusal). Do not treat an old VASP registration as a current CASP authorisation. ECSPR/payment/CASP permissions are separate. Confirm current registers and exact permitted services when selecting counterparties. No provider or corridor has been selected or verified in this implementation.

If ECSPR applies, build the required investor classification/knowledge and loss-capacity assessment, key investment information sheet, reflection/revocation handling, disclosures, complaints, conflicts and reporting BEFORE live use. The current after-deadline settlement prototype alone is not a regulatory cooling-off mechanism. Current CMVM reporting includes project/investor data requirements; add an approved reporting schema rather than collecting arbitrary PII.

## Anchor integration contract for the next implementation

For a selected wallet-to-anchor off-ramp, evaluate SEP-24 hosted deposit/withdrawal and authentication via SEP-10, with SEP-12 customer exchange when supported/needed. SEP-31 is a separate cross-border payment interoperability flow, not a substitute for verifying that a particular anchor supports your use case. Stellar standards do not grant licences or guarantee EUR/Portugal/bank coverage.

Before adding a live adapter, obtain the provider agreement, exact asset code+issuer/network, payout countries/currencies/beneficiary types, banking rails, KYC and Travel Rule responsibility as applicable, liquidity, fees, quotes/expiry, refund/cancellation policy and settlement SLAs. Verify every capability with the selected provider. A cash-out of existing stablecoins is different from selling an illiquid RWA token; no guaranteed exit or valuation-based redemption is provided.

Implement wallet-bound customer IDs, verified discovery and server auth, quote-bound amount/fee/FX limits, approved destination references, stable provider idempotency IDs, signed webhook verification (where the provider specifies it), event dedupe and order handling, polling reconciliation, ledger transaction confirmation, bank-settlement evidence and operational dispute handling. Never mark bank fiat paid merely because a Stellar transfer succeeded. Reconcile unknown outcomes against authoritative provider and ledger records; do not rebuild/resend on a timeout.

## Dependency order

1. Now: run offline demo and tests; inspect the code and the test-only API boundaries.
2. Choose one asset/rights model and pilot audience; counsel signs off on classification and documents. No implied licence or legal advice from this bundle.
3. Contract real identity/payment/custody/valuation providers and confirm exact scope; design authenticated wallet ownership and trusted ingestion/webhooks.
4. Replace JSON with transactional storage/outbox, distinct real-person approval identities, key management, observability, backup and independent audit; integrate campaign and contract gates.
5. Test provider sandboxes and Stellar testnet end to end, then security review and incident drills. Only a separately approved controlled live pilot after legal/provider approvals.
6. Expand country by country. EU notification/passport procedures, where available and applicable, do not grant global distribution, securities, consumer, AML, tax or payment permissions. No worldwide launch switch.

No schedule or provider price is promised while these choices remain open.

## Primary sources checked 29 October 2026

- ECSPR, Regulation 2020/1503: scope, SPV restrictions, investor protection and payment separation. https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX%3A32020R1503
- ESMA ECSPR aggregate threshold explanation: https://www.esma.europa.eu/publications-data/questions-answers/2437
- MiCA Regulation 2023/1114, financial-instrument exclusion and token categories: https://eur-lex.europa.eu/eli/reg/2023/1114/oj/eng
- ESMA classification guidelines (2025): https://www.esma.europa.eu/sites/default/files/2025-03/ESMA75453128700-1323_Guidelines_on_the_conditions_and_criteria_for_the_qualification_of_CAs_as_FIs.pdf
- Banco de Portugal crypto-asset FAQ: https://www.bportugal.pt/page/perguntas-frequentes-de-criptoativos
- Portugal Lei 69/2025, supervisory roles and transition: https://diariodarepublica.pt/dr/detalhe/lei/69-2025-992098939
- CMVM Regulation 2/2025, project reporting: https://diariodarepublica.pt/dr/detalhe/regulamento-cmvm/2-2025-914768735
- Stellar oracles, scope of external data: https://developers.stellar.org/docs/data/oracles
- Stellar SEP-24: https://developers.stellar.org/docs/platforms/anchor-platform/sep-guide/sep24
- Stellar SEP-31: https://developers.stellar.org/docs/platforms/anchor-platform/sep-guide/sep31
- Stellar SEP-10: https://developers.stellar.org/docs/platforms/anchor-platform/sep-guide/sep10
- Stellar SEP-12 KYC API: https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md

These sources ground architecture and review questions, not a legal opinion or a provider recommendation.
