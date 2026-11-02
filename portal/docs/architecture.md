# Architecture

The platform has four main components.

## Frontend

A single-page React + TypeScript application (Vite build). It serves the
public site, the investment browsing experience, campaign pages, and the
account area. The interface is localized into multiple languages, with
translation strings managed outside the codebase.

## Backend API

A Node.js + TypeScript service that keeps the off-chain journal (PostgreSQL),
serves campaign metadata, and reconciles on-chain events with platform
records. It never holds user keys: every wallet action is signed by the user.

## Smart contract

A Soroban contract written in Rust enforces campaign funding rules on the
Stellar network: contribution caps, the all-or-nothing goal, and payout
timing. See [Smart contract](./smart-contract).

## Wallet

[Freighter](https://www.freighter.app) connects the browser to Stellar. The
frontend uses it in two ways: to sign investment transactions, and to sign a
one-time challenge that logs the user into the account area (optionally
protected by an authenticator-app second factor). Private keys never leave
the wallet.

## Environments

Two deployments exist: a public **demo** environment and a **staging**
environment used for realistic testing before changes ship. Both track the
same repository on the Stellar testnet.
