# Architecture and data-flow diagrams

These diagrams render with the Mermaid theme (see the portal config change in
this package). They are text, so they diff in pull requests instead of rotting
in a drawing tool. Sources of truth: backend/src, contracts/crowdfund, and the
observed hosting inventory (2 Nov 2026).

## Component map

```mermaid
flowchart LR
    subgraph User side
        Browser[Web app - React/Vite]
        Freighter[Freighter wallet]
    end

    subgraph Render free tier
        Demo[Demo backend - blockallisto-demo]
        Staging[Staging backend - rwa-crowdfund-staging]
        PublicDocs[Public docs portal - static site]
    end

    subgraph Neon Postgres
        DemoDB[(Demo journal DB)]
        StagingDB[(Staging journal DB)]
    end

    subgraph Oracle Always Free VM
        Weblate[Weblate - translations]
        Kuma[Uptime Kuma]
        Bitwarden[Bitwarden]
        PrivateDocs[Private docs portal - basic auth]
        Backup[Nightly encrypted backup job]
        Snapshot[30-min event archive snapshot job]
    end

    subgraph Stellar testnet
        Contract[Crowdfund contract - one per campaign]
        Horizon[Stellar RPC/Horizon]
    end

    subgraph Oracle Cloud
        ONS[ONS email topic to nunrib@sapo.pt]
        ObjStore[(Encrypted object-storage backups)]
    end

    Browser --> Demo
    Browser --> Staging
    Freighter <--> Browser
    Demo --> DemoDB
    Staging --> StagingDB
    Demo --> Horizon
    Staging --> Horizon
    Horizon --> Contract
    Backup --> ObjStore
    Backup --> ONS
    Backup --> DemoDB
    Backup --> StagingDB
    Kuma --> Weblate
```

## Contribution flow: prepare, sign, submit

```mermaid
sequenceDiagram
    participant U as Contributor browser
    participant B as Backend API
    participant F as Freighter wallet
    participant S as Stellar testnet

    U->>B: POST /api/campaigns/:id/soroban/build
    B-->>U: unsigned transaction XDR
    U->>F: sign transaction
    F-->>U: signed XDR
    U->>B: POST /api/campaigns/:id/soroban/submit
    B->>S: submit transaction
    S-->>B: result
    B->>B: journal contribution (pending until confirmed)
    B-->>U: confirmation state
    Note over B,S: GET /api/soroban/transactions/:hash polls status
    Note over B,S: POST /api/soroban/recover re-syncs after interruption
```

## Translations, CI and deploy pipeline

```mermaid
flowchart TD
    Dev[Push to main]
    CI[GitHub Actions CI]
    Gitleaks[Gitleaks history + tree scan]
    JS[JS job: lint, format, tests, coverage gates, npm audit]
    Rust[Soroban job: cargo test, cargo audit, contract build, Wasm fixture check]
    RenderDemo[Render auto-deploy demo/staging]
    Weblate[Weblate pulls repo strings]
    I18nCheck[i18n JSON projection check in CI]
    PublicDocs[Public docs auto-deploy on Render]
    PrivateDocs[Private docs rsynced to Oracle VM]

    Dev --> CI
    CI --> Gitleaks
    CI --> JS
    CI --> Rust
    CI --> RenderDemo
    CI --> PublicDocs
    Weblate --> I18nCheck
    CI --> PrivateDocs
```
