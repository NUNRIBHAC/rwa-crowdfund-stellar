---
sidebar_position: 5
---

# API reference

Blockallisto exposes a REST API for the platform: authentication, campaigns,
investments, companies, comments, notifications and support. The
machine-readable contract is the OpenAPI 3.0 document
[openapi.yaml](pathname:///openapi.yaml).

Status: DRAFT v0.2.0. Paths, HTTP methods and authentication requirements are
verified against the backend source. Request and response schemas are still
generic and will be tightened in a later revision; treat schema detail as the
next iteration, not settled truth.

## Base URLs

- Demo (public testnet app):
  [demo.92-5-187-71.sslip.io](https://demo.92-5-187-71.sslip.io)
- Staging (load and realistic tests):
  [staging.92-5-187-71.sslip.io](https://staging.92-5-187-71.sslip.io)

Everything runs on the Stellar testnet with test assets. No real money is
involved.

## Authentication

Most endpoints need a session token, sent as `Authorization: Bearer <token>`.
The primary flow is wallet-based:

1. `POST /api/auth/challenge` returns a challenge for a Stellar address.
2. Sign the challenge with the wallet and call `POST /api/auth/verify` to
   receive the session token.

Alternatives: email registration and login under `/api/auth/email/*`, social
sign-in under `/api/auth/social/*`, and optional TOTP two-factor under
`/api/auth/totp/*`.

A small number of content-management endpoints (for example publishing
campaign news) additionally require the `x-admin-key` header.

## Notes

- Unknown endpoints return a generic 404.
- This public copy omits platform-administration and internal test-only
  endpoints.
- Unknown fields and error responses fail closed with a `4XX` client error.
