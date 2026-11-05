# Deployment

## Environments

- **Demo** - the public testnet deployment at
  [demo.92-5-187-71.sslip.io](https://demo.92-5-187-71.sslip.io).
  This is the canonical, user-facing prototype.
- **Staging** - a separate environment with its own database and testnet
  contract, used for load testing and validating changes before they reach
  the demo.

Both environments build and deploy automatically from the repository.

## Stack

The frontend and backend run on managed cloud hosting with a managed
PostgreSQL database. The smart contract is deployed to the Stellar
testnet.

:::note
Infrastructure details, credentials and operational runbooks are maintained
privately by the project and are not part of this portal.
:::
