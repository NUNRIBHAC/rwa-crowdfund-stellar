---
slug: /
sidebar_position: 1
---

# Internal documentation

Internal technical and operational documentation for the Blockallisto
project. This build contains everything on the public portal plus the
internal pages under **Internal** in the navbar.

**Audience:** project owner and invited operators only. Access is enforced
server-side (see `deployment-internal.md`); this build must never be served
publicly.

**Rules:**

- No secrets in docs. Keys, tokens and passwords live in the vault or in
  hosting environment variables - never in these pages or in the repo.
- Describe procedures and configuration; reference where the secret lives,
  not its value.
- Feature state moves fast: each page notes its source and date. Check the
  repo before relying on details.

Source basis: repo snapshot 2026-11-02 (branch `feature/community-platform`
@ `0447287`, main @ PR53+) plus direct reads of `main`.
