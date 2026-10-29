# Crowdfunding market research - 2026-10-29

Prepared to inform the frontend redesign. Two sources requested by the project owner:
the EU registry of crowdfunding platforms, and a directory of tokenised platforms.

## 1. EU registry: ESMA register of ECSPR providers

Under the European Crowdfunding Service Providers Regulation (ECSPR, Regulation
(EU) 2020/1503), every authorised crowdfunding platform in the EU appears in the
ESMA register. Verified live on 2026-10-29 at
https://registers.esma.europa.eu/publication/searchRegister?core=esma_registers_upreg
(entity type "European Crowdfunding Service Provider"): **261 entities** listed,
each with entity name, home member state, host states, competent authority,
authorisation date and status.

EUROCROWD publishes a readable mirror with a voluntary transparency benchmark
(*** established / ** developing / * emerging), based on the same ESMA data
(accessed 2026-01-16, 246 rows):
https://eurocrowd.org/platforms-under-ecspr/

Registry facts are authorisations by national competent authorities; they are not
quality ratings. Any "Regulated" badge in a product UI must come from this kind of
source, not from platform marketing.

## 2. Tokenised platform directory (owner-supplied source)

Owner-supplied URL: https://thecrowdspace.com/directory/tokenized-crowdfunding-platforms/
The directory currently states **35-36 active platforms** worldwide (the Europe-filtered
view at /directory/list-of-tokenized-crowdfunding-platforms-across-europe/ states
**19 active platforms** - the "19 tokenised platforms" figure). 42 distinct platform
cards were captured across the 5 listing pages on 2026-10-29; the difference vs the
stated active count may be inactive listings or dedup - reported, not resolved.

Card-level fields captured for every platform: name, HQ country, countries of
operation, industry tags, offering types, minimum investment, advertised return,
secondary market yes/no, auto-invest yes/no, directory-applied "Regulated" and
"Verified platform" marks. These are directory/platform claims, not verified facts.

| Platform | HQ | Types | Min | Advertised return | Secondary | Regulated mark |
|---|---|---|---|---|---|---|
| 8lends | Switzerland | P2P, Tokenized | 100 USDT | 22.5% | Yes | |
| FF Forest | Latvia | Tokenized | 1,000 USDT | 18% | No | |
| skew.net | Switzerland | P2P, Reward, Tokenized | $200 | 12% | No | Regulated |
| Shipfinex | UAE | Equity, Tokenized | $1,000 | 10% | No | |
| Headway Nova | South Africa | Tokenized | $25 | 16.7% | Yes | Regulated |
| 0xequity | Turkey/USA | Equity, Tokenized | $10 | 7% | No | Regulated |
| Daskapital | Portugal | Equity, Debt, Tokenized | €10 | 9% | Yes | Regulated |
| InvestaX | Singapore | Tokenized | 100 USDT | 4-10% | Yes | Regulated (MAS CMS + RMO per card) |
| Invesdor | Germany | Equity, Debt, Tokenized | €250 | 6% | No | Regulated |
| Bitlauncher | United Kingdom | Tokenized | $150,000 | 4% | No | |
| DealMaker | USA/Canada | Equity, Debt, Reward | $1 | — | No | Regulated |
| FundinFolks | Singapore | Equity, Tokenized | $10,000 | 20% | No | |
| pitchIN | Malaysia | Equity, Tokenized | RM 500 | — | Yes | Regulated |
| Republic | USA | Equity, Tokenized | $50 | 15% | Yes | Regulated |
| Hurst | Brazil | Debt, Tokenized | R$ 10,000 | 21.1% | Yes | Regulated |
| GigaStar Market | USA | Tokenized | $50 | 14% | No | Regulated |
| Fraxtor | Singapore/Australia | Equity, Tokenized, Buy-to-let | S$ 10,000 | 10% | No | Regulated |
| BlocHome | Luxembourg | Tokenized | €1,000 | — | No | |
| Securitize | USA | Tokenized | $1,000 | 10% | Yes | Regulated |
| Tecra Space | Poland | Reward, Tokenized, Donation | 1 USDT | 15% | Yes | |
| arttrade | Germany | Tokenized | €1,000 | 9% | No | Regulated |
| Reental | Spain | Tokenized | €100 | 18% | Yes | |
| BnkToTheFuture | USA/Canada | Equity, Tokenized | $1 | 15% | Yes | |
| MountX | Mexico/Canada | Tokenized | $200 | 15% | No | |
| Alta | Singapore/India | Equity, Debt, Tokenized | $500 | — | Yes | Regulated |
| Coreestate | Denmark | Tokenized | €100 | 10% | No | |
| Metawealth | Ireland | Tokenized | $100 | 20% | Yes | |
| Definder | United Kingdom | Tokenized | $10 | 15% | No | |
| STOKR | Luxembourg | Tokenized | $100 | 15% | No | |
| Atlas One Digital Securities | Canada | Equity, Debt, Tokenized | C$ 1,000 | 14% | No | Regulated |
| Alius Capital | Spain | Equity, Debt, Tokenized | — | — | Yes | Regulated (CNMV-licensed per card) |
| FINEXITY | Germany | Equity, Debt, Tokenized | €500 | 5-10.4% | Yes | Regulated |
| Micro Tuber | Singapore | Tokenized | 1 USDT | — | Yes | |
| Crowd For Angels | United Kingdom | Equity, Debt, Tokenized | £25 | up to 8% p.a. | No | Regulated |
| Rocksolid Estate | Austria | Tokenized | €100 | 12% | No | |
| CONDA Capital | Austria | Equity, Debt, Tokenized | €250 | 7% | No | Regulated |
| RealDeed Proppass | UAE/India | Tokenized | $1,500 | 15% | No | Regulated |
| Infinite Launch | Singapore | Tokenized | 20 USDT | 40% | Yes | Regulated |
| TrustPad | Panama | Equity, Tokenized | 1 USDT | — | Yes | |
| ChainRaise | USA | Equity, Tokenized | $100 | 10% | No | |
| Meta Yield | Panama | Reward, Tokenized | 1 USDT | — | No | |
| Grex | India | Equity, Debt, Tokenized | ₹20,000 | 10% | No | |

Coverage note: all listing cards were captured (all 5 pages). In-depth profile
pages were inspected for a sample (Daskapital, Reental, FINEXITY, BlocHome,
Alius Capital). Individual platform claims (returns, licenses) were not
independently verified beyond the directory cards and profile pages.

## 3. What these platforms do (patterns used in the redesign)

Common product surface across the directory:

- **Fractional, low-minimum entry**: minimums from $1-€100 for retail tokenized
  real estate (Reental €100, Rocksolid €100, Metawealth $100, 0xequity $10);
  higher for institutional/AI-startup deals (Bitlauncher $150k).
- **Campaign cards with raised/goal progress**, advertised return, minimum ticket,
  industry and offering-type tags - the core marketplace pattern.
- **Secondary market badges** (roughly half the list) - liquidity is a headline
  feature where offered. This contract deliberately has none; the UI states
  "nontransferable contribution records" instead of implying liquidity.
- **KYC-verified access and SPV-backed asset structures** (Shipfinex, InvestaX,
  Securitize) - compliance framing up front.
- **Regulated/verified trust marks** from the directory itself - the redesign uses
  an honest "Testnet" badge and links to the ESMA register instead of implying
  regulatory status.
- **All-or-nothing and refund mechanics** appear in ECSPR-style EU platforms;
  here they are enforced atomically by the Soroban contract (contribution + cap
  check + transfer in one transaction), which the redesign explains in plain
  language on every campaign card.

## 4. Frontend redesign (this branch)

Rebuilt `frontend/` as a component-based marketplace UI informed by the patterns
above, preserving the exact Soroban flow contract in docs/soroban-flow.md:
build → wallet sign → submit → status check, persisted signed intent across
reload, NOT_FOUND held (never replaced), no admin key in the active frontend,
empty registry by default with a clearly labeled sample-data preview
(`?fixtures=1` or the preview button), classic routes untouched (410, read-only
legacy admin evidence).

Files: src/{types,api,format,fixtures}.ts, src/components/{Header,Hero,
CampaignCard,IntentPanel,EmptyState,Footer}.tsx, src/styles.css.
