# Security Policy

## Scope

This repository is a Stellar **testnet** demonstration. It is not production
software and does not custody real funds. Findings about the deployed demo,
the API, the Soroban contract or the journal/rate-limit safeguards are all in
scope; please note in your report whether you reproduced an issue against the
code or only reasoned about it.

## Reporting

Report vulnerabilities privately through GitHub's "Report a vulnerability"
flow on the Security tab of this repository when it is available. Otherwise
email the repository owner at the commit-author address (nunrib@sapo.pt).

Please do not open public issues for unpatched security findings. There is no
bug bounty. Reports are triaged on a best-effort basis; include steps to
reproduce and the commit you tested against.

## Expectations

- Testnet-only safeguards (rate limits, admin gates) are demo-grade by design;
  reports that assume production requirements should say so explicitly.
- The signed-intent journal treats signed envelopes as bearer instruments;
  reports involving direct database write access should distinguish
  hardening gaps from API-reachable exploits.
