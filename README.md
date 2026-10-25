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

## Demo limpa (reset + faucet)

Para recomeçar do zero antes de uma demo (por exemplo, depois de um E2E completo em que os
investidores demo gastaram os seus USDC na campanha anterior):

1. `cd backend && npm run reset` — apaga `data/campaigns.json` e `.demo-investors.json`.
2. `npm run setup` — garante a conta da plataforma, adiciona a trustline USDC e pede USDC ao
   Sozu Faucet (plataforma + 1 investidor demo). Se o claim automático falhar porque a
   plataforma já reclamou antes, pede USDC manualmente no Sozu Faucet com a publicKey da
   plataforma.
3. `npm run demo` — corre o E2E determinístico: seed 60+30+10 USDC (3 investidores), cria
   campanha, investe, finaliza e paga o criador.

Notas:

- A conta da plataforma é persistente (`backend/.env` → `PLATFORM_SECRET`); o reset só apaga
  campanhas e contas demo.
- Após um E2E completo a plataforma fica com ~40 USDC, por isso o passo 2 é obrigatório antes
  de nova demo.
- Todas as transações do demo são verificáveis no stellar.expert (testnet).
