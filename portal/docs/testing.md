# Testing

The project is verified at three levels, all enforced in CI on every change.

## Backend and frontend

Unit and integration tests run under Vitest:

```bash
cd backend && npm test
cd frontend && npm test
```

The suites cover API behavior, contribution lifecycle, reconciliation, and
UI logic.

## Smart contract

The Soroban contract has its own Rust test suite:

```bash
cd contracts/crowdfund && cargo test
```

## End-to-end checks

Scripted end-to-end flows exercise the real testnet deployment, including
wallet trustline setup and contribution submission.

## Continuous integration

GitHub Actions runs the backend, frontend and contract suites plus the
contract build on every push and pull request.
