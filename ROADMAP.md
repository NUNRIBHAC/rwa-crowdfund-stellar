# Roadmap

29 October 2026. Status and dependency order for taking this testnet demo
toward a regulated tokenized crowdfunding platform. No schedule, licence,
provider capability or legal classification is promised. Read
`IMPLEMENTATION.md` for the full boundaries and primary sources.

## Done in this branch

- Backend hardening fixes: admin-key protection for money-moving routes,
  deadline/goal checks, replay and serialisation guards, funding cap,
  persisted transaction intents, pending-delivery recovery and verified
  single-use token returns. See README "Known limitations (demo)".
- Test-only infrastructure API (`backend/src/infrastructure`, port 4100):
  simulated identity review, Ed25519-signed valuation ingestion, role-based
  governance with independent approvals, and a durable mock cash-out
  workflow. It cannot approve real users, value real assets or move money.
- Soroban prototype (`contracts/crowdfund`): all-or-nothing campaign,
  capped contributions, after-deadline settlement, nontransferable balance
  records, 19 local tests and a Wasm build. No legal rights are defined and
  deploy-time authorisation is unverified.

None of these are wired into the campaign flow or frontend yet. That
separation is deliberate: a simulated identity must never unlock a real
investment or cash-out.

## Next, in dependency order

1. Choose one asset class, economic-rights model and pilot audience;
   counsel signs off on classification (ECSPR/MiCA/PT law) and documents.
2. Contract real identity, valuation, custody and payment/anchor providers;
   design authenticated wallet ownership and trusted ingestion.
3. Replace JSON storage with transactional storage/outbox, real-person
   approval identities, key management, observability and independent
   audit; integrate campaign and contract gates.
4. Provider sandboxes and Stellar testnet end-to-end, then security review.
   A controlled live pilot only after legal and provider approvals.
5. Expand country by country. EU passporting, where applicable, is not
   global distribution permission.

## Per workstream

- **KYC / legal structuring (ECSPR, MiCA, PT):** counsel and authorisation
  work, not code. Code can only enforce gates once classifications and
  providers exist. See IMPLEMENTATION.md "Legal and provider work".
- **RWA valuation oracles:** signed-ingestion contract exists; a real
  oracle needs chosen appraisers, cadence per asset class and, later,
  on-chain publication design.
- **Platform governance:** server-side roles/approvals exist; production
  needs legally appointed people, corporate authority and, if desired,
  on-chain multisig.
- **Anchor / fiat cash-out:** durable workflow and mock adapter exist; a
  live adapter needs a selected anchor (evaluate SEP-24/SEP-10/SEP-12),
  provider agreement and verified corridor capabilities. See
  IMPLEMENTATION.md "Anchor integration contract".
