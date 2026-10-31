<!--
DRAFT v0.1 (2026-10-31) - FOR REVIEW ONLY. Delete this comment block before publishing.
Prepared as an honest prototype-stage template. It is not legal advice and has not
been reviewed by a lawyer. Placeholders in [square brackets] must be filled before
publication. Business continuity planning is an ECSPR-style compliance surface and
only becomes obligatory for an authorised platform; this document describes the
prototype's real continuity posture plus the intended future plan. A qualified
lawyer should review before any real (mainnet) launch.
-->

# Business Continuity

**Last updated:** [date to be set on publication]

This page describes what keeps the Blockallisto prototype available and recoverable, and what continuity planning is intended for a future authorised platform. The first section is factual about the running demo; the second is design intent, not current practice.

## 1. Prototype continuity posture (current)

- **No client assets at risk:** the demo holds no money, no client funds and no custody. Contributions are testnet tokens with no monetary value, settled by a Soroban smart contract on the public Stellar testnet. Contract state lives on the testnet ledger, independent of this website.
- **Hosting:** the site and API run on Render's free tier; operational data (transaction journal, community data) lives in a Neon Postgres database on its free tier. Both are third-party services with their own availability properties; no uptime is guaranteed for the demo.
- **Backups:** [backup schedule and retention to be defined - the free tiers provide no managed backups; testnet contract state is recoverable from the public ledger].
- **Staging separation:** user-facing demo, a separate staging environment, and disposable database copies are kept apart so testing cannot corrupt the demo.
- **If the demo is unavailable:** no user loses anything of value. Campaign state remains readable on public Stellar testnet explorers, and contributions remain governed by the contract, not by this site.

## 2. Intended continuity plan for an authorised platform (not live)

A real platform handling regulated offers would need, before launch: documented recovery time and recovery point objectives [RTO/RPO values to be set with legal and infrastructure advice]; managed backups with tested restore procedures; a payment-services arrangement in which client funds are never held by the platform, so platform failure cannot strand investor money; an orderly wind-down plan ensuring ongoing campaigns can complete or refund if the platform ceases operating; and communication procedures for incidents affecting users.

None of this is operative today. Publishing it as a template keeps the intended compliance surface visible and reviewable.

## 3. Incident contact

To report a security or availability incident affecting the prototype: blockallisto@gmail.com, subject "Incident".
