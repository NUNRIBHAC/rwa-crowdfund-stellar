# RWA Crowdfund — Stellar

Plataforma de crowdfunding de RWA (real world assets) tokenizada na rede Stellar.
Build para o HackMeridian 2026 — Genesis, track **Stellar Unlocked**.

## Problema

Projetos do mundo real (energia, infraestrutura, imobiliário) precisam de financiamento
antecipado, mas o caminho tradicional é lento, opaco e sem liquidez para o pequeno investidor.
A tokenização de RWA resolve isso: cada contribuição vira um ativo digital transferível e
verificável. Este MVP prova o circuito completo em Testnet com as capacidades nativas do
protocolo Stellar — sem depender de contratos Soroban no caminho crítico.

## O que faz (MVP)

- Criação de campanhas de financiamento com meta em USDC (testnet)
- Investimento com a tua carteira Freighter (`@stellar/freighter-api`) ou contas demo
- Custódia dos fundos em escrow (conta da plataforma) até a meta ser atingida
- Emissão de tokens RWA transferíveis por campanha, usando a emissão nativa de ativos do
  protocolo (asset issuance clássico + trustlines): cada campanha tem o seu ativo `RWA00X`,
  com supply emitido para a conta da plataforma e distribuído aos investidores
- `finalize` paga o criador quando a meta é atingida; `refund` devolve os USDC aos investidores
  caso a campanha não prossiga

## Track: Stellar Unlocked

O que esta build extrai do protocolo Stellar:

- **Asset issuance clássico**: cada campanha cria um ativo `RWA00X` com a conta da plataforma
  como emissora e autoridade de controlo. Os investidores criam trustlines para o ativo e
  recebem tokens transferíveis.
- **Escrow em conta Stellar**: os USDC ficam numa conta da plataforma (não num contrato
  complexo) até finalize/refund; o movimento é público e verificável em Horizon / stellar.expert.
- **Integração criptográfica de carteiras**: assinatura de transações no browser com
  `@stellar/freighter-api` sobre o fluxo build/submit do backend (o browser nunca expõe a
  secret key).

## Stack

- Backend: Node/TS, Express 5, `@stellar/stellar-sdk` v17, Horizon testnet, zod
- Frontend: React + Vite, `@stellar/freighter-api`
- Rede: Stellar Testnet (Horizon `https://horizon-testnet.stellar.org`), USDC testnet do
  Circle (SAC), faucet Sozu

Sem contrato Soroban no caminho crítico: tudo é feito com operações clássicas do protocolo.

## Arquitetura

```
frontend (React + Freighter)               backend (Express + stellar-sdk)
        │                                          │
        │ 1. POST /api/campaigns/:id/invest/build  │
        │    { investorPub, amountUsdc } ─────────►│ valida: campanha funding, montante > 0,
        │                                          │   garante conta do investidor
        │ 2. XDR não assinado ◄────────────────────│ build: changeTrust USDC (se falta),
        │    (changeTrust USDC + changeTrust RWA   │   changeTrust RWA,
        │     + payment USDC → escrow plataforma)  │   payment USDC → plataforma (escrow)
        │ 3. signTransaction (Freighter)           │
        │ 4. POST /api/campaigns/:id/invest/submit │
        │    { investorPub, xdr } ────────────────►│ verifica tx.source == investorPub,
        │                                          │   extrai montante real do pagamento
        │                                          │   (não confia no input), submete
        │ 5. resposta com investimento ◄───────────│ entrega tokens RWA (payment do emissor),
        │                                          │   regista em backend/data/campaigns.json
```

Contas e ativos:

- **Plataforma / escrow / emissor RWA**: `GDYY4VT5DI5QGBXBKJRCZGCEFJWEJNGTBLSFJF355Z53MI5QAHNJYUO7`
  (secret em `backend/.env` → `PLATFORM_SECRET`)
- **USDC testnet (Circle SAC)**: issuer `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`
- **Investidores demo** (seed determinístico do demo):
  `GDPYRC7RTC2ZY3XUYIPHPO76QX34WJ4SNOTHK2ZGPVXECZ5FTNCBLE7L`,
  `GB5UJ2F5RBQEA5DIXNJCLADGAQNXD3D2H35GXD6EX2KHZ6FM7BODURNN`,
  `GBU5RMFCUEBOEQNAW547CA5SQZ4N5YROOMPLZVLNTWUU7EWGDLFRDI6U`
- **Sem Soroban contract IDs, sem anchors, sem oracles** no MVP: são next steps (ver roadmap)

## Evidência no Testnet (2026-10-26, campanha RWA005)

Fluxo completo build/submit — o mesmo que o Freighter executa — com 3 investidores,
goal 40 USDC, supply 1000 tokens, já finalizada:

| Passo | Tx hash | Explorer (testnet) |
|---|---|---|
| Mint do supply RWA005 (escrow na plataforma) | `78038fdbf068d0b636b1f8cf4e29816ca5e7124d422abb7e50ce5623867a3235` | https://stellar.expert/explorer/testnet/tx/78038fdbf068d0b636b1f8cf4e29816ca5e7124d422abb7e50ce5623867a3235 |
| Investimento 1: 20 USDC → 500 tokens | USDC `0a6575bb97b547f993acbbcd76e24b9ce2efdd952a4b89aa458159438b4cd33c` / tokens `20ad1fe5d47a889c9cba3b6599974dc4cf786f687b799adf648cc6b9288c24bb` | https://stellar.expert/explorer/testnet/tx/0a6575bb97b547f993acbbcd76e24b9ce2efdd952a4b89aa458159438b4cd33c |
| Investimento 2: 12 USDC → 300 tokens | USDC `42b678e6448f28d49e34ce0a8fb32ff5e5609a1339a1ab3371176c5ade751c58` / tokens `69b12b0f3c7c2269727216ee8978e89ec5da0dc833814811996fddf49a5fa9b6` | https://stellar.expert/explorer/testnet/tx/42b678e6448f28d49e34ce0a8fb32ff5e5609a1339a1ab3371176c5ade751c58 |
| Investimento 3: 8 USDC → 200 tokens | USDC `bcc46b62da7761e55fdbba333748181149ec1d7a67ce99c5a9353ac1afa8bb96` / tokens `43fb367f63126f2deb591aae9132081cbfae93f44d77ecd3dc64ea327bd71b7c` | https://stellar.expert/explorer/testnet/tx/bcc46b62da7761e55fdbba333748181149ec1d7a67ce99c5a9353ac1afa8bb96 |
| Finalize: payout 40 USDC ao criador | `803d20ceba1253d73f65d4db6d3ecba30e2fd15504d1607a32df4799d7f4a2fc` | https://stellar.expert/explorer/testnet/tx/803d20ceba1253d73f65d4db6d3ecba30e2fd15504d1607a32df4799d7f4a2fc |

Saldos finais verificados: investidores com RWA005 500/300/200; plataforma 105 USDC e controlo
do supply; criador com 390 USDC.

## Setup

Requisitos: Node 20+, uma conta Stellar testnet e a extensão Freighter para o fluxo real.

```bash
npm install
cp backend/.env.example backend/.env   # preencher (ver tabela abaixo)
npm run setup                          # contas + USDC testnet + asset RWA
npm run dev:backend                    # API em http://localhost:4000
npm run dev:frontend                   # app em http://localhost:5173
```

### Variáveis de ambiente (`backend/.env`)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `STELLAR_NETWORK` | sim | `testnet` (único suportado neste MVP) |
| `HORIZON_URL` | não | por omissão `https://horizon-testnet.stellar.org` |
| `RPC_URL` | não | por omissão `https://soroban-testnet.stellar.org` |
| `USDC_ISSUER` | sim | issuer do USDC testnet Circle SAC: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` |
| `SOZU_FAUCET_URL` | não | por omissão `https://faucet.sozu.capital` |
| `PLATFORM_SECRET` | sim | secret key da conta da plataforma/escrow (testnet only) |
| `PORT` | não | porta da API, por omissão `4000` |

Gerar `PLATFORM_SECRET` com:
`node -e "console.log(require('@stellar/stellar-sdk').Keypair.random().secret())"`

## Demo limpa (reset + faucet)

Para recomeçar do zero antes de uma demo (por exemplo, depois de um E2E completo em que os
investidores demo gastaram os seus USDC):

1. `cd backend && npm run reset` — apaga `backend/data/campaigns.json` e `.demo-investors.json`.
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
- Todas as transações são verificáveis no stellar.expert (testnet).

## API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | estado da API e rede |
| GET | `/api/campaigns` | lista campanhas |
| POST | `/api/campaigns` | cria campanha |
| POST | `/api/campaigns/:id/invest` | investimento demo (backend assina) |
| POST | `/api/campaigns/:id/invest/build` | constrói XDR para assinatura Freighter |
| POST | `/api/campaigns/:id/invest/submit` | submete XDR assinado e entrega tokens |
| POST | `/api/campaigns/:id/finalize` | finaliza e paga o criador |
| POST | `/api/campaigns/:id/refund` | reembolsa investidores |
| GET | `/api/demo/investors` | lista investidores demo |
| POST | `/api/demo/seed-investors` | seed dos investidores demo |
| GET | `/api/demo/wallet/:pub` | saldos de uma conta |
| POST | `/api/wallet/trustline/build` | XDR de trustline USDC (Freighter) |
| POST | `/api/wallet/trustline/submit` | submete trustline assinada |

## Limitações reconhecidas (demo) e next steps

Este MVP é deliberadamente simples; as decisões abaixo são simplificações de demo e os
respetivos next steps:

1. **Autorização de finalize/refund**: hoje qualquer pessoa pode chamar `/finalize` e `/refund`
   (e a UI expõe os botões). Na prática deve haver gate temporal (prazo da campanha,
   all-or-nothing) e autorização (creator/admin/multisig). Next step: contrato Soroban com
   `deadline`, `onlyOwner` e lógica de payout atómico.
2. **Idempotência e corridas**: `invest()` lê o estado e grava depois; duas submissões
   concorrentes podem ultrapassar o goal. Re-submeter o mesmo XDR falha no Horizon
   (`tx_bad_seq`), por isso não duplica, mas a corrida entre investidores diferentes existe.
   Aceitável ao nível de demo. Next step: estado e limite de captação atómicos no contrato.
3. **Consistência pós-USDC**: se a entrega dos tokens falhar depois do pagamento USDC já
   submetido, o registo fica pendente (não deve acontecer no demo). Next step: retry manual/
   compensação, ou operações atómicas no contrato Soroban.
4. **Chaves em plaintext**: `.creator.json`, `.demo-investors.json` e `PLATFORM_SECRET`
   contêm secret keys e são **só para Testnet — nunca usar em mainnet**. Estão protegidos
   pelo `.gitignore`; em produção usar gestor de segredos e multisig.

Roadmap além dos próximos passos acima: KYC/ECSPR e estruturação legal (MiCA/ECSPR),
oracles de valuation dos RWA, mercado secundário dos tokens, governance da plataforma e
integração com anchors para cash out (fiat) — o objetivo é chegar a um contrato Soroban único
que substitua o backend como fonte de verdade para escrow, prazos e autorizações.

## Segurança

- Rede: apenas Testnet; chaves demo em ficheiros protegidos pelo `.gitignore`
- O backend valida o montante a partir das operações do XDR assinado (não confia no input)
- Contas demo têm apenas USDC de faucet, sem valor real

## Links

- Repositório: https://github.com/NUNRIBHAC/rwa-crowdfund-stellar
- Explorer (testnet): https://stellar.expert/explorer/testnet
- Freighter: https://www.freighter.app/
