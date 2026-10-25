# RWA Crowdfund — Stellar

Plataforma de crowdfunding de RWA (real world assets) tokenizada na rede Stellar.
Build para o HackMeridian 2026 — Genesis, track **Stellar Unlocked**.

## O que faz (MVP)

- Criação de campanhas de financiamento com meta em USDC (testnet)
- Investimento com a tua carteira Freighter
- Custódia dos fundos em escrow (conta da plataforma) até a meta ser atingida
- Emissão de tokens RWA transferíveis por campanha, usando a emissão nativa de ativos do protocolo (asset issuance clássico + trustlines)
- Refund dos investidores se a meta não for atingida

Stack: sem contrato Soroban no caminho crítico. Tudo com operações clássicas do protocolo
orquestradas por Node/TS + `@stellar/stellar-sdk`, e assinatura no browser com
`@stellar/freighter-api`.

## Estrutura

```
rwa-crowdfund-stellar/
├── backend/        # API Express (Node/TS + @stellar/stellar-sdk + Horizon)
└── frontend/       # App React/Vite + Freighter
```

## Setup

```bash
npm install
cp backend/.env.example backend/.env   # preencher (ver .env.example)
npm run setup                          # contas + USDC testnet + asset RWA
npm run dev:backend                    # API em http://localhost:4000
npm run dev:frontend                   # app em http://localhost:5173
```
