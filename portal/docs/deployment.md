# Deployment

## Environments

- **Demo** - the public testnet deployment at
  [demo.92-5-187-71.sslip.io](https://demo.92-5-187-71.sslip.io).
  This is the canonical, user-facing prototype.
- **Staging** - a separate environment with its own database and testnet
  contract, used for load testing and validating changes before they reach
  the demo.

Neither environment deploys automatically. A merge to `main` does not deploy
either environment; release is a separate, reviewed operator step.

## Stack

The frontend and backend run in separate demo and staging containers on an
Oracle Cloud VM. Each environment uses its own local PostgreSQL database.
The smart contract runs on the Stellar testnet. This hosting description was
verified on 19 November 2026.

:::note
Infrastructure details, credentials and operational runbooks are maintained
privately by the project and are not part of this portal.
:::
