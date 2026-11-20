# Business continuity

Factual prototype revision: 20 November 2026. Not legal advice or a regulatory approval.

Demo template: this page is an illustrative document for the Blockallisto prototype, not legal advice. It has not been reviewed by a lawyer and it is not evidence of any company registration or regulatory authorisation. Company particulars marked [DEMO] are fictional demonstration data.

**Last updated:** 2026-11-20

This page describes what keeps the Blockallisto prototype available and recoverable, and what continuity planning is intended for a future authorised platform. The first section is factual about the running demo; the second is design intent, not current practice.

## 1. Prototype continuity posture (current)

- **No client assets at risk:** the demo holds no money, no client funds and no custody. Contributions are testnet tokens with no monetary value, settled by a Soroban smart contract on the public Stellar testnet. Contract state lives on the testnet ledger, independent of this website.
- The site and API run on an Oracle Cloud VM with local PostgreSQL 17 for operational data. This shared host is not an availability guarantee.
- An encrypted external backup and isolated database restore proof succeeded on 20 November 2026. This dated check is not a recovery-time guarantee, an automatic retention promise or proof that every external service can be restored.
- **Staging separation:** user-facing demo, a separate staging environment, and disposable database copies are kept apart so testing cannot corrupt the demo.
- **If the demo is unavailable:** no user loses anything of value. Campaign state remains readable on public Stellar testnet explorers, and contributions remain governed by the contract, not by this site.

## 2. Intended continuity plan for an authorised platform (not live)

A real platform handling regulated offers would need, before launch: documented recovery time and recovery point objectives [RTO/RPO values to be set with legal and infrastructure advice]; managed backups with tested restore procedures; a payment-services arrangement in which client funds are never held by the platform, so platform failure cannot strand investor money; an orderly wind-down plan ensuring ongoing campaigns can complete or refund if the platform ceases operating; and communication procedures for incidents affecting users.

None of this is operative today. Publishing it as a template keeps the intended compliance surface visible and reviewable.

## 3. Incident contact

To report a security or availability incident affecting the prototype: blockallisto@gmail.com, subject "Incident".
