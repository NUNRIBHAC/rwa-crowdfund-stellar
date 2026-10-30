# Investment crowdfunding platforms by country - world excluding the EU and the US

Compiled 30 October 2026. Synthesis of register-level research across official regulators, plus labelled secondary sources where no register could be read. Scope: platforms for investment crowdfunding (equity/securities, debt/loan/P2P, real-estate). EU member states and the US are covered in separate tables. Donation- and rewards-only platforms are excluded. Tokenised RWA platforms are out of scope. Research only, not legal advice.

## How to read this

- A register or licence entry shows a firm is authorised, registered or listed. It does **not** show the firm is trading, solvent, or a good counterparty. No "active platform" count is claimed anywhere in this file.
- **status_class** (CSV column) is a coarse bucket derived from the verbatim status: `registered_or_listed__trading_unverified`, `status_blank_in_register`, `listed_not_operating`, `experimental_permit_or_sandbox`, `pending_or_not_granted`, `unverified_secondary_source` (company, press or third-party claim not confirmed on an official register), `suspended`, `cancelled_withdrawn_ceased_or_historical`.
- **record_role** marks register history: where an entity has several dated entries (e.g. cancelled, then re-registered), the latest dated one is "latest register entry" and earlier ones "earlier register entry - superseded".
- Counts are **entity/category records**, not unique platforms: some firms hold equity and P2P permissions (counted in each category), and some registers carry history rows.
- "No platform found" / "No licensed platform verified" means none was found in the sources checked. It is not proof none exists.
- Sources are per country below and per row in the CSV (`crowdfunding-platforms-world-excl-eu-us-2026-10-30.csv`, 832 records, one source per row).

## Country coverage index

Every country with a dedicated regime, a general-securities-framework application, or an open regulatory question found in this research. Countries where no dedicated regime was found are listed at the end of the Africa section; their absence from the platform tables is not a zero-platform claim.

### Americas (excluding the US)

| Country                                                                                                                                                                                                                          | Region   | Extraction level                                       | Result                                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brazil                                                                                                                                                                                                                           | Americas | Official register, fully extracted                     | CVM open data: 156 register entries = 151 unique CNPJs (5 status-history duplicates, e.g. Platta cancelled then re-registered 2026-05-13). Entry statuses: 89 operating, 48 cancelled, 9 under analysis, 7 not granted, 3 blank                                                                             |
| Mexico                                                                                                                                                                                                                           | Americas | Official list, fully extracted                         | 21 Instituciones de Financiamiento Colectivo (CNBV); brands not on list                                                                                                                                                                                                                                     |
| Canada                                                                                                                                                                                                                           | Americas | Official AMF/MB/NB lists plus aggregator, deduplicated | 12 portals/dealers on official AMF/Manitoba/NB lists (and aggregator), 4 holding exemption but not operating, 3 named only by NB/QC. BCSC, Alberta, Saskatchewan and OSC give no list. CSA National Registration Search is CAPTCHA-protected (not bypassed), so individual registrations not verified there |
| Chile                                                                                                                                                                                                                            | Americas | Official register queried (UI and live query)          | 0 platforms authorised (266 entries, all statuses)                                                                                                                                                                                                                                                          |
| Peru                                                                                                                                                                                                                             | Americas | Official SMV directory, browser-read                   | 3 societies listed: Inversiones.io, Prestopolis, Securite; discrepancy with press count noted                                                                                                                                                                                                               |
| Colombia                                                                                                                                                                                                                         | Americas | Partial                                                | a2censo (BVC) confirmed; no SFC platform list found                                                                                                                                                                                                                                                         |
| Uruguay                                                                                                                                                                                                                          | Americas | Press                                                  | Crowder (BCU authorised Jan 2024); BCU page lists issuers only                                                                                                                                                                                                                                              |
| Argentina                                                                                                                                                                                                                        | Americas | Blocked                                                | CNV search is name-only behind reCAPTCHA (not bypassed). ProBolsa self-reports PFC Registro 1; full register not extracted                                                                                                                                                                                  |
| Paraguay, Dominican Republic, Ecuador, Bahamas, Costa Rica, Panama, Eastern Caribbean, Barbados, Bolivia, Guatemala, Honduras/Nicaragua/El Salvador, Jamaica, Trinidad and Tobago, Belize/Guyana/Suriname/Haiti, Venezuela, Cuba | Americas | Bounded search, mostly none found                      | Ecuador: one self-reported platform. Bahamas: ArawakX is historical (SCB liquidation petition 2023), none currently licensed found in SIA registrants PDF. Venezuela: one unverified press initiative. Others: regime/bill only or nothing                                                                  |

### Europe (non-EU)

| Country                                                                                                                                                                 | Region | Extraction level                               | Result                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| United Kingdom                                                                                                                                                          | Europe | FCA register (browser) plus FCA FOI list (P2P) | FCA firm pages opened for all 15 named operators (status field read): 11 Authorised, 1 Authorised-applied to cancel, 3 no longer authorised; 45 P2P permission holders plus 16 named cancelled                   |
| Russia                                                                                                                                                                  | Europe | Official Bank of Russia xlsx                   | 102 active, 36 removed operators; banks/registrars flagged, platform brands not verified                                                                                                                         |
| Switzerland                                                                                                                                                             | Europe | Academic monitor; no register                  | 15 platform names with 2025 activity. No dedicated crowdfunding platform category or register (per FINMA factsheet, undated); FINMA licence status per platform NOT checked                                      |
| Isle of Man                                                                                                                                                             | Europe | Official FSA register queried                  | 0 records under Crowdfunding Platforms (current and former)                                                                                                                                                      |
| Armenia                                                                                                                                                                 | Europe | Press                                          | ARFI (Nov 2022), status unverified                                                                                                                                                                               |
| Moldova                                                                                                                                                                 | Europe | Regulator news                                 | Fagura Capital SRL                                                                                                                                                                                               |
| Norway, Iceland, Liechtenstein, Andorra, Kosovo, Jersey, Gibraltar, Georgia, Ukraine, Serbia, Albania, Bosnia, Montenegro, North Macedonia, San Marino, Monaco, Belarus | Europe | Bounded search, none found                     | One row each; no domestic authorised provider list found. Norway/Iceland: served by EU-home passported ECSPs (covered in the EU table). Monaco and Belarus have a named, unverified entity. Unresolved, not zero |

### Asia-Pacific

| Jurisdiction      | Extraction                                                                | Limit                                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Australia         | 8 equity CSF licensees                                                    | Full October ASIC CSV filtered on explicit CSF permission. Current activity untested; Equitise absent.                                                                               |
| Bhutan            | 1 identified equity platform                                              | RSEB operator confirms RMA licence. Not an exhaustive licence register.                                                                                                              |
| China             | No provider list supplied                                                 | Restricted/P2P closure category in prior regulatory map; no active licensed investment-CF list established in this research.                                                         |
| Fiji              | No licensed operator verified                                             | 2025 regime in force, but Jan2026 government RFP seeks first P2P platform; implementation/award unresolved. Do not count donation site Sevu.                                         |
| Hong Kong         | 1 suspended identified platform                                           | AngelHub actual SFC profile says licence suspended for both Type1/4. Not active. Search active-record flag is not licence status.                                                    |
| India             | 28 P2P legal entities                                                     | Full P2P classification extract of RBI NBFC list as of 30 Sep2026. Not equity crowdfunding.                                                                                          |
| Indonesia         | 18 SCF + 94 P2P                                                           | 16 KSEI SCF participants + 2 reconciled OJK licence grants; 94 LPBBTI in Jul2026 directory. Current restrictions/active offers untested.                                             |
| Japan             | 5 equity names on current-linked May2024 JSDA list +2 loan-fund platforms | Current JSDA hub still links five-name May2024 list. Current individual licences unverified. Loan-fund subset non-exhaustive.                                                        |
| Kazakhstan (AIFC) | 4 active-register entries +2 pending commencement                         | 3 active main-register dual CF + InvestRoom active loanCF in FinTech Lab. CapitalLink and Investment Club BRICS+ await commencement approval.                                        |
| Malaysia          | 13 ECF + 20 P2P category entries                                          | Full extraction of current SC digital-initiatives table. Some entities occur in both categories; not 33 unique firms.                                                                |
| New Zealand       | 4 active equity + 8 active P2P; 2 inactive/historical equity              | FMA individual records. Property Crowd suspended, Equitise cancelled. Category header count6 is NOT 6 active.                                                                        |
| Pakistan          | 1 identified P2P platform                                                 | Finja 2023 SECP grant + current operator page. Aug2025 NBFC landing found but PDF not extracted. No exhaustive P2P list.                                                             |
| Philippines       | 3 historical licensed intermediaries identified                           | SEC Dec2023 list. Current secondary-licence search failed twice. Investree wind-down reported, SeedIn current status unresolved. Not3 active.                                        |
| Singapore         | 6 named entities with licence/status qualifications                       | MAS headings verified: CMS entries for all6; Validus lodged cessation. Five other CMS listings do not prove live CF activity; Alta broader private market.                           |
| South Korea       | 4 identified securities-CF operators +46 P2P participants                 | KOFIA2 plus Funding4U/CROWDY operator and government sources. Not complete securities-CF register; KFTC table46 vs47 total. Old guide also names deregistered Korea Asset; excluded. |
| Sri Lanka         | No licensed platform verified                                             | Official 2022 ECF consultation; adoption and a provider register not established.                                                                                                    |
| Taiwan            | 2 operating ECF securities firms                                          | TPEx operating-firm list, not all historical approvals. GISA board separate.                                                                                                         |
| Thailand          | 7 named portals, 6 date-current and1 expired display                      | SEC named list; Trustender approval displayed through1 Sep2026, renewal unresolved. PeerPower expressly equity-only.                                                                 |
| Uzbekistan        | 2 investment-platform sandbox participants                                | Full NAPP special-regime table. Sandbox is not unrestricted licence.                                                                                                                 |
| Vietnam           | No approved P2P provider list verified                                    | Official register not retrieved; Jul2026 report says applications pending. Do not treat operating P2P brands as approved sandbox firms.                                              |

### Middle East

| Country      | Regime (current as read)                                                                                                                                                          | Platform findings                                                                                                                                                                                                                                                                                           |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Turkey       | SPK Communique III-35/A.2                                                                                                                                                         | 18 confirmed (section 1)                                                                                                                                                                                                                                                                                    |
| Israel       | ISA offering coordinators, 2017 regulations (amended 2025)                                                                                                                        | 2 unverified names; register not obtained. **Unresolved on count**                                                                                                                                                                                                                                          |
| UAE          | Federal SCA (Cabinet Res. 36/2022); DIFC; ADGM                                                                                                                                    | DIFC: 6 current + 4 withdrawn confirmed. ADGM: 1 confirmed. Federal: 1 confirmed (status unchecked). Mainland Dubai trade licences (Tathmeer Crowdfunding LLC, Hattword, Eureeca Securities LLC) are not financial licences; Tathmeer claims an SCA approval in July 2025 (LinkedIn posts only), unverified |
| Bahrain      | CBB CFP module (28 Apr 2022 regulations)                                                                                                                                          | Names unverified; the CBB licensing directory (https://www.cbb.gov.bh/licensing-directory/) was tried again and gave no crowdfunding category. **Unresolved**                                                                                                                                               |
| Kuwait       | CMA Module 19; register of securities-based fintech services                                                                                                                      | Almowazi Capital (iMowazi): press says CMA-approved. Lexis summary of CMA Decision 192/2025 concerns registering National Investments Company in the securities-based fintech register (title only, activity not read). **Unresolved**                                                                      |
| Oman         | FSA Decision E/153/2021                                                                                                                                                           | 7 named by the FSA; 1 register entry read; 2 cancelled                                                                                                                                                                                                                                                      |
| Qatar        | QCB Loan-Based Crowdfunding Regulation (Oct 2023); applications opened Dec 2023                                                                                                   | No licensed platform verified. **Unresolved** (no QCB list located)                                                                                                                                                                                                                                         |
| Saudi Arabia | SAMA debt crowdfunding rules; CMA experimental permits                                                                                                                            | SAMA: 14 licensed per SAMA (Nov 2025), 8 named from official releases; CMA: 12 permit holders                                                                                                                                                                                                               |
| Jordan       | CBJ Instruction 2/2026 (loan-based); equity draft                                                                                                                                 | No licensed platform verified; BeeezCrowd is pre-licence                                                                                                                                                                                                                                                    |
| Lebanon      | CMA Decision 3 (2013)                                                                                                                                                             | Official decision text found (https://www.cma.gov.lb/wp-content/uploads/2017/03/Decision-No.-3.pdf); no licensed company found. The CMA decisions page lists a financial-intermediaries list (decision 38, 8 Aug 2024) that was not opened. **Unresolved**                                                  |
| Palestine    | None; PCMA says it has licensed no crowdfunding platform (13 Jun 2024, https://www.pcma.ps/en/the-palestine-capital-market-authority-warns-against-dealing-with-crowdfunding-pla) | PCMA statement (Jun 2024): no licence or no-objection granted to any crowdfunding platform as of that date; current status not rechecked                                                                                                                                                                    |
| Iran         | SEO directive via Fara Bourse                                                                                                                                                     | About 30 unverified                                                                                                                                                                                                                                                                                         |

### Africa

| Country                                                                               | Regime (current as read)                                                                                                                                                               | Platform findings                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Egypt                                                                                 | FRA completing frameworks                                                                                                                                                              | No licensed crowdfunding platform found; Beban (Bahrain) plans entry (press, Feb 2026)                                                                                                                                                                                                                               |
| Morocco                                                                               | Law 15-18                                                                                                                                                                              | AMMC: none; BAM: 1 named (Invest Alif SA), 3 approved in 2024                                                                                                                                                                                                                                                        |
| Algeria                                                                               | COSOB CIP regime                                                                                                                                                                       | 1 (YINVESTI), title-level confirmation                                                                                                                                                                                                                                                                               |
| Tunisia                                                                               | Law 2020-37, CMF regulation 11 Nov 2024                                                                                                                                                | No licensed investment platform verified; CnBees (ACM) is approved for donation-based activity only                                                                                                                                                                                                                  |
| Ghana                                                                                 | SEC Guidelines 2024                                                                                                                                                                    | 5 confirmed                                                                                                                                                                                                                                                                                                          |
| Nigeria                                                                               | SEC Rules 2021, ISA 2025                                                                                                                                                               | 4 confirmed on the SEC register (partial sweep, 33 of 70 pages); MonieWorx unverified                                                                                                                                                                                                                                |
| Kenya                                                                                 | CMA Investment-Based Crowdfunding Regulations 2022                                                                                                                                     | No licensed platform verified. CMA licensees site lists no crowdfunding category; CMA sandbox page shows Pezesha as successful, now in the mass market. **Unresolved**                                                                                                                                               |
| Tanzania                                                                              | CMSA guidelines 2023                                                                                                                                                                   | 1 unverified                                                                                                                                                                                                                                                                                                         |
| Mauritius                                                                             | FSC Crowdfunding Rules 2021, P2P Rules 2017/2020                                                                                                                                       | No licensed platform verified. FSC register (JS app, https://www.fscmauritius.org/en/supervision/register-of-licensees) returned empty content to fetch for names Fundkiss, Olive Crowd, crowd; Fundkiss says it holds an FSC P2P licence (company blog 3 May 2021). **Unresolved**                                  |
| Ethiopia                                                                              | ECMA directive arts. 68-77                                                                                                                                                             | None found; ECMA's Oct 2025 licences (three new service providers) named no crowdfunding firm                                                                                                                                                                                                                        |
| Cabo Verde                                                                            | Law 34/IX/2018                                                                                                                                                                         | None found (Unido is a Covid donation portal)                                                                                                                                                                                                                                                                        |
| Angola                                                                                | Law approved by Parliament 25 Jun 2026 (CMC notice https://www.cmc.ao/pt-pt/node/2117)                                                                                                 | No licensed platform verified; regime not yet in force as far as found                                                                                                                                                                                                                                               |
| Mozambique                                                                            | Bill approved by Government 2 Jun 2026 (press https://www.diarioeconomico.co.mz/2026/06/03/pme/governo-aprova-proposta-de-lei-sobre-financiamento-colab)                               | No licensed platform verified; bill only                                                                                                                                                                                                                                                                             |
| Madagascar                                                                            | Central bank draft rules on participatory credit/crowdfunding validated Dec (AFI, https://afi-global.org/news/new-regulations-pave-the-way-for-wider-access-to-finance-in-madagascar/) | No licensed platform verified                                                                                                                                                                                                                                                                                        |
| Namibia                                                                               | NAMFISA sandbox cohort 2 (crowdfunding and P2P); two participants admitted per NAMFISA post on LinkedIn                                                                                | Participant names not found. **Unresolved**                                                                                                                                                                                                                                                                          |
| Djibouti                                                                              | Startup Act 179/AN/25/9eme L                                                                                                                                                           | Inclufin unverified                                                                                                                                                                                                                                                                                                  |
| Cameroon, Chad, Congo, Equatorial Guinea, Gabon (CEMAC)                               | COSUMAF Reg. 01/22 art. 145 (crowdfunding advisers)                                                                                                                                    | COSUMAF publishes a list of financial investment advisers (CIF; 10 firms read at https://cosumaf.org/conseils-financiers/), none identified as crowdfunding. No licensed platform verified. COSUMAF's agreement checker (https://cosumaf.org/verify-an-agreement) is interactive and was not queried. **Unresolved** |
| Benin, Burkina Faso, Cote d'Ivoire, Guinea-Bissau, Mali, Niger, Senegal, Togo (WAEMU) | AMF-UMOA regional regime reported but not confirmed on an official source                                                                                                              | CREPMF agreement checker (https://www.crepmf.org/pratique/verification/agrement) is a name-search form that returns no rows without a name, so it cannot list platforms. **Unresolved**                                                                                                                              |
| South Africa                                                                          | No dedicated regime; FSCA sandbox                                                                                                                                                      | 1 unverified                                                                                                                                                                                                                                                                                                         |

#### African countries with no dedicated regime found (regime-review level only; not searched at platform level; no zero-platform claim)

No platform research beyond the regime review; no zero-platform claim is made.

| Country                  | Review status                                              | Platform finding                                                                                                               |
| ------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Botswana                 | No dedicated regime found in searches (checked 2026-10-30) | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |
| Burundi                  | No dedicated regime found in searches (checked 2026-10-30) | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |
| Central African Republic | Dedicated regime - securities crowdfunding                 | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |
| Comoros                  | No dedicated regime found in searches (checked 2026-10-30) | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |
| Eritrea                  | No dedicated regime found in searches (checked 2026-10-30) | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |
| Eswatini                 | No dedicated regime found in searches (checked 2026-10-30) | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |
| Gambia                   | No dedicated regime found in searches (checked 2026-10-30) | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |
| Guinea                   | No dedicated regime found in searches (checked 2026-10-30) | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |
| Iraq                     | No dedicated regime found in searches (checked 2026-10-30) | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |
| Lesotho                  | No dedicated regime found in searches (checked 2026-10-30) | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |
| Liberia                  | No dedicated regime found in searches (checked 2026-10-30) | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |
| Libya                    | No dedicated regime found in searches (checked 2026-10-30) | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |
| Malawi                   | No dedicated regime found in searches (checked 2026-10-30) | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |
| Mauritania               | No dedicated regime found in searches (checked 2026-10-30) | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |
| Rwanda                   | No dedicated regime found in searches (checked 2026-10-30) | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |
| Sao Tome and Principe    | No dedicated regime found in searches (checked 2026-10-30) | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |
| Seychelles               | No dedicated regime found in searches (checked 2026-10-30) | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |
| Sierra Leone             | No dedicated regime found in searches (checked 2026-10-30) | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |
| Somalia                  | No dedicated regime found in searches (checked 2026-10-30) | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |
| South Sudan              | No dedicated regime found in searches (checked 2026-10-30) | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |
| Sudan                    | No dedicated regime found in searches (checked 2026-10-30) | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |
| Syria                    | No dedicated regime found in searches (checked 2026-10-30) | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |
| Uganda                   | No dedicated regime found in searches (checked 2026-10-30) | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |
| Yemen                    | No dedicated regime found in searches (checked 2026-10-30) | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |
| Zambia                   | No dedicated regime found in searches (checked 2026-10-30) | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |
| Zimbabwe                 | No dedicated regime found in searches (checked 2026-10-30) | No licensed platform identified in this pass (not searched at platform level beyond the regime review); no zero-platform claim |

Additional Asia-Pacific scope limits: Countries in the prior map with no dedicated regime found are not silently promoted into regulated platform lists: Afghanistan, Bangladesh, Brunei, Cambodia, Kazakhstan national, Kyrgyzstan, Laos, Maldives, Mongolia, Myanmar, Nepal, North Korea, Tajikistan, Timor-Leste, Turkmenistan and Pacific island states. Their absence from the entity table is not proof that no lawful general-framework provider exists. Hong Kong and Singapore are covered because general securities frameworks explicitly apply.

The Japan loan-fund, Korean securities-CF, Singapore, Hong Kong, Pakistan and Philippine subsets are incomplete or status-qualified. Fiji, Sri Lanka and Vietnam remain open implementation/approval checks. This regional inventory cannot be described as an exhaustive world list of currently active platforms.

## Platform tables

Tables list register/category records exactly as sourced. Within each country, records are grouped by status bucket - only the first group ("Registered or listed") is a current register/permission state, and even that is not proof of trading.

### Americas (excluding the US)

#### Brazil (156 records)

CVM open data read in full: 156 register entries = 151 unique CNPJs. Five entities appear twice with status history; the latest dated entry is the current one. Registration, not trading activity.

Sources: CVM open data, cad_crowdfunding.csv (https://dados.cvm.gov.br/dataset/crowdfunding-cad), read 2026-10-30
Source date(s): 2026-10-30

**Registered or listed (trading/activity not verified) (89):**

| Brand                                                                  | Legal entity                                                                                      | Status (as of source)                                                     | Type                                           | ID                 | Website                                 |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------- | ------------------ | --------------------------------------- |
| IBR INCORPORAÇÕES IMOBILIÁRIAS                                         | IBR INCORPORACOES IMOBILIARIAS                                                                    | Registered - operating normally (as of 2026-09-09)                        | Investment crowdfunding platform (CVM Res. 88) | 12.144.966/0001-81 | https://invest.ibrcapital.com.br/       |
| MyFirstIPO                                                             | Economia Criativa Investimentos e Participações - EIRELI                                          | Registered - operating normally (as of 2011-08-11)                        | Investment crowdfunding platform (CVM Res. 88) | 14.166.791/0001-39 | https://myfirstipo.com/                 |
| START ME UP CROWDFUNDING SISTEMAS PARA INVESTIMENTO COLABORATIVO LTDA. | SMU Investimentos                                                                                 | Registered - operating normally (as of 2013-02-01)                        | Investment crowdfunding platform (CVM Res. 88) | 17.605.805/0001-61 | https://www.startmeup.com.br            |
| VENTIUR Aceleradora                                                    | VENTIUR Investimentos em Novos Negócios S.A                                                       | Registered - operating normally (as of 2021-07-08)                        | Investment crowdfunding platform (CVM Res. 88) | 17.740.274/0001-10 | www.ventiur.net                         |
| Foxbit                                                                 | FOXBIT SERVIÇOS DIGITAIS LTDA.                                                                    | Registered - operating normally (as of 2025-04-11)                        | Investment crowdfunding platform (CVM Res. 88) | 21.246.584/0002-30 |                                         |
| EqSeed                                                                 | EqSeed S.A.                                                                                       | Registered - operating normally (as of 2015-02-06)                        | Investment crowdfunding platform (CVM Res. 88) | 21.839.542/0001-22 | https://eqseed.com/                     |
| Incentive Marketing                                                    | Incentive Marketing e Negócios Ltda.                                                              | Registered - operating normally (as of 2024-04-11)                        | Investment crowdfunding platform (CVM Res. 88) | 22.767.692/0001-30 |                                         |
| HURST CROWDFUNDING                                                     | Hurst Serviços de Investimento Coletivo e Securitização S.A.                                      | Registered - operating normally (as of 2018-11-26)                        | Investment crowdfunding platform (CVM Res. 88) | 23.768.978/0001-01 | www.hurst.capital                       |
| NANO CAPITAL                                                           | NANO CAPITAL                                                                                      | Registered - operating normally (as of 2021-11-22)                        | Investment crowdfunding platform (CVM Res. 88) | 26.496.910/0001-09 |                                         |
| ARBORUS                                                                | ARBORUS TECNOLOGIA LTDA                                                                           | Registered - operating normally (as of 2021-08-03)                        | Investment crowdfunding platform (CVM Res. 88) | 28.808.338/0001-93 |                                         |
| Altxs Investimentos                                                    | Bloxs Capital Market Solutions Ltda.                                                              | Registered - operating normally (as of 2017-11-23)                        | Investment crowdfunding platform (CVM Res. 88) | 29.131.261/0001-22 | https://www.bloxs.com.br/               |
| INCO INVESTIMENTOS COLETIVOS                                           | INCO PLATAFORMA ELETRÔNICA DE INVESTIMENTO PARTICIPATIVO LTDA                                     | Registered - operating normally (as of 2018-03-26)                        | Investment crowdfunding platform (CVM Res. 88) | 30.031.833/0001-80 | https://inco.vc/                        |
| Platta                                                                 | Platta Serviços e Intermediação de Negócios S/A                                                   | Registered - operating normally (as of 2026-05-13; latest register entry) | Investment crowdfunding platform (CVM Res. 88) | 30.313.727/0001-90 |                                         |
| INGEGNI CONSULTORIA E ADMINISTRAÇÃO LTDA                               | INGEGNI CONSULTORIA E ADMINISTRAÇÃO LTDA                                                          | Registered - operating normally (as of 2026-03-11)                        | Investment crowdfunding platform (CVM Res. 88) | 30.350.402/0001-87 |                                         |
| CAPTABLE                                                               | Captable Consultoria em Gestão Empresarial S/A                                                    | Registered - operating normally (as of 2018-05-24)                        | Investment crowdfunding platform (CVM Res. 88) | 30.545.237/0001-19 | https://www.captable.com.br/            |
| MB TOKENS                                                              | MB SECURITIZACAO E DISTRIBUICAO S.A.                                                              | Registered - operating normally (as of 2020-10-29)                        | Investment crowdfunding platform (CVM Res. 88) | 31.674.712/0001-10 |                                         |
| KRIA                                                                   | KRIA INVESTIMENTOS LTDA.                                                                          | Registered - operating normally (as of 2020-08-05)                        | Investment crowdfunding platform (CVM Res. 88) | 31.946.579/0001-03 |                                         |
| Organismo Brasil.                                                      | Organismo Equity Crowdfunding.                                                                    | Registered - operating normally (as of 2019-03-29)                        | Investment crowdfunding platform (CVM Res. 88) | 31.957.961/0001-12 |                                         |
| BEE4 IPO                                                               | Beegin Soluções em Crowdfunding Ltda.                                                             | Registered - operating normally (as of 2019-08-08)                        | Investment crowdfunding platform (CVM Res. 88) | 31.995.837/0001-41 |                                         |
| Wiztartup                                                              | Wiztartup Tecnologia Ltda.                                                                        | Registered - operating normally (as of 2019-07-16)                        | Investment crowdfunding platform (CVM Res. 88) | 32.243.085/0001-25 |                                         |
| PRÉVIAS                                                                | PRÉVIAS DO BRASIL INVESTIMENTOS E SECURITIZAÇÃO S.A.                                              | Registered - operating normally (as of 2019-07-24)                        | Investment crowdfunding platform (CVM Res. 88) | 32.539.600/0001-19 |                                         |
| DIVIFY                                                                 | DIVIFY SECURITIZADORA E PLATAFORMA S.A.                                                           | Registered - operating normally (as of 2021-03-17)                        | Investment crowdfunding platform (CVM Res. 88) | 34.523.457/0001-00 |                                         |
| Primecap                                                               | PRIMECAP PLATAFORMA DE INVESTIMENTOS COLETIVOS LTDA.                                              | Registered - operating normally (as of 2020-04-16)                        | Investment crowdfunding platform (CVM Res. 88) | 35.086.794/0001-32 | www.primecap.com.br                     |
| FAZENDACHEIA                                                           | FAZENDACHEIA TECNOLOGIA E INVESTIMENTOS AGROPECUÁRIOS LTDA                                        | Registered - operating normally (as of 2022-07-12)                        | Investment crowdfunding platform (CVM Res. 88) | 35.579.250/0001-02 |                                         |
| ANGAR                                                                  | MK TECH 2 SERVICOS DE TECNOLOGIA LTDA.                                                            | Registered - operating normally (as of 2024-06-07)                        | Investment crowdfunding platform (CVM Res. 88) | 36.926.816/0001-98 |                                         |
| 100 OPEN ANGELS                                                        | 100 OPEN ANGELS SISTEMAS PARA INVESTIMENTO COLABORATIVO LTDA.                                     | Registered - operating normally (as of 2021-02-05)                        | Investment crowdfunding platform (CVM Res. 88) | 37.054.668/0001-21 |                                         |
| Angel Capital Crowdfunding                                             | Angel Capital Crowdfunding Serviços de Investimento Coletivo Ltda.                                | Registered - operating normally (as of 2021-11-17)                        | Investment crowdfunding platform (CVM Res. 88) | 37.606.824/0001-10 |                                         |
| PATRIMONIO DIGITAL                                                     | PATRIMONIO DIGITAL INVESTIMENTOS LTDA                                                             | Registered - operating normally (as of 2026-03-25)                        | Investment crowdfunding platform (CVM Res. 88) | 37.626.349/0001-43 |                                         |
| TokenOne                                                               | TokenOne LTDA                                                                                     | Registered - operating normally (as of 2026-02-10)                        | Investment crowdfunding platform (CVM Res. 88) | 37.728.588/0001-04 |                                         |
| Osten Invest                                                           | Osten Investimentos Alternativos S.A.                                                             | Registered - operating normally (as of 2021-06-30)                        | Investment crowdfunding platform (CVM Res. 88) | 37.754.457/0001-00 |                                         |
| ICE CAPITAL                                                            | ICE INVESTIMENTOS COLETIVOS LTDA.                                                                 | Registered - operating normally (as of 2021-03-04)                        | Investment crowdfunding platform (CVM Res. 88) | 38.181.219/0001-07 |                                         |
| InvestPlus                                                             | FCJ INVEST S.A.                                                                                   | Registered - operating normally (as of 2021-11-08)                        | Investment crowdfunding platform (CVM Res. 88) | 38.268.345/0001-01 |                                         |
| DROOM DIGITAL SECURITIZADORA DE ATIVOS EMPRESARIAIS S.A.               | DROOM DIGITAL SECURITIZADORA DE ATIVOS EMPRESARIAIS S.A.                                          | Registered - operating normally (as of 2025-12-01)                        | Investment crowdfunding platform (CVM Res. 88) | 39.972.426/0001-42 |                                         |
| Dux Digital                                                            | DUX DIGITAL S.A.                                                                                  | Registered - operating normally (as of 2025-01-23)                        | Investment crowdfunding platform (CVM Res. 88) | 40.703.728/0001-02 |                                         |
| HANDBAG MINING INVESTMENTS                                             | HANDBAG MINING INVESTMENTS SERVICOS DE INVESTIMENTOS COLABORATIVOS E CONSULTORIA EMPRESARIAL LTDA | Registered - operating normally (as of 2022-02-25)                        | Investment crowdfunding platform (CVM Res. 88) | 41.990.770/0001-06 |                                         |
| BIT BENTZ                                                              | BIT BENTZ LTDA.                                                                                   | Registered - operating normally (as of 2025-03-24)                        | Investment crowdfunding platform (CVM Res. 88) | 42.424.043/0001-44 |                                         |
| Kate Equity                                                            | BLUSEEDY INVESTIMENTOS LTDA                                                                       | Registered - operating normally (as of 2024-01-17)                        | Investment crowdfunding platform (CVM Res. 88) | 42.895.677/0001-85 |                                         |
| 4SeeD Investimentos.                                                   | 4SEED INVESTIMENTOS LTDA.                                                                         | Registered - operating normally (as of 2023-01-12)                        | Investment crowdfunding platform (CVM Res. 88) | 44.290.264/0001-00 |                                         |
| Mynt Crypto Tecnologia Ltda                                            | Mynt Crypto Tecnologia Ltda                                                                       | Registered - operating normally (as of 2024-12-23)                        | Investment crowdfunding platform (CVM Res. 88) | 44.364.466/0001-41 |                                         |
| Tokeniza                                                               | Tokeniza Plataforma Eletrônica de Investimento Colaborativo LTDA                                  | Registered - operating normally (as of 2023-05-29)                        | Investment crowdfunding platform (CVM Res. 88) | 45.842.576/0001-34 |                                         |
| IMOBCOIN                                                               | IMOBCOIN TECNOLOGIA LTDA.                                                                         | Registered - operating normally (as of 2026-10-02)                        | Investment crowdfunding platform (CVM Res. 88) | 46.372.600/0001-81 | https://www.imobcoin.com                |
| Arara Seed                                                             | Arara Seed Investimentos S.A                                                                      | Registered - operating normally (as of 2024-04-26)                        | Investment crowdfunding platform (CVM Res. 88) | 46.638.808/0001-08 |                                         |
| FUTURE LABS                                                            | FUTURE LABS - INVESTIMENTOS PARTICIPATIVOS LTDA.                                                  | Registered - operating normally (as of 2023-04-11)                        | Investment crowdfunding platform (CVM Res. 88) | 48.270.139/0001-81 |                                         |
| BANUX INVESTIMENTOS LTDA.                                              | BANUX INVESTIMENTOS LTDA.                                                                         | Registered - operating normally (as of 2024-11-14)                        | Investment crowdfunding platform (CVM Res. 88) | 48.880.654/0001-83 |                                         |
| RIVOOL FINANCE                                                         | RIVOOL TECNOLOGIA & PARTICIPACOES LTDA                                                            | Registered - operating normally (as of 2025-10-31)                        | Investment crowdfunding platform (CVM Res. 88) | 49.261.619/0001-49 |                                         |
| DEXCAP                                                                 | DEXCAP INVESTIMENTOS E TECNOLOGIA LTDA.                                                           | Registered - operating normally (as of 2024-11-28)                        | Investment crowdfunding platform (CVM Res. 88) | 49.637.048/0001-02 |                                         |
| IPÊ ASSETS                                                             | IPÊ INTERMEDIAÇÕES LTDA.                                                                          | Registered - operating normally (as of 2025-03-11)                        | Investment crowdfunding platform (CVM Res. 88) | 49.983.681/0001-44 |                                         |
| GLOBOO INPUT OUTPUT LTDA.                                              | GLOBOO INPUT OUTPUT LTDA.                                                                         | Registered - operating normally (as of 2025-04-14)                        | Investment crowdfunding platform (CVM Res. 88) | 49.998.570/0001-01 |                                         |
| EDEN INVEST                                                            | EDEN INVEST LTDA.                                                                                 | Registered - operating normally (as of 2023-06-29)                        | Investment crowdfunding platform (CVM Res. 88) | 50.074.623/0001-87 |                                         |
| GCB Plataforma                                                         | GCB PLATAFORMA ELETRÔNICA DE INVESTIMENTO PARTICIPATIVO S.A.                                      | Registered - operating normally (as of 2023-09-26)                        | Investment crowdfunding platform (CVM Res. 88) | 50.299.488/0001-78 |                                         |
| OCEAN CROWDFUNDING                                                     | OCEAN CROWDFUNDING LTDA.                                                                          | Registered - operating normally (as of 2023-09-01)                        | Investment crowdfunding platform (CVM Res. 88) | 50.567.554/0001-43 |                                         |
| BWB DIGITAL ASSETS                                                     | BWB INVESTIMENTOS DIGITAIS LTDA                                                                   | Registered - operating normally (as of 2025-10-14)                        | Investment crowdfunding platform (CVM Res. 88) | 50.893.963/0001-30 |                                         |
| PP TECNOLOGIA EM GESTAO FINANCEIRA INSTITUICAO DE PAGAMENTO LTDA       | PP TECNOLOGIA EM GESTÃO FINANCEIRA & INSTITUIÇÃO DE PAGAMENTO LTDA                                | Registered - operating normally (as of 2025-06-11)                        | Investment crowdfunding platform (CVM Res. 88) | 50.917.835/0001-89 |                                         |
| LOOR INVESTIMENTOS E TECNOLOGIA LTDA                                   | LOOR                                                                                              | Registered - operating normally (as of 2024-02-19)                        | Investment crowdfunding platform (CVM Res. 88) | 51.219.866/0001-29 |                                         |
| ACÁCIA INVESTIMENTOS ALTERNATIVOS                                      | ACÁCIA PLATAFORMA ELETRÔNICA DE INVESTIMENTOS LTDA.                                               | Registered - operating normally (as of 2024-08-29)                        | Investment crowdfunding platform (CVM Res. 88) | 51.406.233/0001-20 |                                         |
| AMFI PLATAFORMA ELETRONICA DE INVESTIMENTO LTDA                        | AMFI PLATAFORMA ELETRONICA DE INVESTIMENTO LTDA                                                   | Registered - operating normally (as of 2023-07-13)                        | Investment crowdfunding platform (CVM Res. 88) | 51.548.809/0001-93 |                                         |
| OnePercent Crowdfunding                                                | Onepercent Crowdfunding Ltda                                                                      | Registered - operating normally (as of 2024-09-13)                        | Investment crowdfunding platform (CVM Res. 88) | 51.890.431/0001-01 |                                         |
| UCAPITAL                                                               | UINVEX CAPITAL LTDA.                                                                              | Registered - operating normally (as of 2023-12-12)                        | Investment crowdfunding platform (CVM Res. 88) | 52.062.781/0001-42 |                                         |
| RAISE CAPITAL                                                          | Raise Capital Securitizadora S.A.                                                                 | Registered - operating normally (as of 2024-08-22)                        | Investment crowdfunding platform (CVM Res. 88) | 52.422.948/0001-39 |                                         |
| Plataforma Finapop                                                     | FPS Plataforma de Investimento Participativo Ltda                                                 | Registered - operating normally (as of 2024-06-28)                        | Investment crowdfunding platform (CVM Res. 88) | 52.574.103/0001-69 |                                         |
| LEVERAGE 88                                                            | LEVERAGE 88 COMPANHIA SECURITIZADORA                                                              | Registered - operating normally (as of 2026-05-06)                        | Investment crowdfunding platform (CVM Res. 88) | 53.192.655/0001-75 |                                         |
| TRANSFERO                                                              | TRANSFERO SECURITIZADORA S.A.                                                                     | Registered - operating normally (as of 2025-10-31)                        | Investment crowdfunding platform (CVM Res. 88) | 53.199.734/0001-08 |                                         |
| HUMAI                                                                  | HUMAI LTDA                                                                                        | Registered - operating normally (as of 2026-09-03)                        | Investment crowdfunding platform (CVM Res. 88) | 53.262.678/0001-09 | https://kopera.digital                  |
| Zuvia Crowdfunding                                                     | ZUVIA DIGITAL ASSETS PLATAFORMA ELETRÔNICA DE INVESTIMENTOS LTDA.                                 | Registered - operating normally (as of 2024-11-21)                        | Investment crowdfunding platform (CVM Res. 88) | 53.272.184/0001-05 |                                         |
| LYNKOS CAPITAL                                                         | LYNKOS CAPITAL Ltda                                                                               | Registered - operating normally (as of 2024-12-23)                        | Investment crowdfunding platform (CVM Res. 88) | 53.983.272/0001-15 |                                         |
| BORA ANTECIPAR - SEC CRED                                              | SEC CRED ADMINISTRACAO DE RECEBIVEIS LTDA                                                         | Registered - operating normally (as of 2026-09-30)                        | Investment crowdfunding platform (CVM Res. 88) | 54.059.014/0001-00 | https://www.boraantecipar.com.br/       |
| FIST CROWDFUNDING LTDA.                                                | FIST CROWDFUNDING                                                                                 | Registered - operating normally (as of 2025-01-08)                        | Investment crowdfunding platform (CVM Res. 88) | 54.301.063/0001-07 |                                         |
| LIQI SECURITIZADORA S.A                                                | LIQI SECURITIZADORA S.A.                                                                          | Registered - operating normally (as of 2024-07-30)                        | Investment crowdfunding platform (CVM Res. 88) | 54.414.102/0001-82 |                                         |
| Finventures Investimentos                                              | FINVENTURES PLATAFORMA DE INVESTIMENTOS PARTICIPATIVOS LTDA.                                      | Registered - operating normally (as of 2024-10-18)                        | Investment crowdfunding platform (CVM Res. 88) | 55.229.524/0001-40 |                                         |
| ZIONEX                                                                 | ZIONEX LTDA                                                                                       | Registered - operating normally (as of 2026-02-10)                        | Investment crowdfunding platform (CVM Res. 88) | 55.932.468/0001-06 |                                         |
| CAMBIADOR CROWDFUNDING                                                 | CAMBIADOR CROWDFUNDING S.A.                                                                       | Registered - operating normally (as of 2026-04-29)                        | Investment crowdfunding platform (CVM Res. 88) | 56.155.056/0001-70 |                                         |
| Nexa                                                                   | NEXA DIGITAL ASSETS S.A.                                                                          | Registered - operating normally (as of 2025-04-03)                        | Investment crowdfunding platform (CVM Res. 88) | 57.230.071/0001-06 |                                         |
| Token Capital                                                          | Token Capital LTDA                                                                                | Registered - operating normally (as of 2025-11-11)                        | Investment crowdfunding platform (CVM Res. 88) | 57.278.666/0001-23 |                                         |
| VT PLATAFORMA ELETRÔNICA DE INVESTIMENTO PARTICIPATIVO LTDA            | VT PLATAFORMA ELETRÔNICA DE INVESTIMENTO PARTICIPATIVO LTDA                                       | Registered - operating normally (as of 2025-07-18)                        | Investment crowdfunding platform (CVM Res. 88) | 57.783.448/0001-46 |                                         |
| XO DIGITAL                                                             | XO PLATAFORMA DIGITAL LTDA                                                                        | Registered - operating normally (as of 2025-04-23)                        | Investment crowdfunding platform (CVM Res. 88) | 57.916.178/0001-02 |                                         |
| PERCAPTA INVESTIMENTOS                                                 | PERCAPTA INVESTIMENTO PARTICIPATIVO LTDA                                                          | Registered - operating normally (as of 2025-07-18)                        | Investment crowdfunding platform (CVM Res. 88) | 58.430.037/0001-30 |                                         |
| MOHZ                                                                   | MOHZ PLATAFORMA DE TECNOLOGIA LTDA.                                                               | Registered - operating normally (as of 2026-02-25)                        | Investment crowdfunding platform (CVM Res. 88) | 60.273.452/0001-79 |                                         |
| TOKEN HAUS                                                             | EFIX PLATAFORMA DE TOKENIZACAO E CROWDFUNDING LTDA.                                               | Registered - operating normally (as of 2025-07-15)                        | Investment crowdfunding platform (CVM Res. 88) | 60.756.859/0001-57 |                                         |
| MZIC                                                                   | MZIC BRASIL S.A.                                                                                  | Registered - operating normally (as of 2025-10-01)                        | Investment crowdfunding platform (CVM Res. 88) | 60.978.531/0001-85 |                                         |
| Clube da Casa Brasileira                                               | Plataforma Casa Brasileira Ltda                                                                   | Registered - operating normally (as of 2026-02-25)                        | Investment crowdfunding platform (CVM Res. 88) | 61.788.801/0001-58 |                                         |
| FUNDERA INVESTIMENTOS PARTICIPATIVOS                                   | FUNDERA INVESTIMENTOS PARTICIPATIVOS LTDA                                                         | Registered - operating normally (as of 2026-01-16)                        | Investment crowdfunding platform (CVM Res. 88) | 62.182.221/0001-85 |                                         |
| INFINITY TOKENS                                                        | INFINITY TOKENS PLATAFORMA DE INVESTIMENTO COLABORATIVO LTDA.                                     | Registered - operating normally (as of 2026-09-21)                        | Investment crowdfunding platform (CVM Res. 88) | 63.141.419/0001-83 | www.infinitycoin.com.br                 |
| SC INVEST                                                              | SALDANHA CAPITAL INVESTIMENTOS LTDA.                                                              | Registered - operating normally (as of 2026-04-29)                        | Investment crowdfunding platform (CVM Res. 88) | 63.313.850/0001-60 |                                         |
| AEVUM                                                                  | AEVUM PLATAFORMA ELETRONICA DE INVESTIMENTOS LTDA.                                                | Registered - operating normally (as of 2026-10-14)                        | Investment crowdfunding platform (CVM Res. 88) | 64.031.005/0001-64 | aevumcapital.com.br                     |
| MERCADO DE INVESTIMENTOS                                               | MERCADO DE INVESTIMENTOS LTDA.                                                                    | Registered - operating normally (as of 2026-03-26)                        | Investment crowdfunding platform (CVM Res. 88) | 64.608.861/0001-30 |                                         |
| MAXIMUS PLATAFORMA DE INVESTIMENTOS                                    | MAXIMUS PLATAFORMA DE INVESTIMENTOS ALTERNATIVOS LTDA                                             | Registered - operating normally (as of 2026-08-27)                        | Investment crowdfunding platform (CVM Res. 88) | 65.281.371/0001-34 | http://www.maximusinvestimentos.com.br/ |
| NIMBER                                                                 | NIMBER DIGITAL ASSETS LTDA.                                                                       | Registered - operating normally (as of 2026-08-04)                        | Investment crowdfunding platform (CVM Res. 88) | 65.859.972/0001-81 |                                         |
| Muse                                                                   | Muse Securitizadora S.A.                                                                          | Registered - operating normally (as of 2026-07-01)                        | Investment crowdfunding platform (CVM Res. 88) | 66.049.101/0001-65 |                                         |
| ATLAS SECURITIZADORA E PLATAFORMA DE INVESTIMENTO PARTICIPATIVO S.A.   | ATLAS SECURITIZADORA E PLATAFORMA DE INVESTIMENTO PARTICIPATIVO S.A.                              | Registered - operating normally (as of 2026-08-05)                        | Investment crowdfunding platform (CVM Res. 88) | 66.442.571/0001-94 |                                         |

**In register, status field blank (3):**

| Brand               | Legal entity                               | Status (as of source)                                                     | Type                                           | ID                 | Website |
| ------------------- | ------------------------------------------ | ------------------------------------------------------------------------- | ---------------------------------------------- | ------------------ | ------- |
| Pipeline Collective | PIPELINE SERVIÇOS LTDA                     | Status blank in register (undated register entry - current state unclear) | Investment crowdfunding platform (CVM Res. 88) | 15.799.453/0001-05 |         |
| Loor Tech           | LOOR TECH - TECNOLOGIA E INVESTIMENTO LTDA | Status blank in register                                                  | Investment crowdfunding platform (CVM Res. 88) | 59.380.245/0001-34 |         |
| CrowdCrypto         | CROWDCRYPTO LTDA                           | Status blank in register                                                  | Investment crowdfunding platform (CVM Res. 88) | 62.645.123/0001-37 |         |

**Pending, applied or not granted (16):**

| Brand                                 | Legal entity                                                                                     | Status (as of source)                                                                     | Type                                           | ID                 | Website                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------ | --------------------------------------- |
| Banco Social de Sustentabilidade      | Power Water do Brasil S.A                                                                        | Registration not granted (as of 2025-11-13)                                               | Investment crowdfunding platform (CVM Res. 88) | 11.854.914/0004-89 |                                         |
| eCOfunding Investimentos Sustentáveis | ECOFUNDING CONSULTORIA EM TECNOLOGIA LTDA.                                                       | Registration not granted (as of 2025-11-11; latest register entry)                        | Investment crowdfunding platform (CVM Res. 88) | 28.453.814/0001-09 |                                         |
| EQMONEY                               | EQMONEY LTDA                                                                                     | Registration not granted (as of 2025-11-13)                                               | Investment crowdfunding platform (CVM Res. 88) | 32.329.771/0001-13 |                                         |
| PHOTOX GREENTECH                      | PHOTOX GREENTECH SUSTENTABILIDADE                                                                | Application under analysis (not yet registered) (as of 2026-09-02)                        | Investment crowdfunding platform (CVM Res. 88) | 34.697.721/0001-14 | photoxgreentech.com                     |
| BVM12                                 | BVM12 - Plataforma de Captação para Startups Ltda.                                               | Registration not granted (as of 2025-12-17; latest register entry)                        | Investment crowdfunding platform (CVM Res. 88) | 38.730.632/0001-83 |                                         |
| Extha                                 | Expedito administradora LTDA                                                                     | Application under analysis (not yet registered) (as of 2026-04-01)                        | Investment crowdfunding platform (CVM Res. 88) | 43.691.597/0001-70 |                                         |
| IDROOVE BANK                          | IDROOVE BANK LTDA                                                                                | Application under analysis (not yet registered) (as of 2026-06-08; latest register entry) | Investment crowdfunding platform (CVM Res. 88) | 58.194.514/0001-05 |                                         |
| IDROOVE BANK                          | IDROOVE BANK LTDA                                                                                | Registration not granted (as of 2025-11-13; earlier register entry - superseded)          | Investment crowdfunding platform (CVM Res. 88) | 58.194.514/0001-05 |                                         |
| Avero Invest                          | Avero Invest Ltda                                                                                | Application under analysis (not yet registered) (as of 2026-10-21)                        | Investment crowdfunding platform (CVM Res. 88) | 59.985.175/0001-48 | http://crowdfunding.averoinvest.com.br/ |
| FUNDO VHS PATRIMONIAL                 | VHS INVESTIMENTOS S.A.                                                                           | Registration not granted (as of 2025-09-09)                                               | Investment crowdfunding platform (CVM Res. 88) | 61.600.361/0001-63 |                                         |
| C9 CAPITAL BASE FUNDO                 | C9 CAPITAL BASE FUNDO DE INVESTIMENTO EM PARTICIPAÇÕES MULTIESTRATÉGIA RESPONSABILIDADE LIMITADA | Application under analysis (not yet registered) (as of 2026-02-20)                        | Investment crowdfunding platform (CVM Res. 88) | 62.282.815/0001-68 |                                         |
| PBU - TOKENIZACAO E TECNOLOGICA LTDA  | PBU - TOKENIZACAO E TECNOLOGICA LTDA                                                             | Registration not granted (as of 2026-10-29)                                               | Investment crowdfunding platform (CVM Res. 88) | 64.964.681/0001-90 | https://app.portalpbu.com/              |
| UBUNTU FUTURE LABS                    | UBUNTU FUTURE LABS TECNOLOGIAS CONSULTORIA EM TI LTDA                                            | Application under analysis (not yet registered) (as of 2026-06-30)                        | Investment crowdfunding platform (CVM Res. 88) | 67.088.200/0001-19 |                                         |
| Bauen Invest                          | Bauen Invest Plataforma Eletrônica de Investimentos Ltda.                                        | Application under analysis (not yet registered) (as of 2026-09-02)                        | Investment crowdfunding platform (CVM Res. 88) | 67.835.054/0001-48 | https://token.bauenhubinvest.com.br     |
| JOY ENERGY                            | JOY ENERGY INVESTIMENTOS LTDA                                                                    | Application under analysis (not yet registered) (as of 2026-10-20)                        | Investment crowdfunding platform (CVM Res. 88) | 68.040.253/0001-22 | https://joyenergyinvestimentos.com.br   |
| Findex Investimentos                  | Findex Investimento e tecnologia S.A.                                                            | Application under analysis (not yet registered) (as of 2026-10-27)                        | Investment crowdfunding platform (CVM Res. 88) | 68.875.708/0001-20 | https://findex.digital/                 |

**Cancelled, withdrawn, ceased or historical (48):**

| Brand                                                            | Legal entity                                                                         | Status (as of source)                                                          | Type                                           | ID                 | Website                         |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ---------------------------------------------- | ------------------ | ------------------------------- |
| Pipeline Collective                                              | PIPELINE SERVIÇOS LTDA                                                               | Registration cancelled (as of 2025-04-10; latest register entry)               | Investment crowdfunding platform (CVM Res. 88) | 15.799.453/0001-05 |                                 |
| Basement                                                         | BASEMENT SOLUCOES DE CAPTACAO E REGISTRO LTDA.                                       | Registration cancelled (as of 2024-11-28; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 17.131.750/0001-03 | https://www.kria.vc/            |
| Investcode                                                       | Athan Incorporação, Investimentos & Financeiro LTDA                                  | Registration cancelled (as of 2024-11-28; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 17.185.096/0001-02 |                                 |
| URBE.ME                                                          | Urbe.ME Serviços Desenvolvimento Urbano Ltda - EPP                                   | Registration cancelled (as of 2020-06-25; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 21.013.359/0001-73 | https://urbe.me                 |
| WE BUILD                                                         | We Build Tecnologia Ltda.                                                            | Registration cancelled (as of 2024-11-28; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 21.650.000/0001-07 | https://webuild.com.br/         |
| UPANGEL                                                          | D Interação e Tecnologia Eirelli                                                     | Registration cancelled (as of 2020-12-28; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 25.423.067/0001-60 |                                 |
| eCOfunding Investimentos Sustentáveis                            | ECOFUNDING CONSULTORIA EM TECNOLOGIA LTDA.                                           | Registration cancelled (as of 2024-11-28; earlier register entry - superseded) | Investment crowdfunding platform (CVM Res. 88) | 28.453.814/0001-09 | https://ecofunding.com.br/      |
| BRAAIM                                                           | BRAAIM Plataforma Eletrônica de Investimentos LTDA.                                  | Registration cancelled (as of 2024-11-28; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 28.706.485/0001-52 | https://profitinvesting.com.br/ |
| CONFIANCE INVEST                                                 | CONFIANCE INVEST PLATAFORMA DE INVESTIMENTOS LTDA.                                   | Registration cancelled (as of 2025-12-12; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 29.036.516/0001-78 |                                 |
| N/A                                                              | Glebba Serviços de Investimentos Participativos e de Correspondentes Bancários Ltda. | Registration cancelled (as of 2024-11-28; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 29.072.358/0001-01 | www.glebba.com.br               |
| SIIM                                                             | SIIM SOLUÇÕES EM INVESTIMENTOS IMOBILIÁRIOS LTDA.                                    | Registration cancelled (as of 2024-11-28; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 29.292.834/0001-08 |                                 |
| FinCo Invest                                                     | Finco Invest Serviços de Informação e Hospedagem na Internet Ltda.                   | Registration cancelled (as of 2020-09-22; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 29.605.498/0001-06 | https://www.fincoinvest.com/    |
| Cluster21                                                        | Cluster21 Investimentos Coletivos Ltda.                                              | Registration cancelled (as of 2025-07-16; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 29.687.832/0001-00 | https://cluster21.com.br        |
| BIZ 2                                                            | RGS Hernandes Consultoria Ltda.                                                      | Registration cancelled (as of 2024-11-28; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 30.213.926/0001-26 | https://biz2.com.br/            |
| Platta                                                           | Platta Serviços e Intermediação de Negócios S/A                                      | Registration cancelled (as of 2025-12-12; earlier register entry - superseded) | Investment crowdfunding platform (CVM Res. 88) | 30.313.727/0001-90 |                                 |
| MAISAPORTE.COM.BR                                                | MAIS APORTE DESENVOLVIMENTO LTDA.                                                    | Registration cancelled (as of 2024-11-28; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 30.381.477/0001-25 | www.maisaporte.com              |
| WISHE                                                            | WISHE PLATAFORMA DE INVESTIMENTO COLETIVO LTDA.                                      | Registration cancelled (as of 2024-11-28; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 31.095.851/0001-99 |                                 |
| YC                                                               | VANGARDI INVESTIMENTOS PARTICIPATIVOS E CONSULTORIA LTDA                             | Registration cancelled (as of 2024-11-28; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 31.694.497/0001-19 | www.vangardi.com.br             |
| RENTABILIZEI INVESTIMENTOS COLETIVOS                             | Smart Funding Serviços de Tecnologia da Informação Ltda.                             | Registration cancelled (as of 2022-04-13; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 31.758.357/0001-67 |                                 |
| NOSSO INVESTIMENTO                                               | Nosso Investimento Plataforma Eletrônica de Investimento Participativo Ltda.         | Registration cancelled (as of 2024-11-28; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 31.784.651/0001-43 |                                 |
| ANJOODA                                                          | ANJOODA PLATAFORMA ELETRÔNICA DE INVESTIMENTO S.A.                                   | Registration cancelled (as of 2024-11-28; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 32.469.005/0001-54 |                                 |
| HOUSE2INVEST                                                     | House 2 Invest Serviços de Investimentos Participativos e Consultoria Ltda.          | Registration cancelled (as of 2024-11-28; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 32.774.769/0001-53 | www.house2invest.com.br         |
| BUILDINVEST                                                      | BUILDINVEST INTERMEDIACAO DE NEGOCIOS E INVESTIMENTOS LTDA                           | Registration cancelled (as of 2023-01-20; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 32.959.834/0001-15 | www.buildinvest.com.br          |
| DealClubs                                                        | Dealclubs Plataforma de Investimentos LTDA                                           | Registration cancelled (as of 2024-11-28; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 33.304.366/0001-03 | https://raiserfund.com.br/      |
| 3C Invest                                                        | 3C PLATAFORMA ELETRONICA DE INVESTIMENTO LTDA                                        | Registration cancelled (as of 2025-12-04; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 33.549.078/0001-19 |                                 |
| MAVE INVESTIMENTOS, CONSULTORIA, TREINAMENTOS E TECNOLOGIA LTDA. | MAVE INVESTIMENTOS, CONSULTORIA, TREINAMENTOS E TECNOLOGIA LTDA.                     | Registration cancelled (as of 2024-11-28; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 33.704.844/0001-72 |                                 |
| AVSTRALIS                                                        | AVSTRALIS INVESTIMENTOS PARTICIPATIVOS LTDA.                                         | Registration cancelled (as of 2020-12-19; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 34.942.559/0001-52 |                                 |
| ARARA SEED                                                       | BLB VENTURE BUILDERS PARTICIPACOES LTDA                                              | Registration cancelled (as of 2025-12-04; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 35.440.796/0001-88 | https://araraseed.com.br/       |
| EFUND INVESTIMENTOS                                              | I. C. ROMEIRO INVESTIMENTOS LTDA.                                                    | Registration cancelled (as of 2025-12-04; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 36.908.607/0001-11 |                                 |
| TANGISA                                                          | TANGISA INVESTIMENTOS E PARTICIPAÇÕES S.A.                                           | Registration cancelled (as of 2025-12-04; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 37.598.555/0001-97 |                                 |
| Investfarm                                                       | Investfarm Serviços de Tecnologia S.A.                                               | Registration cancelled (as of 2024-11-28; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 37.871.398/0001-41 | www.investfarm.com.br           |
| ALT                                                              | ALT PLATAFORMA DE INVESTIMENTOS ALTERNATIVOS LTDA.                                   | Registration cancelled (as of 2024-10-17; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 38.036.151/0001-72 | www.alt.vc                      |
| BVM12                                                            | BVM12 - Plataforma de Captação para Startups Ltda.                                   | Registration cancelled (as of 2024-11-28; earlier register entry - superseded) | Investment crowdfunding platform (CVM Res. 88) | 38.730.632/0001-83 | www.bvm12.com.br                |
| REVIN                                                            | Revin Investimentos Ltda.                                                            | Registration cancelled (as of 2024-08-14; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 40.392.252/0001-28 | https://revin.com.br/           |
| PETROBOLSA                                                       | PETROBOLSA INVESTIMENTOS LTDA                                                        | Registration cancelled (as of 2025-12-04; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 40.908.679/0001-36 |                                 |
| Connecta Capital                                                 | Connecta Capital Ltda.                                                               | Registration cancelled (as of 2024-11-28; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 40.970.528/0001-08 | www.connectacapital.com         |
|                                                                  | ROBUSTA INVESTIMENTOS ALTERNATIVOS LTDA.                                             | Registration cancelled (as of 2024-11-28; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 41.336.061/0001-01 | www.sejarobusta.com.br          |
| Vegan Business                                                   | VEGANBUSINESS INVESTIMENTOS S.A.                                                     | Registration cancelled (as of 2024-07-19; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 41.943.007/0001-24 |                                 |
| Agro Corp Investimentos                                          | Agro Corp Investmentos Digitais Eireli                                               | Registration cancelled (as of 2025-12-04; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 42.925.551/0001-06 |                                 |
| uBits Capital                                                    | UBITS LTDA                                                                           | Registration cancelled (as of 2025-12-12; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 43.275.488/0001-72 |                                 |
| BridgeHub                                                        | BRIDGE HUB PLATAFORMA ELETRONICA DE INVESTIMENTO PARTICIPATIVO LTDA.                 | Registration cancelled (as of 2025-12-12; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 45.499.825/0001-30 |                                 |
| TiEER                                                            | TIEER TITULARIZAÇÃO ELETRÔNICA DA ECONOMIA REAL LTDA.                                | Registration cancelled (as of 2025-12-04; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 47.309.358/0001-64 |                                 |
| SOUTH CROWDFUNDING LTDA.                                         | SOUTH CROWDFUNDING LTDA.                                                             | Registration cancelled (as of 2025-12-12; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 48.223.502/0001-08 |                                 |
| AgroVen Acesso                                                   | AgroVen Financiamento Coletivo S/A                                                   | Registration cancelled (as of 2025-12-04; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 48.940.520/0001-00 |                                 |
| Questum Investimentos                                            | Questum Investimentos LTDA                                                           | Registration cancelled (as of 2023-09-27; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 49.276.351/0001-19 |                                 |
| MyPart                                                           | MY PART LTDA.                                                                        | Registration cancelled (as of 2025-12-04; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 49.858.686/0001-45 |                                 |
| CASHCAP                                                          | CASHCAP TECNOLOGIA PLATAFORMA DE CROWDFUNDING LTDA.                                  | Registration cancelled (as of 2024-10-24; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 51.353.587/0001-53 |                                 |
| Loopi                                                            | Loopi Plataforma de Investimento Coletivo e Securitizadora de Créditos S.A.          | Registration cancelled (as of 2026-01-05; historical register entry)           | Investment crowdfunding platform (CVM Res. 88) | 53.044.059/0001-48 |                                 |

#### Mexico (21 records)

CNBV list of 21 Instituciones de Financiamiento Colectivo. Brand names are not on the official list; a revoked list was not found.

Sources: CNBV official list https://www.cnbv.gob.mx/Entidades-Autorizadas/Paginas/FinanciamientoColectivo.aspx, read 2026-10-30
Source date(s): 2026-10-30

**Registered or listed (trading/activity not verified) (21):**

| Brand                          | Legal entity                                                                                                | Status (as of source)       | Type                                                                                                                    | ID  | Website |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --- | ------- |
| (brand not shown on CNBV list) | Grupo Finansiell, S.A.P.I. de C.V., Institución de Financiamiento Colectivo                                 | Authorised (listed by CNBV) | Institución de Financiamiento Colectivo (debt, equity, co-ownership, royalty - per CNBV; type per entity not extracted) |     |         |
| (brand not shown on CNBV list) | Communitas Aurum, S.A.P.I. de C.V., Institución de Financiamiento Colectivo                                 | Authorised (listed by CNBV) | Institución de Financiamiento Colectivo (debt, equity, co-ownership, royalty - per CNBV; type per entity not extracted) |     |         |
| (brand not shown on CNBV list) | Play Business, S.A.P.I. de C.V., Institución de Financiamiento Colectivo                                    | Authorised (listed by CNBV) | Institución de Financiamiento Colectivo (debt, equity, co-ownership, royalty - per CNBV; type per entity not extracted) |     |         |
| (brand not shown on CNBV list) | Plataforma Inmobiliaria Cien Ladrillos, S.A.P.I. de C.V., Institución de Financiamiento Colectivo           | Authorised (listed by CNBV) | Institución de Financiamiento Colectivo (debt, equity, co-ownership, royalty - per CNBV; type per entity not extracted) |     |         |
| (brand not shown on CNBV list) | LIKIDEO MX, S.A.P.I. de C.V., Institución de Financiamiento Colectivo                                       | Authorised (listed by CNBV) | Institución de Financiamiento Colectivo (debt, equity, co-ownership, royalty - per CNBV; type per entity not extracted) |     |         |
| (brand not shown on CNBV list) | ANGELES EN ARK, S.A.P.I. de C.V., Institución de Financiamiento Colectivo                                   | Authorised (listed by CNBV) | Institución de Financiamiento Colectivo (debt, equity, co-ownership, royalty - per CNBV; type per entity not extracted) |     |         |
| (brand not shown on CNBV list) | Comunidad de Préstamos, S.A.P.I. de C.V., Institución de Financiamiento Colectivo                           | Authorised (listed by CNBV) | Institución de Financiamiento Colectivo (debt, equity, co-ownership, royalty - per CNBV; type per entity not extracted) |     |         |
| (brand not shown on CNBV list) | CROWD UP MEX, S.A.P.I. de C.V., Institución de Financiamiento Colectivo                                     | Authorised (listed by CNBV) | Institución de Financiamiento Colectivo (debt, equity, co-ownership, royalty - per CNBV; type per entity not extracted) |     |         |
| (brand not shown on CNBV list) | MONIFIC, S.A. de C.V., Institución de Financiamiento Colectivo                                              | Authorised (listed by CNBV) | Institución de Financiamiento Colectivo (debt, equity, co-ownership, royalty - per CNBV; type per entity not extracted) |     |         |
| (brand not shown on CNBV list) | EXPANSIVE REALTY, S.A.P.I. de C.V., Institución de Financiamiento Colectivo                                 | Authorised (listed by CNBV) | Institución de Financiamiento Colectivo (debt, equity, co-ownership, royalty - per CNBV; type per entity not extracted) |     |         |
| (brand not shown on CNBV list) | Emprendimientos Maussan y González, S.A.P.I. de C.V., Institución de Financiamiento Colectivo               | Authorised (listed by CNBV) | Institución de Financiamiento Colectivo (debt, equity, co-ownership, royalty - per CNBV; type per entity not extracted) |     |         |
| (brand not shown on CNBV list) | SFC Snowball Community S.A. de C.V., Institución de Financiamiento Colectivo                                | Authorised (listed by CNBV) | Institución de Financiamiento Colectivo (debt, equity, co-ownership, royalty - per CNBV; type per entity not extracted) |     |         |
| (brand not shown on CNBV list) | BXL FINTECH, S.A. de C.V., Institución de Financiamiento Colectivo                                          | Authorised (listed by CNBV) | Institución de Financiamiento Colectivo (debt, equity, co-ownership, royalty - per CNBV; type per entity not extracted) |     |         |
| (brand not shown on CNBV list) | M2crowd, S.A. de C.V., Institución de Financiamiento Colectivo                                              | Authorised (listed by CNBV) | Institución de Financiamiento Colectivo (debt, equity, co-ownership, royalty - per CNBV; type per entity not extracted) |     |         |
| (brand not shown on CNBV list) | FUNDARY, S.A.P.I. de C.V., Institución de Financiamiento Colectivo                                          | Authorised (listed by CNBV) | Institución de Financiamiento Colectivo (debt, equity, co-ownership, royalty - per CNBV; type per entity not extracted) |     |         |
| (brand not shown on CNBV list) | Plataforma por Metro Cuadrado, S.A.P.I. de C.V., Institución de Financiamiento Colectivo                    | Authorised (listed by CNBV) | Institución de Financiamiento Colectivo (debt, equity, co-ownership, royalty - per CNBV; type per entity not extracted) |     |         |
| (brand not shown on CNBV list) | Afluenta México, S.A. de C.V., Institución de Financiamiento Colectivo                                      | Authorised (listed by CNBV) | Institución de Financiamiento Colectivo (debt, equity, co-ownership, royalty - per CNBV; type per entity not extracted) |     |         |
| (brand not shown on CNBV list) | FINTIGO, S.A.P.I. de C.V., Institución de Financiamiento Colectivo                                          | Authorised (listed by CNBV) | Institución de Financiamiento Colectivo (debt, equity, co-ownership, royalty - per CNBV; type per entity not extracted) |     |         |
| (brand not shown on CNBV list) | GRUPO QUINDALO, S.A.P.I. de C.V., Institución de Financiamiento Colectivo                                   | Authorised (listed by CNBV) | Institución de Financiamiento Colectivo (debt, equity, co-ownership, royalty - per CNBV; type per entity not extracted) |     |         |
| (brand not shown on CNBV list) | TOP KAPITAL DESARROLLOS INMOBILIARIOS DEL CENTRO, S.A.P.I. de C.V., Institución de Financiamiento Colectivo | Authorised (listed by CNBV) | Institución de Financiamiento Colectivo (debt, equity, co-ownership, royalty - per CNBV; type per entity not extracted) |     |         |
| (brand not shown on CNBV list) | UCOMBI, S.A.P.I. de C.V., Institución de Financiamiento Colectivo                                           | Authorised (listed by CNBV) | Institución de Financiamiento Colectivo (debt, equity, co-ownership, royalty - per CNBV; type per entity not extracted) |     |         |

#### Canada (19 records)

Official AMF (Quebec), Manitoba and New Brunswick lists plus a CSA-data-based aggregator, deduplicated. The CSA National Registration Search is CAPTCHA-protected (not bypassed), so individual registrations are unverified there. BCSC, Alberta and Saskatchewan publish no list; the OSC dataset has names and categories only.

Sources: Official: AMF, Manitoba, NB pages below; secondary aggregator equitycrowd.fund/list-of-portals (says it is CSA-data based), read 2026-10-30; provincial pages: https://lautorite.qc.ca/grand-public/registres/portails-de-financement-participatif-crowdfunding ; https://mbsecurities.ca/registration/crowdfunding/list-of-eligible-portals.html ; https://fcnb.ca/en/securities/securities-law-and-policy/act-and-regulations/start-up-crowdfunding-exemption ; https://fcnb.ca/en/securities/securities-law-and-policy/act-and-regulations/start-up-crowdfunding-exemption ; https://lautorite.qc.ca/grand-public/registres/portails-de-financement-participatif-crowdfunding
Source date(s): 2026-10-30

**Registered or listed (trading/activity not verified) (12):**

| Brand                            | Legal entity                       | Status (as of source)                                                                                          | Type                                                                | ID  | Website        |
| -------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | --- | -------------- |
| Capiche                          | Capiche Crowdfunding Inc.          | Official provincial list(s): AMF, MB; aggregator (CSA-data based) shows in: All provinces/territories          | Start-up crowdfunding registration exemption (portal)               |     | capiche.fund   |
| Vested                           | Vested Technology Corp.            | Official provincial list(s): AMF, MB, NB; aggregator (CSA-data based) shows in: BC, AB, MB, SK, ON, QC, NB     | Start-up crowdfunding registration exemption (portal)               |     | vested.ca      |
| (Go Alberta Connect)             | Go Alberta Connect Corp.           | Official provincial list(s): none of AMF/MB/NB; aggregator (CSA-data based) shows in: BC, AB, SK, ON           | Start-up crowdfunding registration exemption (portal)               |     |                |
| GoTroo                           | Crowdco Inc.                       | Official provincial list(s): AMF, MB, NB; aggregator (CSA-data based) shows in: BC, AB, SK, MB, ON, QC, NB, NS | Start-up crowdfunding registration exemption (portal)               |     | gotroo.com     |
| Liquid Crowd                     | 9344-4289 Québec Inc.              | Official provincial list(s): AMF, NB; aggregator (CSA-data based) shows in: BC, AB, ON, QC, NB, NS             | Start-up crowdfunding registration exemption (portal)               |     | liquidcrowd.ca |
| REITIUM.fund                     | 1383364 B.C. Ltd.                  | Official provincial list(s): MB; aggregator (CSA-data based) shows in: BC, AB, MB, ON                          | Start-up crowdfunding registration exemption (portal)               |     | reitium.fund   |
| Wayblaze                         | Wayblaze Crowdfunding Inc.         | Official provincial list(s): AMF, MB; aggregator (CSA-data based) shows in: BC, AB, MB, ON, QC, NB, NS         | Start-up crowdfunding registration exemption (portal)               |     | wayblaze.com   |
| (Backers Securities)             | Backers Securities Inc.            | Official provincial list(s): none of AMF/MB/NB; aggregator (CSA-data based) shows in: BC, ON                   | Start-up crowdfunding registration exemption (portal)               |     |                |
| FrontFundr (SMV Capital Markets) | FrontFundr Financial Services Inc. | Official provincial list(s): AMF, MB, NB; aggregator (CSA-data based) shows in: BC, AB, SK, MB, ON, QC, NB, NS | Registered exempt market dealer (prospectus-exempt offering portal) |     | frontfundr.com |
| Equivesto                        | Equivesto Canada Inc.              | Official provincial list(s): AMF; aggregator (CSA-data based) shows in: All provinces/territories              | Registered exempt market dealer                                     |     | equivesto.com  |
| Ascenta                          | Ascenta Finance Corp.              | Official provincial list(s): none of AMF/MB/NB; aggregator (CSA-data based) shows in: BC, AB, SK, MB, ON       | Registered exempt market dealer                                     |     |                |
| Atlas One                        | Atlas One Digital Securities       | Official provincial list(s): none of AMF/MB/NB; aggregator (CSA-data based) shows in: BC, AB, SK, ON           | Registered exempt market dealer                                     |     |                |

**Listed as not operating (4):**

| Brand                   | Legal entity                   | Status (as of source)                       | Type                                            | ID  | Website |
| ----------------------- | ------------------------------ | ------------------------------------------- | ----------------------------------------------- | --- | ------- |
| Our Trajectory Platform | Our Trajectory Platform Inc.   | Holds exemption but listed as not operating | Start-up crowdfunding exemption (not operating) |     |         |
| Stockosaurus            | Stockosaurus Crowdfunding Inc. | Holds exemption but listed as not operating | Start-up crowdfunding exemption (not operating) |     |         |
| Launch Crowdfunding     | Launch Crowdfunding Corp.      | Holds exemption but listed as not operating | Start-up crowdfunding exemption (not operating) |     |         |
| (unnamed)               | 1000232096 Ontario Inc.        | Holds exemption but listed as not operating | Start-up crowdfunding exemption (not operating) |     |         |

**Unverified (company, press or third-party claim only) (3):**

| Brand            | Legal entity                                            | Status (as of source)                                                                      | Type                                                | ID  | Website |
| ---------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------- | --- | ------- |
| RealStarter      | 9338-0277 Québec Inc.                                   | Named on FCNB (NB) / AMF (QC) pages but absent from equitycrowd.fund list - possibly stale | Start-up crowdfunding exemption (status unverified) |     |         |
| CanaDragon ECFEX | (CanaDragon Enterprise Equity Crowdfunding Interchange) | Named on FCNB (NB) / AMF (QC) pages but absent from equitycrowd.fund list - possibly stale | Start-up crowdfunding exemption (status unverified) |     |         |
| Consider Funding | Consider Funding Inc.                                   | Named on FCNB (NB) / AMF (QC) pages but absent from equitycrowd.fund list - possibly stale | Start-up crowdfunding exemption (status unverified) |     |         |

#### Peru (4 records)

SMV SIMV directory lists exactly 3 authorised societies; a fourth holds an organisation authorisation only. Press counts differ.

Sources: - SMV resolutions on gob.pe (see per-row) https://www.gob.pe/institucion/smv/normas-legales/6253980-141-2024-smv-02 ; directory https://www.smv.gob.pe/SIMV/Frm_SabDirectorio_Safm?data=CE09D88094DF5635D71EA53E3629E731B1E796FA61 (browser-read 2026-10-30: exactly 3 societies listed)<br>- https://procapitales.org/blogs/alerta-legal/autorizan-funcionamiento-de-administradora-de-crowdfunding-en-la-modalidad-de-prestamos (secondary summary of El Peruano resolution) ; directory https://www.smv.gob.pe/SIMV/Frm_SabDirectorio_Safm?data=CE09D88094DF5635D71EA53E3629E731B1E796FA61 (browser-read 2026-10-30: exactly 3 societies listed)<br>- https://www.gob.pe/institucion/smv/normas-legales/6870930-02-2025-smv-12-1<br>- https://www.gob.pe/institucion/smv/normas-legales/tipos/947-resolucion-de-superintendente ; directory https://www.smv.gob.pe/SIMV/Frm_SabDirectorio_Safm?data=CE09D88094DF5635D71EA53E3629E731B1E796FA61 (browser-read 2026-10-30: exactly 3 societies listed)
Source date(s): 2026-10-30

**Registered or listed (trading/activity not verified) (3):**

| Brand          | Legal entity                                                                                           | Status (as of source)                                                           | Type                           | ID  | Website |
| -------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ------------------------------ | --- | ------- |
| Prestópolis    | PRESTÓPOLIS Sociedad Administradora de Plataforma de Financiamiento Participativo Financiero S.A.C.    | Authorised to operate (RSup 141-2024-SMV/02, 4 Dec 2024)                        | Lending (préstamos)            |     |         |
| SECURITE       | SECURITE Sociedad Administradora de Plataforma de Financiamiento Participativo Financiero S.A.C.       | Authorised to operate (RSup 065-2026-SMV/02, published 17 Jun 2026)             | Lending (préstamos)            |     |         |
| Inversiones.io | INVERSIONES.IO Sociedad Administradora de Plataforma de Financiamiento Participativo Financiero S.A.C. | Authorised; extended to securities modality (RSup 076-2026-SMV/02, 17 Jul 2026) | Lending + securities (valores) |     |         |

**Pending, applied or not granted (1):**

| Brand                                             | Legal entity               | Status (as of source)                                                                                     | Type | ID  | Website |
| ------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------- | ---- | --- | ------- |
| Music Securities Inc. / Cooperativa Abaco venture | (new SAFP being organised) | Organisation authorisation only (RIG 02-2025-SMV/12.1, 13 Jun 2025); operating authorisation not verified |      |     |         |

#### Colombia (1 records)

a2censo (Bolsa de Valores de Colombia) confirmed; no SFC platform list found.

Sources: https://www.superfinanciera.gov.co/loader.php?idFile=1079432&lFuncion=descargar&lServicio=Tools2&lTipo=descargas ; https://www.bvc.com.co/que-es-a2censo
Source date(s): 2026-10-30

**Registered or listed (trading/activity not verified) (1):**

| Brand   | Legal entity                            | Status (as of source)                                                      | Type                                              | ID  | Website                               |
| ------- | --------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------- | --- | ------------------------------------- |
| a2censo | Bolsa de Valores de Colombia S.A. (BVC) | Operating; BVC platform, regulation amended by SFC Res. 1877 of 7 Oct 2025 | Financiación colaborativa (debt/ working-capital) |     | https://www.bvc.com.co/que-es-a2censo |

#### Uruguay (1 records)

Crowder: BCU authorisation Jan 2024 per press; the BCU page lists issuers only.

Sources: https://www.elobservador.com.uy/economia-y-empresas/el-banco-central-flexibilizo-la-regulacion-del-financiamiento-colectivo-que-cambia-y-quien-beneficia-n6009925
Source date(s): 2026-10-30

**Unverified (company, press or third-party claim only) (1):**

| Brand   | Legal entity                         | Status (as of source)                       | Type                                       | ID  | Website |
| ------- | ------------------------------------ | ------------------------------------------- | ------------------------------------------ | --- | ------- |
| Crowder | Crowder (legal entity not extracted) | Only platform registered with BCU per press | Collective financing platform (Ley 19.820) |     |         |

#### Argentina (1 records)

CNV search is name-only behind reCAPTCHA (not bypassed). ProBolsa self-reports PFC Registro 1; the full register was not extracted.

Sources: https://pfc.probolsa.com.ar/institucional
Source date(s): 2026-10-30

**Unverified (company, press or third-party claim only) (1):**

| Brand                                    | Legal entity | Status (as of source)                                                                                | Type                                                            | ID                 | Website             |
| ---------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------ | ------------------- |
| ProBolsa (Bolsa de Comercio de La Plata) |              | Self-reported: registered as PFC, Registro Nro 1, 15 Nov 2018 (own website; CNV record not verified) | Plataforma de Financiamiento Colectivo (CNV Gen. Res. 757/2018) | Registro PFC Nro 1 | pfc.probolsa.com.ar |

#### Ecuador (1 records)

Sources: https://crowdfunding.ec/acerca-de-nosotros/
Source date(s): 2026-10-30

**Unverified (company, press or third-party claim only) (1):**

| Brand                | Legal entity                       | Status (as of source)                                                                                                                                                                            | Type                                          | ID                | Website         |
| -------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- | ----------------- | --------------- |
| Crowdfunding Ecuador | CROWDFUNDING-ECUADOR S.A.S. B.I.C. | Self-reported: first platform under Ley Orgánica de Emprendimiento e Innovación, supervised by Superintendencia de Compañías; registro societario 2650 (own site, not verified in SCVS register) | Crowdfunding platform (company law framework) | RUC 1191794032001 | crowdfunding.ec |

#### Bahamas (1 records)

ArawakX is historical: SCB petitioned for a provisional liquidator (Oct 2023) and it is not in the SIA registrants list as at 31 Dec 2025.

Sources: https://scb.gov.bs/wp-content/uploads/2025/11/Decision-on-Application-to-Appoint-a-Provisional-Liquidator.pdf ; https://scb.gov.bs/wp-content/uploads/2026/01/SIA-Firms-as-at-31-December-2025-1.pdf ; https://ewnews.com/arawakx-to-be-first-licensed-equity-crowdfunding-platform-in-the-bahamas/
Source date(s): 2026-10-30

**Cancelled, withdrawn, ceased or historical (1):**

| Brand   | Legal entity                      | Status (as of source)                                                                                                                                                                                                                                            | Type                             | ID  | Website |
| ------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | --- | ------- |
| ArawakX | MDollaz Ltd. (trading as ArawakX) | HISTORICAL/ENFORCEMENT: 2021 press called it first licensed equity crowdfunding platform (Registered Marketplace and Clearing Facility); SCB petitioned the Supreme Court for a provisional liquidator in Oct 2023; not in SCB SIA registrants as at 31 Dec 2025 | Equity crowdfunding (historical) |     |         |

#### Venezuela (1 records)

Sources: https://www.bancaynegocios.com/plataforma-pidelo-ha-otorgado-mas-de-5-000-financiamientos-a-microempresarios-con-3-de-morosidad/
Source date(s): 2026-10-30

**Unverified (company, press or third-party claim only) (1):**

| Brand                                   | Legal entity | Status (as of source)                                                                                   | Type | ID  | Website |
| --------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------- | ---- | --- | ------- |
| Pídelo (Moore GSF / Alalza Inversiones) |              | Press: social lending initiative presented at Caracas stock exchange; SUNAVAL registration not verified |      |     |         |

### Europe (non-EU)

#### Russia (138 records)

Full Bank of Russia 259-FZ register: 102 active and 36 removed operators. The register includes banks and registrars (flagged in the CSV, not verified as crowdfunding brands); the equity/lending split per operator is not provided. Registration, not activity.

Sources: Bank of Russia register of investment platform operators, official xlsx https://www.cbr.ru/vfs/finmarkets/files/supervision/list_invest_platform_op.xlsx, as of 30.10.2026
Source date(s): 2026-10-30

**Registered or listed (trading/activity not verified) (102):**

| Brand                                                                        | Legal entity                                                                                                 | Status (as of source) | Type                                                                                     | ID                                  | Website                                                                  |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| АО «НРК - Р.О.С.Т.»                                                          | Акционерное общество «Независимая регистраторская компания Р.О.С.Т.»                                         | Active in register    | Register entry, bank/registrar-type operator - NOT verified as a crowdfunding brand      | OGRN 1027739216757 / INN 7726030449 | www.rrost.ru                                                             |
| ООО "Поток.Диджитал"                                                         | Общество с ограниченной ответственностью "Поток.Диджитал"                                                    | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1167746721735 / INN 9701046627 | potok.digital                                                            |
| ООО "Платформа №1"                                                           | Общество с ограниченной ответственностью "Платформа №1"                                                      | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1197746646415 / INN 9731055001 | www.pln.one                                                              |
| ООО "Ко-Фи"                                                                  | Общество с ограниченной ответственностью "Ко-Фи"                                                             | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1027700587991 / INN 7710343735 | www.cofi.ru                                                              |
| АО "СРК"                                                                     | акционерное общество "Специализированный Регистратор "КОМПАС"                                                | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1024201467510 / INN 4217027573 | www.in-ko.ru;www.zao-srk.ru                                              |
| АО "ИнвеСтор"                                                                | Акционерное общество "ИнвеСтор"                                                                              | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1223300003563 / INN 3327149357 | https://lucros.ru/                                                       |
| ООО "ВРЕМЯДЕНЬГИ"                                                            | Общество с ограниченной ответственностью "ВРЕМЯДЕНЬГИ"                                                       | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1197232030214 / INN 7203494485 | https://vremyadengi.pro                                                  |
| ООО "ВДЕЛО"                                                                  | Общество с ограниченной ответственностью "Инвестиционная платформа "ВДЕЛО"                                   | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1206600030647 / INN 6623134596 | https://vdelo.pro/                                                       |
| ООО "ФЛАГМАНКРАУД"                                                           | ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ФЛАГМАНКРАУД"                                                      | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1186196015510 / INN 6163209391 | https://moneyfriends.ru/;https://flagmancrowd.ru/                        |
| ООО "Феир Финанс"                                                            | Общество с ограниченной ответственностью "Феир Финанс"                                                       | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1187746872830 / INN 7703466101 | https://fairfin.ru/                                                      |
| ООО "МодульДеньги"                                                           | Общество с ограниченной ответственностью "МодульДеньги"                                                      | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1177746930844 / INN 9715306032 | https://mdfin.ru                                                         |
| ООО "ДжетЛенд"                                                               | Общество с ограниченной ответственностью "ДжетЛенд"                                                          | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1187746779868 / INN 7724451748 | https://jetlend.ru                                                       |
| ООО "THEДЕНЬГИ.РУ"                                                           | Общество с ограниченной ответственностью "THEДЕНЬГИ.РУ"                                                      | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1207700149480 / INN 9725032278 | www.thedengi.ru                                                          |
| ООО "СИМПЛ ЭСТЭЙТ"                                                           | Общество с ограниченной ответственностью "СИМПЛ ЭСТЭЙТ"                                                      | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1197746322289 / INN 7707430579 | www.simpleestate.ru                                                      |
| ООО "Терраса"                                                                | Общество с ограниченной ответственностью "Терраса"                                                           | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1207800092367 / INN 7842182925 | https://terrace.center/                                                  |
| АО "СТАТУС"                                                                  | Акционерное общество "Регистраторское общество "СТАТУС"                                                      | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1027700003924 / INN 7707179242 | www.rostatus.ru;https://platform.rostatus.ru;https://www.dfa.rostatus.ru |
| ООО "ЛЭНДЭР-ИНВЕСТ"                                                          | ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ЛЭНДЭР-ИНВЕСТ"                                                     | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1197746236610 / INN 9718134092 | http://lender-invest.ru/                                                 |
| ООО "Кредит.Клаб"                                                            | Общество с ограниченной ответственностью "Кредит.Клаб"                                                       | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1196658084743 / INN 6678105594 | https://credit.club                                                      |
| АО "Реестр"                                                                  | Акционерное общество "Реестр"                                                                                | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1027700047275 / INN 7704028206 | www.aoreestr.ru                                                          |
| ООО "НИП"                                                                    | Общество с ограниченной ответственностью "Национальная инвестиционная платформа"                             | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1197746651937 / INN 9709056218 | https://нип.рф                                                           |
| АО "Новый регистратор"                                                       | Акционерное общество "Новый регистратор"                                                                     | Active in register    | Register entry, bank/registrar-type operator - NOT verified as a crowdfunding brand      | OGRN 1037719000384 / INN 7719263354 | www.newreg.ru                                                            |
| АО «ДРАГА»                                                                   | Акционерное общество «Специализированный регистратор - Держатель реестров акционеров газовой промышленности» | Active in register    | Register entry, bank/registrar-type operator - NOT verified as a crowdfunding brand      | OGRN 1037739162240 / INN 7704011964 | draga.ru                                                                 |
| ООО ИП "МК"                                                                  | Общество с ограниченной ответственностью Инвестиционная платформа "Мой капитал"                              | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1207700174340 / INN 7734434526 | движ-инвест.рф;движ-проект.рф                                            |
| АО ВТБ Регистратор                                                           | Акционерное общество ВТБ Регистратор                                                                         | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1045605469744 / INN 5610083568 | www.vtbreg.com                                                           |
| ООО "Лендли"                                                                 | Общество с ограниченной ответственностью "Лендли"                                                            | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1187847185140 / INN 7814733360 | https://lendly.ru                                                        |
| ООО "Инвестори"                                                              | Общество с ограниченной ответственностью "Инвестори"                                                         | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1167847355280 / INN 7842116506 | www.investore.club                                                       |
| АО "Раундс"                                                                  | Акционерное общество "Раундс"                                                                                | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1247700137739 / INN 9731130361 | https://rounds.ru                                                        |
| ООО "СмартИнвест"                                                            | Общество с ограниченной ответственностью "СмартИнвест"                                                       | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1197746721556 / INN 9715371401 | www.smally.me                                                            |
| ООО "Регистратор "Гарант"                                                    | Общество с ограниченной ответственностью "Регистратор "Гарант"                                               | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 5137746173296 / INN 7703802628 | www.reggarant.ru; https://invest.reggarant.ru                            |
| ООО "Пирс. Оператор прямых инвестиций"                                       | Общество с ограниченной ответственностью "Пирс. Оператор прямых инвестиций"                                  | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1177746678922 / INN 7731375304 | https://peers.money                                                      |
| ООО "СтрИж"                                                                  | Общество с ограниченной ответственностью "СтрИж"                                                             | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1021801653587 / INN 1835022084 | www.strizhinvest.ru                                                      |
| ООО "ИнсайтФинанс"                                                           | Общество с ограниченной ответственностью "ИнсайтФинанс"                                                      | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1135904000430 / INN 5904281530 | http://panfilovinvest.ru                                                 |
| ООО "Точка Инвестиции"                                                       | Общество с ограниченной ответственностью "Точка Инвестиции"                                                  | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1217700052349 / INN 9704047428 | https://tochka.com/investment                                            |
| ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "НАРОДНАЯ ИНВЕСТИЦИОННАЯ ПЛАТФОРМА" | ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "НАРОДНАЯ ИНВЕСТИЦИОННАЯ ПЛАТФОРМА"                                 | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1217700173272 / INN 9704059818 | https://nip.moscow                                                       |
| АО "ИНВЕСТМЕН"                                                               | АКЦИОНЕРНОЕ ОБЩЕСТВО "ИНВЕСТИЦИОННАЯ ПЛАТФОРМА "ИНВЕСТМЕН"                                                   | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1257300007062 / INN 7300045904 | https://investmen.pro                                                    |
| ПАО "НФК-СБЕРЕЖЕНИЯ"                                                         | ПУБЛИЧНОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО "ИНВЕСТИЦИОННАЯ КОМПАНИЯ "НФК-СБЕРЕЖЕНИЯ"                                     | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1172130010667 / INN 2130190797 | nfksber.ru;zberopolis.ru                                                 |
| ООО "Новые финансовые технологии"                                            | Общество с ограниченной ответственностью "Новые финансовые технологии"                                       | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1147746688044 / INN 7704866335 | www.invoice.cafe                                                         |
| ООО «БАРКЛАЙ ФИНАНС»                                                         | Общество с ограниченной ответственностью «БАРКЛАЙ ФИНАНС»                                                    | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1217700451429 / INN 9729313833 | barclay-finance.ru                                                       |
| ООО "Капитализация"                                                          | Общество с ограниченной ответственностью "Капитализация"                                                     | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1217700498399 / INN 9722009697 | http://zapusk.tech/                                                      |
| АО "МРЦ"                                                                     | Акционерное общество "Межрегиональный регистраторский центр"                                                 | Active in register    | Register entry, bank/registrar-type operator - NOT verified as a crowdfunding brand      | OGRN 1021900520883 / INN 1901003859 | www.mrz.ru;www.cfa.mrz.ru                                                |
| АО "Оператор платформы ЭЦБ"                                                  | Акционерное общество "Оператор инвестиционной платформы эмиссионных ценных бумаг"                            | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1212300055516 / INN 2311324509 | https://investment-platforma.com                                         |
| ООО "МТС Звёзды"                                                             | Общество с ограниченной ответственностью "МТС Звёзды"                                                        | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1207700415856 / INN 9709066791 | starsup.cfahub.ru                                                        |
| ООО "ОИПП"                                                                   | Общество с ограниченной ответственностью "Оператор инвестиционной платформы ПРИОРИТИ"                        | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1217700364430 / INN 9725056342 | https://ippriority.ru                                                    |
| ООО "ИП "ВДОЛЕ"                                                              | Общество с ограниченной ответственностью "Инвестиционная Платформа "ВДОЛЕ"                                   | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1195081075166 / INN 5007108718 | https://vdole.co                                                         |
| ООО "МагнумИнвест"                                                           | Общество с ограниченной ответственностью "МагнумИнвест"                                                      | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1201800024480 / INN 1841096768 | https://magnuminvest.ru/                                                 |
| АО "Финансовая платформа БИЗМОЛЛ"                                            | Акционерное общество "Финансовая платформа БИЗМОЛЛ"                                                          | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1217800196680 / INN 7840098900 | https://bizmall.ru                                                       |
| ООО "НибблИнвест"                                                            | Общество с ограниченной ответственностью "НибблИнвест"                                                       | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1225400017270 / INN 5406821800 | https://nibbleinvest.ru                                                  |
| ООО "Клик Инвест"                                                            | Общество с ограниченной ответственностью "Клик Инвест"                                                       | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1227700402962 / INN 9727002857 | www.qliqinvest.ru                                                        |
| ООО "ЕАР"                                                                    | Общество с ограниченной ответственностью "Евроазиатский Регистратор"                                         | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1021603631224 / INN 1660055801 | www.earc.ru                                                              |
| АО "РТ-Регистратор"                                                          | Акционерное общество "РТ-Регистратор"                                                                        | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1025403189790 / INN 5407175878 | www.rtreg.ru                                                             |
| ООО "ЦИП"                                                                    | Общество с ограниченной ответственностью "Цифровая Инвестиционная Платформа"                                 | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1175024008114 / INN 5032272221 | https://bitrussia.ru                                                     |
| ООО "ПФЛ Новые инвестиции"                                                   | Общество с ограниченной ответственностью "ПФЛ Новые инвестиции"                                              | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1227700204841 / INN 9705168471 | https://zorko-exchange.ru/                                               |
| ООО "Инвестра"                                                               | Общество с ограниченной ответственностью "Инвестра"                                                          | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1222300032470 / INN 2312310925 | https://инвестра.рф                                                      |
| ООО "ИР"                                                                     | Общество с ограниченной ответственностью "ИР"                                                                | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1226200001664 / INN 6229099463 | https://инвестиции-россии.рф                                             |
| ООО "ЛАЙТ ФАКТОР"                                                            | Общество с ограниченной ответственностью "ЛАЙТ ФАКТОР"                                                       | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1206300040033 / INN 6316266350 | www.litefactor.ru                                                        |
| АО "БРЭЙНБОКС ВИСИ"                                                          | Акционерное общество "БРЭЙНБОКС ВИСИ"                                                                        | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1227700790943 / INN 9703120210 | https://brainbox.vc/                                                     |
| АО "РеМани"                                                                  | Акционерное общество "РеМани"                                                                                | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1237700038267 / INN 9721195680 | https://remoney.tech                                                     |
| АО "ПЛАТФОРИУМ"                                                              | Акционерное общество "ПЛАТФОРИУМ"                                                                            | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1237700161357 / INN 9715443230 | https://www.platforium.ru                                                |
| ООО "Инвестиционная В2В Платформа "Деньги в дело""                           | Общество с ограниченной ответственностью "Инвестиционная В2В Платформа "Деньги в дело""                      | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1225900012997 / INN 5902063569 | https://www.dengivdelo.ru                                                |
| ООО "АЕВА-Рус"                                                               | Общество с ограниченной ответственностью "АЕВА-Рус"                                                          | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1167746684775 / INN 9710014815 | https://jofin.ru                                                         |
| ООО "Финтехнология"                                                          | Общество с ограниченной ответственностью "Финтехнология"                                                     | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1227700438789 / INN 9723162151 | https://fintekhnologia.ru                                                |
| ООО "Инвест"                                                                 | Общество с ограниченной ответственностью "Инвест"                                                            | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1237700421045 / INN 9710116334 | https://инвест.рф/                                                       |
| ООО ИК "БУШМАН"                                                              | Общество с ограниченной ответственностью Инвестиционная компания "БУШМАН"                                    | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1226600075888 / INN 6658558846 | http://bushman.ru                                                        |
| ОOO "Т-ИНВЕСТ ЛАБ"                                                           | ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "Т-ИНВЕСТ ЛАБ"                                                      | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1207700043198 / INN 7743330386 | https://t-investlab.ru/                                                  |
| АО «ВенчурПрофи»                                                             | Акционерное общество «ВенчурПрофи»                                                                           | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1237700465507 / INN 9707003281 | https://venchurprofi.ru/                                                 |
| ООО "СтартИнвестиции"                                                        | Общество с ограниченной ответственностью "СтартИнвестиции"                                                   | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1237800106334 / INN 7840108500 | https://start-investment.pro                                             |
| ООО "ДРАФТЕР"                                                                | Общество с ограниченной ответственностью "ДРАФТЕР"                                                           | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1217700172360 / INN 9701175326 | https://drafter.ru/                                                      |
| ООО "РЕСЕЙЛ-ИНВЕСТ"                                                          | ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "РЕСЕЙЛ-ИНВЕСТ"                                                     | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1235000075034 / INN 5001153538 | https://resale-invest.ru                                                 |
| ООО "Луч"                                                                    | Общество с ограниченной ответственностью "Луч"                                                               | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1237700599190 / INN 9701258903 | https://llc-luch.ru                                                      |
| ООО "КФИ"                                                                    | Общество с ограниченной ответственностью "Краудфандинговые инвестиции"                                       | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1227700336698 / INN 7734455406 | www.crowdfin.ru                                                          |
| АО "Краудсид"                                                                | Акционерное общество "Краудсид"                                                                              | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1247700363570 / INN 9718258404 | https://kraudsid.ru                                                      |
| ООО "ИнвестТех Будущего"                                                     | Общество с ограниченной ответственностью "ИнвестТех Будущего"                                                | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1242500019695 / INN 2540287087 | https://aurorainvest.ru                                                  |
| ООО "Реестр-РН"                                                              | Общество с ограниченной ответственностью "Реестр-РН"                                                         | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1027700172818 / INN 7705397301 | www.reestrrn.ru                                                          |
| ООО "Фритрейн"                                                               | Общество с ограниченной ответственностью "Фритрейн"                                                          | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1156658084560 / INN 6671025780 | https://плип.рф/                                                         |
| АО "Две груши"                                                               | Акционерное общество "Две груши"                                                                             | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1247700491477 / INN 9717165933 | https://две-груши.рф                                                     |
| ООО "ПАПАПЛАТИТ"                                                             | Общество с ограниченной ответственностью "ПАПАПЛАТИТ"                                                        | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1227800018082 / INN 7817119486 | https://papaplatit.com                                                   |
| ООО "Каркаул.ру"                                                             | Общество с ограниченной ответственностью "Каркаул.ру"                                                        | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1237700033999 / INN 9725111265 | https://karkaul.ru                                                       |
| ООО "Кономика-займы для бизнеса"                                             | Общество с ограниченной ответственностью "Кономика-займы для бизнеса"                                        | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1247700302618 / INN 9728131284 | http://conomica-finance.ru                                               |
| АО "Сервис-Реестр"                                                           | Акционерное общество "Сервис-Реестр"                                                                         | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1028601354055 / INN 8605006147 | www.servis-reestr.ru                                                     |
| ООО "КВАЛИТИ"                                                                | ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "КВАЛИТИ"                                                           | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1247700395084 / INN 9705225585 | https://quality-invest.ru/                                               |
| ООО ИП "Финтрек"                                                             | Общество с ограниченной ответственностью Инвестиционная платформа "Финтрек"                                  | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1245900009090 / INN 5903160438 | https://финтрек.рф/                                                      |
| АО "ДОЛЯ РОСТА"                                                              | АКЦИОНЕРНОЕ ОБЩЕСТВО "ДОЛЯ РОСТА"                                                                            | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1246600053941 / INN 6623146802 | partnerfinance.pro;vdeloinvest.ru;dlrst.ru                               |
| ООО "ЛОЙК АП"                                                                | Общество с ограниченной ответственностью "ЛОЙК АП"                                                           | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1247700810158 / INN 7720942400 | https://www.loyqup.ru/                                                   |
| ООО "Лови Волну"                                                             | Общество с ограниченной ответственностью "Лови Волну"                                                        | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1245900010070 / INN 5904411099 | https://volnu.ru/                                                        |
| АО "Инвестиционная платформа "Хедлайнер"                                     | Акционерное общество "Инвестиционная платформа "Хедлайнер"                                                   | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1257700129147 / INN 9703207728 | http://hedlainer.ru/                                                     |
| ООО "ВБ ИНВЕСТ"                                                              | ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ВБ ИНВЕСТ"                                                         | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1255000000122 / INN 5074092492 | invest.wildberries.ru                                                    |
| ООО "ВБЕТОН"                                                                 | ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ВБЕТОН"                                                            | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1257700008290 / INN 9701305215 | https://vbeton.ru/                                                       |
| ООО "ЗАЛОГОТЕКА"                                                             | ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ЗАЛОГОТЕКА"                                                        | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1230200027221 / INN 0276976382 | https://zalogoteka.ru                                                    |
| ООО "ПЛАТФОРМА"                                                              | ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ПЛАТФОРМА"                                                         | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1246600019753 / INN 6678136497 | https://id-platform.ru                                                   |
| ООО "ЕДИНЫЕ БАНКОВСКИЕ ТЕХНОЛОГИИ"                                           | ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСВЕННОСТЬЮ "ЕДИНЫЕ БАНКОВСКИЕ ТЕХНОЛОГИИ"                                       | Active in register    | Register entry, bank/registrar-type operator - NOT verified as a crowdfunding brand      | OGRN 1231600015240 / INN 1683012794 | https://ef-bank.ru/                                                      |
| ООО "ДЖЕНЕРАЛ ИНВЕСТ"                                                        | ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ДЖЕНЕРАЛ ИНВЕСТ"                                                   | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1252100002417 / INN 2100024513 | https://план-е.рф                                                        |
| ООО "КЛАБИКО"                                                                | ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "КЛАБИКО"                                                           | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1247700719078 / INN 9715497242 | https://clubico.co/                                                      |
| ООО "ИФГ ПРЕМЬЕР"                                                            | ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ИНВЕСТИЦИОННО-ФИНАНСОВАЯ ГРУППА ПРЕМЬЕР"                           | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1167456111558 / INN 7448195500 | http://bbkinvest.ru/                                                     |
| ООО "АЛЬТЕРЗАЙМ"                                                             | ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "АЛЬТЕРЗАЙМ"                                                        | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1117604019675 / INN 7604215530 | www.alterzaym.ru                                                         |
| ООО "ТЕХНОЛОГИЯ РАЗВИТИЯ"                                                    | ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ТЕХНОЛОГИЯ РАЗВИТИЯ"                                               | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1257700461842 / INN 9727115554 | https://tehnologiya-razvitiya.ru/                                        |
| ООО "БАНАН ЯГИ"                                                              | ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "БАНАН ЯГИ"                                                         | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1235900007947 / INN 5903156505 | Bananygi.ru                                                              |
| ООО "ПЛАТФОРМА РОСТА"                                                        | ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ПЛАТФОРМА РОСТА"                                                   | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1257700442284 / INN 9701319345 | https://platforma-rosta.ru                                               |
| ООО "КОПИРАЙТ ИНВЕСТ"                                                        | ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "КОПИРАЙТ ИНВЕСТ"                                                   | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1257700229588 / INN 9703212291 | https://copyrightinvest.ru                                               |
| ООО "СИСТЕМА"                                                                | ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "СИСТЕМА"                                                           | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1267700012535 / INN 9729414447 | https://oipsystema.ru                                                    |
| ООО "ИНВЕСТИЦИОННАЯ ПЛАТФОРМА "МЕЦЕЯРД"                                      | ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ИНВЕСТИЦИОННАЯ ПЛАТФОРМА "МЕЦЕЯРД"                                 | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1269600004740 / INN 6685231575 | https://mcd-invest.ru                                                    |
| ООО "МЕТРМС"                                                                 | ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "МЕТРМС"                                                            | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1257700266977 / INN 7743472743 | metr-ms.ru                                                               |
| АО «ФИНАНСОВАЯ КУЛЬТУРА»                                                     | АКЦИОНЕРНОЕ ОБЩЕСТВО «ФИНАНСОВАЯ КУЛЬТУРА»                                                                   | Active in register    | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1267700108125 / INN 9705254811 | http://interes-invest.ru/                                                |

**Cancelled, withdrawn, ceased or historical (36):**

| Brand                                            | Legal entity                                                                                      | Status (as of source)                                                     | Type                                                                                     | ID                                  | Website                                     |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------- |
| ООО "Технологии кредитования"                    | Общество с ограниченной ответственностью "Технологии кредитования"                                | Removed from register on 27.12.2021 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1187746782519 / INN 7736317458 | sberkredo.ru                                |
| ООО "ЛЕМОН ОНЛАЙН"                               | Общество с ограниченной ответственностью "ЛЕМОН ОНЛАЙН"                                           | Removed from register on 08.12.2022 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1197746536888 / INN 9731051046 | https://lemon.online                        |
| ООО "Инвестируй В"                               | Общество с ограниченной ответственностью "Инвестируй В"                                           | Removed from register on 22.08.2025 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1187746531940 / INN 9710061734 | https://investin.vc/                        |
| ООО "Город Денег"                                | Общество с ограниченной ответственностью "Город Денег"                                            | Removed from register on 17.12.2024 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 5167746417977 / INN 9718038991 | townmoney.ru                                |
| ООО "Инкрауд"                                    | Общество с ограниченной ответственностью "Инкрауд"                                                | Removed from register on 10.10.2024 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1197746716298 / INN 9704007489 | https://incrowd.ru/                         |
| АО "Инвестиционная платформа Крым"               | Акционерное общество "Инвестиционная платформа Крым"                                              | Removed from register on 04.08.2022 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1189112035672 / INN 9102248286 | www.invest-krym.ru                          |
| ООО "Близкие Горизонты-Инвестиционная платформа" | Общество с ограниченной ответственностью "Близкие Горизонты-Инвестиционная платформа"             | Removed from register on 18.08.2022 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1207700030108 / INN 9731060266 | www.nhip.ru                                 |
| ООО "Крауд Инвест"                               | Общество с ограниченной ответственностью "Крауд Инвест"                                           | Removed from register on 19.05.2026 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1207700187793 / INN 7713475803 | http://crowd-money.ru                       |
| ООО "Инвест Гоу"                                 | Общество с ограниченной ответственностью "Инвест Гоу"                                             | Removed from register on 05.05.2026 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1177746958619 / INN 7720394256 | www.investgo.ru                             |
| АО "Лендберри"                                   | Акционерное общество "Лендберри"                                                                  | Removed from register on 11.07.2022 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1227800020106 / INN 7810940100 | lendberry.ru                                |
| АО "Пененза"                                     | Акционерное общество "Пененза"                                                                    | Removed from register on 03.10.2025 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1157746288590 / INN 7725268086 | https://penenza.ru; https://tenboost.ru     |
| ООО "ФИНИН-К"                                    | Общество с ограниченной ответственностью "ФИНИН-К"                                                | Removed from register on 05.02.2026 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1057748260350 / INN 7705687113 | https://финин.рф/                           |
| ООО ПТЦ                                          | Общество с ограниченной ответственностью «Петербургский технический центр»                        | Removed from register on 28.10.2026 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1077847456609 / INN 7841364200 | www.ptcbroker.ru;https://crowd.ptcbroker.ru |
| ООО "ОИП Элеватор"                               | Общество с ограниченной ответственностью "ОИП Элеватор"                                           | Removed from register on 17.02.2023 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1207700405076 / INN 9715391969 | https://elevator.market                     |
| ООО "К Финанс"                                   | Общество с ограниченной ответственностью "К Финанс"                                               | Removed from register on 24.10.2023 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1217700216084 / INN 9704063780 | https://www.kfinance.ru                     |
| ООО "АтомИнвест"                                 | Общество с ограниченной ответственностью "АтомИнвест"                                             | Removed from register on 29.08.2023 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 5177746064942 / INN 7720398363 | https://atominvest.ru/                      |
| ООО "Новые цифровые технологии"                  | Общество с ограниченной ответственностью "Новые цифровые технологии"                              | Removed from register on 15.06.2026 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1215000008530 / INN 5024210768 | https://investgate.ru                       |
| АО "ГЕТАП"                                       | АКЦИОНЕРНОЕ ОБЩЕСТВО "ГЕТАП"                                                                      | Removed from register on 12.07.2024 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1247700440833 / INN 9726078356 | https://getup.ru                            |
| ООО "УДАЛТОН ИНВЕСТИЦИИ"                         | Общество с ограниченной ответственностью УДМУРТСКАЯ ПЛАТФОРМА ПО ПРИВЛЕЧЕНИЮ ИНВЕСТИЦИЙ "УДАЛТОН" | Removed from register on 26.04.2024 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1211800019133 / INN 1832162125 | udalton.ru                                  |
| ООО "Райп тех"                                   | Общество с ограниченной ответственностью "Райп тех"                                               | Removed from register on 25.12.2024 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1217700328636 / INN 9719017112 | https://up-cap.ru/                          |
| ООО "УК "Квадрат"                                | Общество с ограниченной ответственностью "Управляющая Компания "Квадрат"                          | Removed from register on 28.03.2025 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1217700399091 / INN 9725058011 | свойметр.рф                                 |
| ООО "ПроджектЛаб"                                | Общество с ограниченной ответственностью "ПроджектЛаб"                                            | Removed from register on 04.12.2023 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1227700847120 / INN 9722035746 | https://проджектлаб.рф                      |
| ООО "Веста-Инвест"                               | Общество с ограниченной ответственностью "Веста-Инвест"                                           | Removed from register on 03.10.2025 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1237800011712 / INN 7840104223 | https://vestainvest.ru                      |
| ООО "ТУДЕЙПРАЙС ИНВЕСТ"                          | Общество с ограниченной ответственностью "ТУДЕЙПРАЙС ИНВЕСТ"                                      | Removed from register on 12.02.2026 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1237800033789 / INN 7814820774 | http://todaypriceinvest.ru                  |
| ООО "Селект мани"                                | Общество с ограниченной ответственностью "Селект мани"                                            | Removed from register on 03.10.2025 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1237700133923 / INN 7708415799 | http://platform-profit.ru                   |
| ООО "КраудЮнит"                                  | Общество с ограниченной ответственностью "КраудЮнит"                                              | Removed from register on 09.07.2025 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1227700396956 / INN 9724088817 | http://i-do.investments/                    |
| ООО "ГрандБазар"                                 | Общество с ограниченной ответственностью "Инвестиционная платформа ГрандБазар"                    | Removed from register on 27.10.2025 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1239200001600 / INN 9200015995 | https://grandbazar.io/                      |
| ООО "Р2"                                         | Общество с ограниченной ответственностью "Р2"                                                     | Removed from register on 12.12.2024 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1227700706892 / INN 9703115386 | https://r2.capital/                         |
| ООО "7 ПРУДОВ ИНВЕСТИЦИИ"                        | Общество с ограниченной ответственностью "7 ПРУДОВ ИНВЕСТИЦИИ"                                    | Removed from register on 26.05.2025 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1216600053878 / INN 6670503917 | https://7invest.ru                          |
| ООО «УниБлок»                                    | Общество с ограниченной ответственностью «Универсальный Блокчейн»                                 | Removed from register on 14.09.2026 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1211600060264 / INN 1683000943 | https://islamcf.com                         |
| ООО "ПРОФИНВЕСТ"                                 | Общество с ограниченной ответственностью "ПРОФИНВЕСТ"                                             | Removed from register on 03.09.2026 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1237800105619 / INN 7840108475 | http://profinvest-info.ru                   |
| ООО "Покупаем Вместе"                            | Общество с ограниченной ответственностью "Покупаем Вместе"                                        | Removed from register on 12.10.2026 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1237700253295 / INN 9714007819 | https://pokupaemvmeste.ru/                  |
| ООО "СПД"                                        | Общество с ограниченной ответственностью "Системы пассивного дохода"                              | Removed from register on 28.03.2025 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1237800143547 / INN 7802948025 | https://spd.finance                         |
| ООО "ЭРА МП"                                     | Общество с ограниченной ответственностью "ЭРА МП"                                                 | Removed from register on 19.08.2026 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1227700070938 / INN 9725074310 | https://arrantia.ru                         |
| ООО "Крауда.ру"                                  | Общество с ограниченной ответственностью "Крауда.ру"                                              | Removed from register on 05.02.2026 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1237700856458 / INN 9726061031 | https://kraudex.ru/                         |
| ООО "ИНВЕСТО"                                    | ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ИНВЕСТО"                                                | Removed from register on 02.10.2026 (historical register entry - removed) | Investment platform operator (259-FZ); platform type (lending/equity/other) not verified | OGRN 1257700095509 / INN 7736367554 | http://investo.market/                      |

#### United Kingdom (76 records)

The FCA has no crowdfunding category. Firm pages were opened for all 15 named operators (status read 30 Oct 2026; activity-level permissions not read). The 45 P2P entries hold the Article 36H lending permission (FCA FOI2026/01642, Aug 2026) - the FCA does not say which are trading; 16 named firms had the permission cancelled. Permission-holder rows are not proof of a trading platform.

Sources: FCA FOI2026/01642 Annex A https://www.fca.org.uk/publication/fca/foi2026_01642-annex-a.csv (page https://www.fca.org.uk/freedom-information/information-firms-peer-peer-lending-permission-august-2026), 17 Aug 2026 ; FCA Financial Services Register, browser-checked 2026-10-30, https://register.fca.org.uk/s/search?q=<name>&type=Companies
Source date(s): 2026-10-30

**Registered or listed (trading/activity not verified) (57):**

| Brand                       | Legal entity                          | Status (as of source)                                                                                                                                                               | Type                                                                                                               | ID         | Website |
| --------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------- | ------- |
|                             | Abundance Investment Ltd              | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 525432 |         |
|                             | FUND OURSELVES LIMITED                | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 729238 |         |
|                             | Plend Limited                         | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 963328 |         |
|                             | Lendwise Ltd                          | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 782496 |         |
|                             | Lendy Ltd                             | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 743416 |         |
|                             | Elfin Market Ltd                      | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 788176 |         |
|                             | The House Crowd Limited               | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 725648 |         |
|                             | Loanpad Limited                       | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 741576 |         |
|                             | Blend Loan Network Limited            | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 913456 |         |
|                             | NESTER PLATFORM LTD                   | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 915346 |         |
|                             | Crowd2Fund Limited                    | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 623683 |         |
|                             | Crowdstacker Limited                  | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 648742 |         |
|                             | Fluro Platform Limited                | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 723151 |         |
|                             | Edinburgh Alternative Finance Limited | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 670991 |         |
|                             | Focus 2020 Limited                    | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 727214 |         |
|                             | Capitalstackers Limited               | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 722549 |         |
|                             | LANDLORDINVEST LIMITED                | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 660926 |         |
|                             | Folk2Folk Limited                     | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 720867 |         |
|                             | HNW Lending Limited                   | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 712956 |         |
|                             | Denmark Square Limited                | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 727325 |         |
|                             | Match the Cash Limited                | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 718844 |         |
|                             | rebuildingsociety.com Ltd             | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 656344 |         |
|                             | Proplend Ltd                          | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 726646 |         |
|                             | Relendex Limited                      | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 723117 |         |
|                             | Moneything Capital Limited            | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 703549 |         |
|                             | AVIATION AND TECH CAPITAL LTD         | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 724444 |         |
|                             | FundingSecure Ltd                     | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 698305 |         |
|                             | Kuflink Ltd                           | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 724890 |         |
|                             | Funding Circle Ltd                    | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 722513 |         |
|                             | E-MONEY CAPITAL LTD                   | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 231680 |         |
|                             | MORE LENDING SOLUTIONS LIMITED        | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 702503 |         |
|                             | Open Access Finance Ltd               | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 741896 |         |
|                             | Housemartin Property Limited          | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 668931 |         |
|                             | Business Loan Network Limited         | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 724062 |         |
|                             | Peer Funding Limited                  | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 668078 |         |
|                             | EdAid Ltd                             | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 673376 |         |
|                             | BRITISH PEARL LIMITED                 | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 674693 |         |
|                             | Gracombex Ltd                         | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 716455 |         |
|                             | EMONEYHUB LIMITED                     | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 787900 |         |
|                             | Assetz SME Capital Limited            | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 724996 |         |
|                             | Share Credit Limited                  | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 719365 |         |
|                             | INVEST AND FUND LIMITED               | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 711378 |         |
|                             | Crowdestates Limited                  | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 723858 |         |
|                             | CROWD PROPERTY LIMITED                | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 723959 |         |
|                             | THIS BANK LIMITED                     | Authorised with Art. 36H permission (P2P) as of Aug 2026; FCA does not say which 35 are actively trading, 6 in administration/liquidation, 4 not primary business                   | Loan-based (P2P) - FCA permission "operating an electronic system in relation to lending"                          | FRN 832786 |         |
| Crowdcube                   | Crowdcube Capital Limited             | Authorised; "Public offer platform temporary permission"; register shows requirements/restrictions flag - opened firm page https://register.fca.org.uk/s/firm?id=001b000000egfGGAAY | Investment-based or loan-based crowdfunding operator (FCA has no crowdfunding category; permission scope not read) | FRN 650205 |         |
| Republic Europe (ex-Seedrs) | Seedrs Limited                        | FCA firm page: Status Authorised since 18/05/2012 (read 2026-10-30)                                                                                                                 | Investment-based or loan-based crowdfunding operator (FCA has no crowdfunding category; permission scope not read) | FRN 550317 |         |
| SyndicateRoom               | Syndicate Room Ltd                    | FCA firm page: Authorised since 18/03/2014                                                                                                                                          | Investment-based or loan-based crowdfunding operator (FCA has no crowdfunding category; permission scope not read) | FRN 613021 |         |
| Crowd for Angels            | Euston Securities Ltd                 | FCA firm page: Authorised since 01/12/2001                                                                                                                                          | Investment-based or loan-based crowdfunding operator (FCA has no crowdfunding category; permission scope not read) | FRN 176508 |         |
| CapitalRise                 | CapitalRise Finance Ltd               | FCA firm page: Authorised since 08/07/2020; FCA publishes clone warnings for fake CapitalRise sites                                                                                 | Investment-based or loan-based crowdfunding operator (FCA has no crowdfunding category; permission scope not read) | FRN 816789 |         |
| ShareIn                     | Share In Ltd                          | FCA firm page: Authorised since 19/06/2014                                                                                                                                          | Investment-based or loan-based crowdfunding operator (FCA has no crowdfunding category; permission scope not read) | FRN 603332 |         |
| WiseAlpha                   | WiseAlpha Technologies Ltd            | FCA firm page: Authorised since 15/09/2016                                                                                                                                          | Investment-based or loan-based crowdfunding operator (FCA has no crowdfunding category; permission scope not read) | FRN 751087 |         |
| Tifosy                      | Tifosy Ltd                            | FCA firm page: Authorised since 01/09/2016                                                                                                                                          | Investment-based or loan-based crowdfunding operator (FCA has no crowdfunding category; permission scope not read) | FRN 717605 |         |
| AxiaFunder                  | Champerty Ltd                         | FCA firm page: Authorised since 10/01/2023                                                                                                                                          | Investment-based or loan-based crowdfunding operator (FCA has no crowdfunding category; permission scope not read) | FRN 968527 |         |
| Simple Crowdfunding         | Focus 2020 Ltd                        | FCA firm page: "Authorised - applied to cancel" (sub-status Applied to Cancel since 10/02/2026); also in FCA P2P list                                                               | Investment-based or loan-based crowdfunding operator (FCA has no crowdfunding category; permission scope not read) | FRN 727214 |         |
| Envestors                   | Envestors Ltd                         | FCA firm page: Authorised since 01/10/2010                                                                                                                                          | Investment-based or loan-based crowdfunding operator (FCA has no crowdfunding category; permission scope not read) | FRN 523952 |         |
| Abundance Investment        | Abundance Investment Ltd              | FCA firm page: Authorised since 21/07/2011                                                                                                                                          | Investment-based or loan-based crowdfunding operator (FCA has no crowdfunding category; permission scope not read) | FRN 525432 |         |

**Cancelled, withdrawn, ceased or historical (19):**

| Brand              | Legal entity                        | Status (as of source)                                                                  | Type                                                                                                               | ID         | Website |
| ------------------ | ----------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------- | ------- |
|                    | Resolution Compliance Limited       | Permission cancelled/withdrawn since Oct 2021 (partial list; FCA withheld other names) | Loan-based (P2P)                                                                                                   | FRN 574048 |         |
|                    | Plata Finance Limited               | Permission cancelled/withdrawn since Oct 2021 (partial list; FCA withheld other names) | Loan-based (P2P)                                                                                                   | FRN 718925 |         |
|                    | OCTANE FINANCE LIMITED              | Permission cancelled/withdrawn since Oct 2021 (partial list; FCA withheld other names) | Loan-based (P2P)                                                                                                   | FRN 946351 |         |
|                    | Signia Money Limited                | Permission cancelled/withdrawn since Oct 2021 (partial list; FCA withheld other names) | Loan-based (P2P)                                                                                                   | FRN 631257 |         |
|                    | EstateGuru Marketplace Limited      | Permission cancelled/withdrawn since Oct 2021 (partial list; FCA withheld other names) | Loan-based (P2P)                                                                                                   | FRN 767427 |         |
|                    | Connective Lending Ltd              | Permission cancelled/withdrawn since Oct 2021 (partial list; FCA withheld other names) | Loan-based (P2P)                                                                                                   | FRN 923900 |         |
|                    | Landbay Partners Limited            | Permission cancelled/withdrawn since Oct 2021 (partial list; FCA withheld other names) | Loan-based (P2P)                                                                                                   | FRN 719626 |         |
|                    | OCTOPUS CO-LEND LIMITED             | Permission cancelled/withdrawn since Oct 2021 (partial list; FCA withheld other names) | Loan-based (P2P)                                                                                                   | FRN 722801 |         |
|                    | Madiston plc                        | Permission cancelled/withdrawn since Oct 2021 (partial list; FCA withheld other names) | Loan-based (P2P)                                                                                                   | FRN 724098 |         |
|                    | Lend & Borrow Trust Company Limited | Permission cancelled/withdrawn since Oct 2021 (partial list; FCA withheld other names) | Loan-based (P2P)                                                                                                   | FRN 709373 |         |
|                    | ArchOver Limited                    | Permission cancelled/withdrawn since Oct 2021 (partial list; FCA withheld other names) | Loan-based (P2P)                                                                                                   | FRN 723755 |         |
|                    | GrowFiniti Limited                  | Permission cancelled/withdrawn since Oct 2021 (partial list; FCA withheld other names) | Loan-based (P2P)                                                                                                   | FRN 742807 |         |
|                    | Sancus Lending (UK) Limited         | Permission cancelled/withdrawn since Oct 2021 (partial list; FCA withheld other names) | Loan-based (P2P)                                                                                                   | FRN 593992 |         |
|                    | GoodHub Platforms Limited           | Permission cancelled/withdrawn since Oct 2021 (partial list; FCA withheld other names) | Loan-based (P2P)                                                                                                   | FRN 777371 |         |
|                    | Retail Money Market Ltd             | Permission cancelled/withdrawn since Oct 2021 (partial list; FCA withheld other names) | Loan-based (P2P)                                                                                                   | FRN 722768 |         |
|                    | Tally Marketplace Lending Limited   | Permission cancelled/withdrawn since Oct 2021 (partial list; FCA withheld other names) | Loan-based (P2P)                                                                                                   | FRN 734921 |         |
| Crowdcube Ventures | Crowdcube Ventures Ltd              | No longer authorised                                                                   | Investment-based or loan-based crowdfunding operator (FCA has no crowdfunding category; permission scope not read) | FRN 572026 |         |
| Angels Den         | Angels Den Funding Ltd              | No longer authorised                                                                   | Investment-based or loan-based crowdfunding operator (FCA has no crowdfunding category; permission scope not read) | FRN 604431 |         |
| Angels Den         | Angels Den Services Ltd             | No longer authorised                                                                   | Investment-based or loan-based crowdfunding operator (FCA has no crowdfunding category; permission scope not read) | FRN 599390 |         |

#### Switzerland (15 records)

Names from the HSLU academic monitor (platforms with 2025 campaign activity). No dedicated crowdfunding register or licence category; FINMA licence status per platform not checked.

Sources: HSLU Crowdfunding Monitor Schweiz 2026, Table 1 (platforms with active campaigns 2025, as of Apr 2026) https://www.hslu.ch/-/media/campus/common/files/dokumente/h/1-medienmitteilungen-und-news/2026/w/cf-monitor-2026.pdf
Source date(s): 2026-10-30

**Unverified (company, press or third-party claim only) (15):**

| Brand                          | Legal entity | Status (as of source)                                                                              | Type                                                                                 | ID  | Website |
| ------------------------------ | ------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --- | ------- |
| Conda.ch                       |              | Active in 2025 (academic monitor); no dedicated crowdfunding platform register or licence category | Investment/lending crowdfunding: Crowd-investing (business/start-up and real estate) |     |         |
| Oomnium                        |              | Active in 2025 (academic monitor); no dedicated crowdfunding platform register or licence category | Investment/lending crowdfunding: Crowd-investing (business/start-up)                 |     |         |
| Crowdhouse                     |              | Active in 2025 (academic monitor); no dedicated crowdfunding platform register or licence category | Investment/lending crowdfunding: Crowd-investing (real estate)                       |     |         |
| Crowdli                        |              | Active in 2025 (academic monitor); no dedicated crowdfunding platform register or licence category | Investment/lending crowdfunding: Crowd-investing (real estate)                       |     |         |
| Foxstone                       |              | Active in 2025 (academic monitor); no dedicated crowdfunding platform register or licence category | Investment/lending crowdfunding: Crowd-investing and crowdlending (real estate)      |     |         |
| Imvesters                      |              | Active in 2025 (academic monitor); no dedicated crowdfunding platform register or licence category | Investment/lending crowdfunding: Crowd-investing (real estate)                       |     |         |
| Solarify                       |              | Active in 2025 (academic monitor); no dedicated crowdfunding platform register or licence category | Investment/lending crowdfunding: Crowd-investing (real estate)                       |     |         |
| Cashare                        |              | Active in 2025 (academic monitor); no dedicated crowdfunding platform register or licence category | Investment/lending crowdfunding: Crowdlending (all segments)                         |     |         |
| CG24 (Creditgate24)            |              | Active in 2025 (academic monitor); no dedicated crowdfunding platform register or licence category | Investment/lending crowdfunding: Crowdlending (all segments)                         |     |         |
| Crowd4Cash                     |              | Active in 2025 (academic monitor); no dedicated crowdfunding platform register or licence category | Investment/lending crowdfunding: Crowdlending (all segments)                         |     |         |
| Lend / Splendit (same company) |              | Active in 2025 (academic monitor); no dedicated crowdfunding platform register or licence category | Investment/lending crowdfunding: Crowdlending (all segments)                         |     |         |
| Creditworld                    |              | Active in 2025 (academic monitor); no dedicated crowdfunding platform register or licence category | Investment/lending crowdfunding: Crowdlending (business only)                        |     |         |
| swisspeers                     |              | Active in 2025 (academic monitor); no dedicated crowdfunding platform register or licence category | Investment/lending crowdfunding: Crowdlending (business only)                        |     |         |
| Imvestlend                     |              | Active in 2025 (academic monitor); no dedicated crowdfunding platform register or licence category | Investment/lending crowdfunding: Crowdlending (real estate)                          |     |         |
| RAIZERS                        |              | Active in 2025 (academic monitor); no dedicated crowdfunding platform register or licence category | Investment/lending crowdfunding: Crowdlending (real estate)                          |     |         |

#### Armenia (1 records)

Sources: https://banks.am/en/news/newsfeed/24968
Source date(s): 2026-10-30

**Unverified (company, press or third-party claim only) (1):**

| Brand                   | Legal entity                            | Status (as of source)                                                                       | Type                     | ID  | Website |
| ----------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------ | --- | ------- |
| ARFI (Armenia Financed) | Armenian National Interests Fund (ANIF) | Registered by Central Bank of Armenia on 29 Nov 2022 (per press); current status unverified | Crowd-investing platform |     |         |

#### Moldova (1 records)

Sources: https://capital.market.md/ro/content/cnpf-autorizat-primul-furnizor-de-servicii-de-finantare-participativa-din-republica-moldova ; https://fagura.com/en/2026/04/14/fagura-cashback-program-2026-over-e837000-in-funding-for-smes-in-moldova/
Source date(s): 2026-10-30

**Unverified (company, press or third-party claim only) (1):**

| Brand  | Legal entity       | Status (as of source)                                                                                           | Type                    | ID  | Website            |
| ------ | ------------------ | --------------------------------------------------------------------------------------------------------------- | ----------------------- | --- | ------------------ |
| Fagura | FAGURA CAPITAL SRL | First provider authorised by CNPF (date per CNPF news item not captured); still operating per 2026 company post | Participatory financing |     | https://fagura.com |

#### Jersey (1 records)

Springboard.je launched Sep 2021; JFSC guidance says crowdfunding is generally not a regulated activity in Jersey.

Sources: https://www.digital.je/news-events/digital-news/crowdfunding-and-dragons-den-style-investing-arrives-in-jersey/ ; https://www.collascrill.com/articles/starting-a-tech-business-in-jersey/
Source date(s): 2026-10-30

**Unverified (company, press or third-party claim only) (1):**

| Brand                           | Legal entity | Status (as of source)                                                                    | Type | ID  | Website |
| ------------------------------- | ------------ | ---------------------------------------------------------------------------------------- | ---- | --- | ------- |
| Springboard.je (Digital Jersey) |              | Launched Sep 2021; JFSC guidance says crowdfunding is generally not a regulated activity |      |     |         |

#### Belarus (1 records)

FinStore named from press/company sources; regulatory register status not verified.

Sources: https://finstore.by/en/o-kompanii ; https://www.belveb.by/online-services/finstore/
Source date(s): 2026-10-30

**Unverified (company, press or third-party claim only) (1):**

| Brand                         | Legal entity | Status (as of source)                                                                                       | Type                               | ID  | Website             |
| ----------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------- | ---------------------------------- | --- | ------------------- |
| FinStore (LLC "DFS" / BelVEB) | LLC DFS      | Operates an investment platform (ICO/securities offers) in Belarus; regulatory register status not verified | Investment platform / token offers |     | https://finstore.by |

#### Monaco (1 records)

Sources: https://journaldemonaco.gouv.mc/en/Journaux/2021/Journal-8560/Etude-de-Me-Henry-REY-Notaire-2-rue-Colonel-Bellando-de-Castro-Monaco-MONACO-CROWDFUNDING-S.A.M.-Societe-Anonyme-Monegasque ; https://thecrowdspace.com/platform/monaco-crowdfunding/
Source date(s): 2026-10-30

**Unverified (company, press or third-party claim only) (1):**

| Brand                      | Legal entity               | Status (as of source)                                                                                                    | Type                                    | ID  | Website |
| -------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- | --- | ------- |
| Monaco Crowdfunding S.A.M. | MONACO CROWDFUNDING S.A.M. | Company exists under Monegasque law (2021 gazette notice); CCAF authorisation not verified; may be reward/donation-based | Crowdfunding platform (type unverified) |     |         |

### Asia-Pacific

#### Indonesia (112 records)

18 SCF (equity/securities crowdfunding): 16 KSEI participants plus 2 reconciled OJK licence grants (Prodana, Udana). 94 P2P (LPBBTI) in the OJK July 2026 directory. Current sanctions or restrictions not individually checked; KSEI participation is not proof of unrestricted operation.

Sources: - https://ojk.go.id/id/berita-dan-kegiatan/pengumuman/Pages/Pemberian-Izin-Usaha-Penyelenggara-Penawaran-Saham-Melalui-Layanan-Urun-Dana-Berbasis-Teknologi-Informasi-Pt-Dana-Rintis.aspx<br>- https://ojk.go.id/id/berita-dan-kegiatan/pengumuman/Pages/Pemberian-Izin-Usaha-Sebagai-Penyelenggara-Penawaran-Efek-PT-Protemus-Dana-Bersama.aspx<br>- https://ojk.go.id/id/kanal/iknb/data-dan-statistik/direktori/fintech/Documents/Direktori%20Layanan%20Pendanaan%20Bersama%20Berbasis%20Teknologi%20Informasi%20Juli%202026.pdf<br>- https://web.ksei.co.id/services/participants/scf
Source date(s): 2026-07, 2026-10-30, Grant 2022-03-10; ALUDI checked 2026-10-30, Grant 2024-11-06; ALUDI checked 2026-10-30

**Registered or listed (trading/activity not verified) (112):**

| Brand                     | Legal entity                             | Status (as of source)                        | Type                    | ID                | Website                            |
| ------------------------- | ---------------------------------------- | -------------------------------------------- | ----------------------- | ----------------- | ---------------------------------- |
| Bizhare                   | PT Investasi Digital Nusantara           | KSEI SCF participant list                    | Securities crowdfunding | BZHR1             |                                    |
| Crowddana                 | PT Crowddana Teknologi Indonusa          | KSEI SCF participant list                    | Securities crowdfunding | CRWD1             |                                    |
| Danasaham                 | PT Dana Saham Bersama                    | KSEI SCF participant list                    | Securities crowdfunding | DSMB1             |                                    |
| Fundex                    | PT Dana Investasi Bersama                | KSEI SCF participant list                    | Securities crowdfunding | FNDX1             |                                    |
| ICX                       | PT ICX Bangun Indonesia                  | KSEI SCF participant list                    | Securities crowdfunding | LNDX1             |                                    |
| LBS                       | PT LBS Urun Dana                         | KSEI SCF participant list                    | Securities crowdfunding | LBSU1             |                                    |
| Santara                   | PT Santara Daya Inspiratama              | KSEI SCF participant list                    | Securities crowdfunding | SDIM1             |                                    |
| Shafiq                    | PT Shafiq Digital Indonesia              | KSEI SCF participant list                    | Securities crowdfunding | SHFQ1             |                                    |
| Ekuid                     | PT Likuid Jaya Pratama                   | KSEI SCF participant list                    | Securities crowdfunding | EKUI1             |                                    |
| Danamart                  | PT Dana Aguna Nusantara                  | KSEI SCF participant list                    | Securities crowdfunding | DNMR1             |                                    |
| Fulusme                   | PT Fintek Andalan Solusi Teknologi       | KSEI SCF participant list                    | Securities crowdfunding | FLSM1             |                                    |
| Visiku                    | PT Amantra Investama Indodana            | KSEI SCF participant list                    | Securities crowdfunding | VSKU1             |                                    |
| Vestora                   | PT Halalvestor Global Asia               | KSEI SCF participant list                    | Securities crowdfunding | VSTR1             |                                    |
| Urun RI                   | PT Urun Bangun Negeri                    | KSEI SCF participant list                    | Securities crowdfunding | URUN1             |                                    |
| Aindo                     | PT Angel Investor Indonesia              | KSEI SCF participant list                    | Securities crowdfunding | ANII1             |                                    |
| SFUND                     | PT Surya Fajar Urun Dana                 | KSEI SCF participant list                    | Securities crowdfunding | SFUD1             |                                    |
| Prodana                   | PT Protemus Dana Bersama                 | OJK licence grant + current ALUDI membership | Securities crowdfunding | KEP-48/D.04/2024  | https://prodana.id/faq             |
| Udana                     | PT Dana Rintis Indonesia                 | OJK licence grant + current ALUDI membership | Securities crowdfunding | KEP-20/D.04/2022  | https://udana.id/                  |
| Danamas                   | PT Pasar Dana Pinjaman                   | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-49/D.05/2017  | https://p2p.danamas.co.id/         |
| Amartha                   | PT Amartha Mikro Fintek                  | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-46/D.05/2019  | https://amartha.com/               |
| Dompet Kilat              | PT Indo Fin Tek                          | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-47/D.05/2019  | https://dompetkilat.co.id/         |
| Boost                     | PT Creative Mobile Adventure             | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-48/D.05/2019  | https://www.myboost.co.id          |
| Tokomodal                 | PT Toko Modal Mitra Usaha                | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-49/D.05/2019  | https://www.tokomodal.co.id/       |
| Modalku                   | PT Mitrausaha Indonesia Grup             | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-81/D.05/2019  | https://modalku.co.id/             |
| KTA Kilat                 | PT Pendanaan Teknologi Nusa              | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-82/D.05/2019  | https://www.pendanaan.com/         |
| Kredit Pintar             | PT Kredit Pintar Indonesia               | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-83/D.05/2019  | https://www.kreditpintar.com/      |
| Finmas                    | PT Oriente Mas Sejahtera                 | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-85/D.05/2019  | www.finmas.co.id                   |
| KlikA2C                   | PT Aman Cermat Cepat                     | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-87/D.05/2019  | https://klika2c.co.id              |
| Akseleran                 | PT Akseleran Keuangan Inklusif Indonesia | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-122/D.05/2019 | https://www.akseleran.co.id/       |
| Ammana                    | PT Ammana Fintek Syariah                 | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-123/D.05/2019 | https://ammana.id/                 |
| PinjamanGo                | PT Dana Pinjaman Inklusif                | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-124/D.05/2019 | https://pinjamango.co.id           |
| KoinP2P                   | PT Lunaria Annua Teknologi               | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-125/D.05/2019 | https://koinp2p.com/               |
| Pohondana                 | PT Pohon Dana Indonesia                  | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-126/D.05/2019 | https://pohondana.id/              |
| Mekar                     | PT Mekar InvestamaTeknologi              | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-127/D.05/2019 | https://mekar.id                   |
| AdaKami                   | PT Pembiayaan Digital Indonesia          | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-128/D.05/2019 | https://www.adakami.id/            |
| Esta Kapital              | PT Esta Kapital Fintek                   | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-129/D.05/2019 | www.estakapital.co.id              |
| KreditPro                 | PT Tri Digi Fin                          | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-130/D.05/2019 | www.kreditpro.id                   |
| FINTAG                    | PT Fintegra Homido Indonesia             | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-131/D.05/2019 | https://fintag.id                  |
| RupiahCepat               | PT Kredit Utama Fintech Indonesia        | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-132/D.05/2019 | https://www.rupiahcepat.co.id/     |
| Indonesia Crowdo          | PT Mediator Komunitas                    | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-133/D.05/2019 | https://crowdo.co.id/              |
| Indodana                  | PT Artha Dana Teknologi                  | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-15/D.05/2020  | https://www.indodanafintech.co.id/ |
| JULO                      | PT JULO Teknologi Finansial              | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-16/D.05/2020  | https://www.julo.co.id/            |
| Pinjamin                  | PT Progo Puncak Group                    | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-17/D.05/2020  | https://pinjamwinwin.com/          |
| DanaKredi                 | PT Pindar Berbagi Bersama                | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-18/D.05/2020  | https://www.danakredi.com/         |
| OVO Finansial             | PT Indonusa Bara Sejahtera               | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-19/D.05/2020  | https://ovofinansial.com           |
| PinjamModal               | PT Finansial Integrasi Teknologi         | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-20/D.05/2020  | https://pinjammodal.id/            |
| Alami                     | PT Alami Fintek Sharia                   | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-21/D.05/2020  | https://alamisharia.co.id/         |
| AwanTunai                 | PT Simplefi Teknologi Indonesia          | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-22/D.05/2020  | https://awantunai.co.id/           |
| BantuFazz                 | PT Dana Kini Indonesia                   | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-46/D.05/2020  | www.bantufazz.id                   |
| Singa                     | PT Abadi Sejahtera Finansindo            | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-47/D.05/2020  | https://singa.id/                  |
| Danamerdeka               | PT Intekno Raya                          | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-48/D.05/2020  | https://danamerdeka.co.id          |
| Easycash                  | PT Indonesia Fintopia Technology         | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-49/D.05/2020  | https://www.easycash.id/           |
| Pinjamyuk                 | PT Kuaikuai Tech Indonesia               | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-2/D.05/2021   | https://www.pinjamyuk.co.id/       |
| Finplus                   | PT Rezeki Bersama Teknologi              | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-3/D.05/2021   | https://finplus.co.id/             |
| Uangme                    | PT Uangme Fintek Indonesia               | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-4/D.05/2021   | https://www.uangme.id/             |
| PinjamDuit                | PT Stanford Teknologi Indonesia          | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-5/D.05/2021   | https://pinjamduit.co.id/          |
| DANA SYARIAH              | PT Dana Syariah Indonesia                | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-10/D.05/2021  | http://danasyariah.id              |
| BATUMBU                   | PT Berdayakan Usaha Indonesia            | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-11/D.05/2021  | www.batumbu.id                     |
| Cashcepat                 | PT Artha Permata Makmur                  | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-12/D.05/2021  | http://cashcepat.id                |
| klikUMKM                  | PT Pinjaman Kemakmuran Rakyat            | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-13/D.05/2021  | www.klikUMKM.co.id                 |
| Pinjam Gampang            | PT Kredit Plus Teknologi                 | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-16/D.05/2021  | http://www.kreditplusteknologi.id  |
| cicil                     | PT Cicil Solusi Mitra Teknologi          | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-20/D.05/2021  | https://www.cicil.co.id            |
| RpDana                    | PT Lumbung Dana Indonesia                | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-21/D.05/2021  | https://www.rpdana.co.id/          |
| Nusantara KrediOne        | PT Inovasi Terdepan                      | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-22/D.05/2021  | www.360kredi.id                    |
| Kredinesia                | PT Kreditku Teknologi Indonesia          | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-25/D.05/2021  | www.kredinesia.id                  |
| Pintek                    | PT Pinduit Teknologi Indonesia           | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-26/D.05/2021  | http://pintek.id                   |
| ModalRakyat               | PT Modal Rakyat Indonesia                | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-27/D.05/2021  | http://modalrakyat.id              |
| SOLUSIKU                  | PT Anugerah Digital Indonesia            | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-28/D.05/2021  | www.solusi-ku.id                   |
| Cairin                    | PT Idana Solusi Sejahtera                | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-29/D.05/2021  | www.cairin.id                      |
| Danaku                    | PT Trust Teknologi Finansial             | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-30/D.05/2021  | http://danaku.id                   |
| KLIK KAMI                 | PT Harapan Fintech Indonesia             | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-31/D.05/2021  | www.klikkami.co.id                 |
| Duha SYARIAH              | PT Duha Madani Syariah                   | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-32/D.05/2021  | www.duhasyariah.com                |
| Invoila                   | PT Sol Mitra Fintec                      | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-39/D.05/2021  | http://invoila.co.id               |
| Sanders One Stop Solution | PT Satustop Finansial Solusi             | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-40/D.05/2021  | http://sanders.co.id               |
| DanaBagus                 | PT Dana Bagus Indonesia                  | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-41/D.05/2021  | www.danabagus.id                   |
| UKU                       | PT Teknologi Merlin Sejahtera            | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-46/D.05/2021  | ukuindo.com                        |
| KREDITO                   | PT Fintek Digital Indonesia              | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-47/D.05/2021  | https://kredito.id                 |
| AdaPundi                  | PT Info Tekno Siaga                      | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-48/D.05/2021  | www.adapundi.com                   |
| Lentera Dana Nusantara    | PT Lentera Dana Nusantara                | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-49/D.05/2021  | www.lenteradana.co.id/lender/      |
| Modal Nasional            | PT Solusi Teknologi Finansial            | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-50/D.05/2021  | www.modalnasional.co.id            |
| Komunal                   | PT Komunal Finansial Indonesia           | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-51/D.05/2021  | www.komunal.co.id                  |
| Restock.ID                | PT Cerita Teknologi Indonesia            | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-52/D.05/2021  | www.restock.id                     |
| Avantee                   | PT Grha Dana Bersama                     | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-66/D.05/2021  | www.avantee.co.id                  |
| Gradana                   | PT Gradana Teknoruci Indonesia           | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-67/D.05/2021  | gradana.co.id                      |
| Danacita                  | PT Inclusive Finance Group               | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-68/D.05/2021  | www.danacita.co.id                 |
| Pijar                     | PT IKI Karunia Indonesia                 | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-69/D.05/2021  | www.pijar.com                      |
| Ivoji                     | PT Finansia Aira Teknologi               | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-73/D.05/2021  | www.ivoji.id                       |
| Indofund.id               | PT Bursa Akselerasi Indonesia            | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-74/D.05/2021  | indofund.id                        |
| iGrow                     | PT LinkAja Modalin Nusantara             | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-75/D.05/2021  | igrow.asia                         |
| Danai.id                  | PT Adiwisista Finansial Teknologi        | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-76/D.05/2021  | http://danai.id                    |
| DUMI                      | PT Fidac Inovasi Teknologi               | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-78/D.05/2021  | minjem.com                         |
| LAHAN SIKAM               | PT Lampung Berkah Finansial Teknologi    | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-79/D.05/2021  | www.lahansikam.co.id               |
| qazwa.id                  | PT Qazwa Mitra Hasanah                   | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-80/D.05/2021  | qazwa.id                           |
| KrediFazz                 | PT KrediFazz Digital Indonesia           | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-81/D.05/2021  | www.kredifazz.id                   |
| KreditOK                  | PT Doeku Peduli Indonesia                | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-82/D.05/2021  | kreditok.id                        |
| Aktivaku                  | PT Aktivaku Investama Teknologi          | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-83/D.05/2021  | aktivaku.com                       |
| Danain                    | PT Mulia Inovasi Digital                 | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-84/D.05/2021  | www.danain.co.id                   |
| Indosaku                  | PT Indosaku Digital Teknologi            | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-86/D.05/2021  | indosaku.id                        |
| EDUFUND                   | PT Fintech Bina Bangsa                   | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-88/D.05/2021  | www.edufund.co.id                  |
| GandengTangan             | PT Kreasi Anak Indonesia                 | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-89/D.05/2021  | www.gandengtangan.co.id            |
| PAPITUPI SYARIAH          | PT Piranti Alphabet Perkasa              | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-90/D.05/2021  | www.papitupisyariah.com            |
| BantuSaku                 | PT Smartec Teknologi Indonesia           | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-91/D.05/2021  | bantusaku.id                       |
| danabijak                 | PT Digital Micro Indonesia               | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-92/D.05/2021  | danabijak.com                      |
| AdaModal                  | PT Solid Fintek Indonesia                | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-94/D.05/2021  | www.adamodal.co.id                 |
| SamaKita                  | PT Sejahtera Sama Kita                   | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-95/D.05/2021  | samakita.co.id                     |
| KawanCicil                | PT Kawan Cicil Teknologi Utama           | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-101/D.05/2021 | kawancicil.co.id                   |
| KlikCair                  | PT Klikcair Magga Jaya                   | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-103/D.05/2021 | klikcair.com                       |
| ETHIS                     | PT Ethis Fintek Indonesia                | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-104/D.05/2021 | ethis.co.id                        |
| SAMIR                     | PT Sahabat Mikro Fintek                  | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-105/D.05/2021 | www.samir.co.id                    |
| UATAS                     | PT Plus Ultra Abadi                      | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-106/D.05/2021 | www.uatas.id                       |
| Asetku                    | PT Pintar Inovasi Digital                | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-123/D.05/2021 | www.asetku.co.id                   |
| Findaya                   | PT Mapan Global Reksa                    | OJK July 2026 licensed directory             | P2P lending / LPBBTI    | KEP-124/D.05/2021 | https://www.findaya.co.id          |

#### South Korea (50 records)

46 named KFTC P2P participating institutions (the page reports 47 FSC-registered in total). Four securities-crowdfunding operators identified from KOFIA, operator and government sources - not a complete FSC register. CrowdNet deregistrations (WADIZ, OpenTrade, Korea Asset) are excluded from current lists.

Sources: - https://equity.ycrowdy.com/disclosure ; https://assist.apfs.kr/usr/inform/bbs/openInvestGuide.do<br>- https://m.funding4u.co.kr/faq_list ; https://assist.apfs.kr/usr/inform/bbs/openInvestGuide.do<br>- https://www.kofia.or.kr/members/m_165/sub020202.do?srchCate=22<br>- https://www.p2pcenter.or.kr/serviceintro/registrationCompanies
Source date(s): 2026-10-30

**Registered or listed (trading/activity not verified) (48):**

| Brand       | Legal entity         | Status (as of source)                                       | Type                                   | ID         | Website                             |
| ----------- | -------------------- | ----------------------------------------------------------- | -------------------------------------- | ---------- | ----------------------------------- |
| Ohmycompany | 오마이컴퍼니         | KOFIA online-small-investment-broker member list            | Securities crowdfunding                |            |                                     |
| Funderful   | 펀더풀               | KOFIA online-small-investment-broker member list            | Securities crowdfunding                |            |                                     |
|             | NICE비즈니스플랫폼   | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.07.21 | http://www.niceabc.co.kr/           |
|             | 그래프펀딩           | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.08.26 |                                     |
|             | 나모펀딩             | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.08.26 | http://www.namofunding.co.kr/       |
|             | 누리펀딩             | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.08.26 | http://www.nurifunding.co.kr/       |
|             | 다온핀테크           | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.08.26 | https://www.daonfunding.com/        |
|             | 데일리펀딩           | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.09.08 | https://www.daily-funding.com/      |
|             | 디에셋핀테크         | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2022.05.11 | https://www.theassetfund.com/       |
|             | 레드로켓             | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.08.26 |                                     |
|             | 렌딧                 | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.06.10 | https://invest.lendit.co.kr/invest  |
|             | 론포인트             | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.09.08 | https://www.loanpoint.co.kr/        |
|             | 루트인프라금융       | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.08.26 | http://www.rootenergy.co.kr/        |
|             | 리딩플러스           | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.08.26 | https://www.leadingplusfunding.com/ |
|             | 머니무브             | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.11.12 | https://moneymove.ai/               |
|             | 모우다               | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.08.26 | https://www.mouda.kr/               |
|             | 미라클핀테크         | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.08.26 | https://www.miraclefunding.co.kr/   |
|             | 베네핏소셜           | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.08.26 | http://www.funfunding.co.kr/        |
|             | 브이핀테크           | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.09.08 | https://vfunding.co.kr/             |
|             | 비플러스             | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.08.26 | https://benefitplus.kr/             |
|             | 솔라브리지           | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2022.01.26 | http://www.solarbridge.kr/          |
|             | 앱솔브트러스트       | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2022.11.30 | https://trustfund.co.kr/            |
|             | 어니스트에이아이     | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.08.26 | https://www.honestfund.kr/          |
|             | 에이스펀딩           | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2022.06.13 | https://www.acefunding.co.kr/       |
|             | 에이피펀딩           | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2022.05.26 | https://www.apfunding.co.kr/        |
|             | 에잇퍼센트           | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.06.10 | https://8percent.kr/                |
|             | 에프엠펀딩           | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.11.12 | https://fmfunding.co.kr/            |
|             | 오션펀딩             | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.09.08 |                                     |
|             | 오아시스펀드         | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.08.26 | http://www.oasisfund.kr/            |
|             | 와이펀드             | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.07.21 | https://www.yfund.co.kr/            |
|             | 위펀딩               | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.08.26 | https://www.wefunding.com/          |
|             | 윙크스톤             | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.07.13 | https://www.winkstone.com/          |
|             | 제이에이치플러스     | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2025.08.20 | http://www.jhplus.fund/             |
|             | 줌펀드               | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.08.26 | http://www.zoomfund.co.kr/          |
|             | 코코펀딩             | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2022.01.12 | http://cocofunding.com/             |
|             | 크로스파이낸스코리아 | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.07.21 | https://www.kross.kr/               |
|             | 투게더앱스           | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.08.26 | https://www.together.co.kr/         |
|             | 트리거파트너스       | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2022.03.16 | https://v2.cocktailfunding.com/     |
|             | 퍼스트온라인투자금융 | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2022.01.12 |                                     |
|             | 펀다                 | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.08.26 | http://www.funda.kr/                |
|             | 펀딩119              | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.08.26 | https://www.funding119.com/         |
|             | 프로핏               | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.09.29 | http://www.pro-fit.co.kr/           |
|             | 프리스닥             | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.11.12 | http://www.presdaqfunding.co.kr/    |
|             | 피에프씨테크놀로지스 | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.06.10 | https://www.cple.co.kr/             |
|             | 하이펀딩             | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2022.04.13 | https://hifunding.co.kr/            |
|             | 한패스파이낸셜       | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2022.01.26 | https://www.titaninvest.co.kr/      |
|             | 허브펀드             | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2024.10.31 | http://hubfund.co.kr/               |
|             | 헬로핀테크           | KFTC participating institution, FSC registration date shown | P2P / online investment-linked finance | 2021.08.26 | https://www.hellofunding.co.kr/     |

**Unverified (company, press or third-party claim only) (2):**

| Brand     | Legal entity | Status (as of source)                                                                                         | Type                    | ID  | Website                               |
| --------- | ------------ | ------------------------------------------------------------------------------------------------------------- | ----------------------- | --- | ------------------------------------- |
| Funding4U | (주)펀딩포유 | Operator identifies FSC registration 28 July 2016; government guide lists intermediary                        | Securities crowdfunding |     | https://m.funding4u.co.kr/faq_list    |
| CROWDY    | (주)크라우디 | Operator disclosure identifies online-small-investment-intermediary role; government guide lists intermediary | Securities crowdfunding |     | https://equity.ycrowdy.com/disclosure |

#### Malaysia (33 records)

13 ECF and 20 P2P category entries from the current SC table; some entities appear in both categories, so this is not 33 unique firms.

Sources: https://www.sc.com.my/development/digital/digital-initiatives
Source date(s): 2026-10-30

**Registered or listed (trading/activity not verified) (33):**

| Brand | Legal entity                       | Status (as of source)  | Type                | ID  | Website                            |
| ----- | ---------------------------------- | ---------------------- | ------------------- | --- | ---------------------------------- |
|       | Alta Sdn Bhd                       | SC registered RMO list | Equity crowdfunding |     | https://alta.exchange/             |
|       | Ata Plus Sdn Bhd                   | SC registered RMO list | Equity crowdfunding |     | https://ata-plus.com/              |
|       | AMB Connect Sdn Bhd                | SC registered RMO list | Equity crowdfunding |     | https://www.ambconnect.com/        |
|       | Crowdo Malaysia Sdn Bhd            | SC registered RMO list | Equity crowdfunding |     | https://crowdo.com/                |
|       | Ethis Ventures Sdn Bhd             | SC registered RMO list | Equity crowdfunding |     | https://ethis.co/                  |
|       | Eureeca SEA Sdn Bhd                | SC registered RMO list | Equity crowdfunding |     | https://eureeca.com/               |
|       | FBM Crowdtech Sdn Bhd              | SC registered RMO list | Equity crowdfunding |     | https://www.alixco.com/ecfcampaign |
|       | iPivot Sdn Bhd                     | SC registered RMO list | Equity crowdfunding |     |                                    |
|       | Leet Capital Sdn Bhd               | SC registered RMO list | Equity crowdfunding |     | https://leet.capital/              |
|       | MyStartr Sdn Bhd                   | SC registered RMO list | Equity crowdfunding |     | https://www.mystartr.com/          |
|       | Pitch Platforms Sdn Bhd            | SC registered RMO list | Equity crowdfunding |     | https://www.equity.pitchin.my/     |
|       | Wahed X Sdn Bhd                    | SC registered RMO list | Equity crowdfunding |     | https://www.wahed.com/my/ventures  |
|       | Kapital DX Sdn Bhd                 | SC registered RMO list | Equity crowdfunding |     |                                    |
|       | Abundance Treasures Bgroup Sdn Bhd | SC registered RMO list | P2P financing       |     | https://ads-securities.com.my/     |
|       | DBS Solutions (M) Sdn Bhd          | SC registered RMO list | P2P financing       |     | https://sme-funding-i.com/         |
|       | Algobizz Berhad                    | SC registered RMO list | P2P financing       |     | https://p2p.algobizz.com/          |
|       | Bay Smart Capital Ventures Sdn Bhd | SC registered RMO list | P2P financing       |     | https://capbay.com/                |
|       | Bursa Malaysia RAM Capital Sdn Bhd | SC registered RMO list | P2P financing       |     | https://brc.bursamalaysia.com/     |
|       | B2B Finpal Sdn Bhd                 | SC registered RMO list | P2P financing       |     | http://www.b2bfinpal.com/          |
|       | Capsphere Services Sdn Bhd         | SC registered RMO list | P2P financing       |     | https://www.capsphere.com.my/      |
|       | Community P2P Sdn Bhd              | SC registered RMO list | P2P financing       |     | http://www.cp2p.com/               |
|       | Crowd Sense Sdn Bhd                | SC registered RMO list | P2P financing       |     | https://cofundr.com.my/            |
|       | P2P Nusa Kapital Sdn Bhd           | SC registered RMO list | P2P financing       |     | https://www.nusakapital.com/       |
|       | FBM Crowdtech Sdn Bhd              | SC registered RMO list | P2P financing       |     | https://www.alixco.com/            |
|       | MicroLEAP PLT                      | SC registered RMO list | P2P financing       |     | https://www.microleapasia.com/     |
|       | Modalku Ventures Sdn Bhd           | SC registered RMO list | P2P financing       |     | https://fundingsocieties.com.my/   |
|       | Moneysave (M) Sdn Bhd              | SC registered RMO list | P2P financing       |     | https://moneysave.com.my/          |
|       | Peoplender Sdn Bhd                 | SC registered RMO list | P2P financing       |     | https://www.fundaztic.com/my/      |
|       | QuicKash Malaysia Sdn Bhd          | SC registered RMO list | P2P financing       |     | https://www.quickash.com/          |
|       | Kapital DX Sdn Bhd                 | SC registered RMO list | P2P financing       |     |                                    |
|       | Pitch Platforms Sdn Bhd            | SC registered RMO list | P2P financing       |     |                                    |
|       | Shoraka Suyula Platform Sdn Bhd    | SC registered RMO list | P2P financing       |     |                                    |
|       | Fintech P2P Sdn Bhd                | SC registered RMO list | P2P financing       |     |                                    |

#### India (28 records)

28 legal entities classified P2P on the RBI NBFC list as of 30 Sep 2026. India has no licensed equity-crowdfunding regime.

Sources: https://rbidocs.rbi.org.in/rdocs/content/DOCs/List_of_NBFCs_and_ARCs_registered_with_the_RBI.XLSX
Source date(s): 2026-09-30

**Registered or listed (trading/activity not verified) (28):**

| Brand | Legal entity                                  | Status (as of source)                  | Type             | ID                    | Website |
| ----- | --------------------------------------------- | -------------------------------------- | ---------------- | --------------------- | ------- |
|       | 1 Finance P2P Private Limited                 | RBI registered NBFC classification P2P | P2P lending only | U64990GJ2023PTC146103 |         |
|       | 5Paisa P2P Limited                            | RBI registered NBFC classification P2P | P2P lending only | U67120MH2017PLC302564 |         |
|       | Antworks P2P Financing Private Limited        | RBI registered NBFC classification P2P | P2P lending only | U65999HR2017PTC071580 |         |
|       | Bigwin Infotech Private Limited               | RBI registered NBFC classification P2P | P2P lending only | U72100MH2017PTC301769 |         |
|       | Bridge Fintech Solutions Private Limited      | RBI registered NBFC classification P2P | P2P lending only | U74999MH2016PTC286583 |         |
|       | Creditech Solutions Private Limited           | RBI registered NBFC classification P2P | P2P lending only | U72900DL2019PTC346150 |         |
|       | Dipamkara Web Ventures Private Limited        | RBI registered NBFC classification P2P | P2P lending only | U93000TG2011PTC073760 |         |
|       | Etyacol Technologies Private Limited          | RBI registered NBFC classification P2P | P2P lending only | U72200KA2012PTC063749 |         |
|       | Fair Vinimay Services Private Limited         | RBI registered NBFC classification P2P | P2P lending only | U74999MH2015PTC266575 |         |
|       | Fairassets Technologies India Private Limited | RBI registered NBFC classification P2P | P2P lending only | U67100HR2013PTC048659 |         |
|       | Fincsquare Fintech Private Limited            | RBI registered NBFC classification P2P | P2P lending only | U72200MH2015PTC474859 |         |
|       | Fintelligence Data Science Private Limited    | RBI registered NBFC classification P2P | P2P lending only | U72900MH2016PTC285139 |         |
|       | Imfast Finfotech Private Limited              | RBI registered NBFC classification P2P | P2P lending only | U72200KA2020PTC131606 |         |
|       | Innofin Solutions Private Limited             | RBI registered NBFC classification P2P | P2P lending only | U74999MH2015PTC266499 |         |
|       | K. M. Global P2P Finance Private Limited      | RBI registered NBFC classification P2P | P2P lending only | U65990MH2020PTC339970 |         |
|       | Lf2Peer Financial Services Private Limited    | RBI registered NBFC classification P2P | P2P lending only | U65100KA2019PTC120149 |         |
|       | Luharia Technologies Private Limited          | RBI registered NBFC classification P2P | P2P lending only | U74999TG2016PTC110830 |         |
|       | Monexo Fintech Private Limited                | RBI registered NBFC classification P2P | P2P lending only | U65921TN2016PTC103548 |         |
|       | Moneymela P2P Fintech Private Limited         | RBI registered NBFC classification P2P | P2P lending only | U65990OR2019PTC031119 |         |
|       | NDX P2P Private Limited                       | RBI registered NBFC classification P2P | P2P lending only | U67200MH2018PTC306270 |         |
|       | Nurupi P2P Fintech Private Limited            | RBI registered NBFC classification P2P | P2P lending only | U67100TN2021PTC148933 |         |
|       | Peerfintech Solutions Private Limited         | RBI registered NBFC classification P2P | P2P lending only | U65990DL2018PTC339019 |         |
|       | Rang De P2P Financial Services Limited        | RBI registered NBFC classification P2P | P2P lending only | U67190KA2017PLC108211 |         |
|       | RNVP Technology Private Limited               | RBI registered NBFC classification P2P | P2P lending only | U74120UP2016PTC076004 |         |
|       | SRS Fintechlabs Private Limited               | RBI registered NBFC classification P2P | P2P lending only | U72300TG2016PTC102822 |         |
|       | Transactree Technologies Private Limited      | RBI registered NBFC classification P2P | P2P lending only | U65900DL2015PTC285968 |         |
|       | Trickle Flood Technologies Private Limited    | RBI registered NBFC classification P2P | P2P lending only | U65999MH2018PTC315035 |         |
|       | Visionary Financepeer Private Limited         | RBI registered NBFC classification P2P | P2P lending only | U67200MH2017PTC292862 |         |

#### New Zealand (14 records)

4 equity and 8 P2P records ACTIVE per FMA provider records; Property Crowd suspended; Equitise cancelled 3 Apr 2024.

Sources: - https://www.fma.govt.nz/business/licensed-providers/citizens-brokerage-limited/<br>- https://www.fma.govt.nz/business/licensed-providers/collinson-crowdfunding-limited/<br>- https://www.fma.govt.nz/business/licensed-providers/crowdsphere-limited-previously-crowdarm-limited<br>- https://www.fma.govt.nz/business/licensed-providers/crowdsphere-limited/<br>- https://www.fma.govt.nz/business/licensed-providers/go-lend-limited<br>- https://www.fma.govt.nz/business/licensed-providers/lending-crowd-limited/<br>- https://www.fma.govt.nz/business/licensed-providers/pledgeme-limited<br>- https://www.fma.govt.nz/business/licensed-providers/pledgeme-limited-2/<br>- https://www.fma.govt.nz/business/licensed-providers/southern-cross-partners-limited-previously-scfl-management-limited/<br>- https://www.fma.govt.nz/business/licensed-providers/squirrel-money-limited<br>- https://www.fma.govt.nz/business/licensed-providers/the-property-crowd-limited/<br>- https://www.fma.govt.nz/business/licensed-providers/the-snowball-effect-limited/<br>- https://www.fma.govt.nz/business/licensed-providers/vestee-limited<br>- https://www.fma.govt.nz/news/all-releases/media-releases/fma-cancels-crowdfunding-services-licence-for-equitise/
Source date(s): 2026-10-30

**Registered or listed (trading/activity not verified) (12):**

| Brand | Legal entity                                                         | Status (as of source)          | Type                | ID         | Website |
| ----- | -------------------------------------------------------------------- | ------------------------------ | ------------------- | ---------- | ------- |
|       | Pledgeme Limited                                                     | ACTIVE per FMA provider record | Equity crowdfunding | FSP359926  |         |
|       | Crowdsphere Limited                                                  | ACTIVE per FMA provider record | Equity crowdfunding | FSP360186  |         |
|       | The Snowball Effect Limited                                          | ACTIVE per FMA provider record | Equity crowdfunding | FSP350046  |         |
|       | Collinson Crowdfunding Limited                                       | ACTIVE per FMA provider record | Equity crowdfunding | FSP509686  |         |
|       | Go Lend Limited                                                      | ACTIVE per FMA provider record | P2P lending         | FSP1007269 |         |
|       | VESTEE LIMITED                                                       | ACTIVE per FMA provider record | P2P lending         | FSP393946  |         |
|       | Crowdsphere Limited                                                  | ACTIVE per FMA provider record | P2P lending         | FSP360186  |         |
|       | Lending Crowd Limited                                                | ACTIVE per FMA provider record | P2P lending         | FSP390986  |         |
|       | Southern Cross Partners Limited (previously SCFL Management Limited) | ACTIVE per FMA provider record | P2P lending         | FSP16281   |         |
|       | Citizens Brokerage Limited                                           | ACTIVE per FMA provider record | P2P lending         | FSP10701   |         |
|       | PledgeMe Limited                                                     | ACTIVE per FMA provider record | P2P lending         | FSP359926  |         |
|       | Squirrel Money Limited                                               | ACTIVE per FMA provider record | P2P lending         | FSP354706  |         |

**Suspended (1):**

| Brand | Legal entity               | Status (as of source) | Type                | ID  | Website |
| ----- | -------------------------- | --------------------- | ------------------- | --- | ------- |
|       | The Property Crowd Limited | SUSPENDED             | Equity crowdfunding |     |         |

**Cancelled, withdrawn, ceased or historical (1):**

| Brand | Legal entity     | Status (as of source)          | Type                | ID  | Website |
| ----- | ---------------- | ------------------------------ | ------------------- | --- | ------- |
|       | Equitise Pty Ltd | CANCELLED effective 3 Apr 2024 | Equity crowdfunding |     |         |

#### Australia (8 records)

8 licensees with an explicit CSF permission in the ASIC October 2026 dataset. Current offer activity untested; Equitise is absent from the official dataset.

Sources: https://data.gov.au/data/dataset/ab7eddce-84df-4098-bc8f-500d0d9776d1/resource/d98a113d-6b50-40e6-b65f-2612efc877f4/download/afs_lic_202610.csv
Source date(s): 2026-10 snapshot

**Registered or listed (trading/activity not verified) (8):**

| Brand                         | Legal entity                       | Status (as of source)                         | Type       | ID     | Website                  |
| ----------------------------- | ---------------------------------- | --------------------------------------------- | ---------- | ------ | ------------------------ |
| OnMarket                      | ON-MARKET BOOKBUILDS PTY LIMITED   | Present in ASIC October 2026 licensee dataset | Equity CSF | 421535 | onmarket.com.au          |
| Stride Equity                 | NONPUBLIC PTY LTD                  | Present in ASIC October 2026 licensee dataset | Equity CSF | 482668 | www.strideequity.com.au  |
| Birchal                       | BIRCHAL FINANCIAL SERVICES PTY LTD | Present in ASIC October 2026 licensee dataset | Equity CSF | 502618 | https://www.birchal.com/ |
| Billfolda                     | BILLFOLDA PTY LIMITED              | Present in ASIC October 2026 licensee dataset | Equity CSF | 503322 | www.billfolda.com        |
| VentureCrowd                  | SYNDICATED CAPITAL PTY LTD         | Present in ASIC October 2026 licensee dataset | Equity CSF | 503381 | www.venturecrowd.com.au  |
| Swarmer Pty Ltd               | SWARMER PTY LTD                    | Present in ASIC October 2026 licensee dataset | Equity CSF | 507867 | www.swarmer.com.au       |
| Crowdfunding - Own Your Share | CROWDFUNDING AFSL PTY LTD          | Present in ASIC October 2026 licensee dataset | Equity CSF | 509114 | www.crowdfunding.com.au  |
| FB Ventures                   | FB VENTURES PTY LIMITED            | Present in ASIC October 2026 licensee dataset | Equity CSF | 553008 | www.fbventures.vc        |

#### Japan (7 records)

The current JSDA hub still links the May 2024 five-name list; individual current licences were not re-verified. The loan-fund subset is not exhaustive.

Sources: https://crowdbank.jp/ir/ ; https://funds.jp/about ; https://market.jsda.or.jp/shijyo/kabucrowdfunding/toriatsukaigyousha/20200907114040.html ; https://market.jsda.or.jp/shijyo/kabucrowdfunding/
Source date(s): 2024-05-31, 2026-10-30

**Registered or listed (trading/activity not verified) (5):**

| Brand          | Legal entity                     | Status (as of source)   | Type                | ID  | Website |
| -------------- | -------------------------------- | ----------------------- | ------------------- | --- | ------- |
| e-Crowd        | イークラウド株式会社             | JSDA handling-firm list | Equity crowdfunding |     |         |
| Equity Funding | エクイティファンディング株式会社 | JSDA handling-firm list | Equity crowdfunding |     |         |
| CF Startups    | 株式会社CFスタートアップス       | JSDA handling-firm list | Equity crowdfunding |     |         |
| FUNDINNO       | 株式会社FUNDINNO                 | JSDA handling-firm list | Equity crowdfunding |     |         |
| Unicorn        | 株式会社ユニコーン               | JSDA handling-firm list | Equity crowdfunding |     |         |

**Unverified (company, press or third-party claim only) (2):**

| Brand      | Legal entity                                            | Status (as of source)                    | Type                       | ID        | Website                |
| ---------- | ------------------------------------------------------- | ---------------------------------------- | -------------------------- | --------- | ---------------------- |
| Crowd Bank | 日本クラウド証券株式会社 / Crowd Securities Japan, Inc. | Operator confirms Type I/II registration | Loan-fund / social lending | Kanto115  | https://crowdbank.jp/  |
| Funds      | ファンズ株式会社 / Funds Inc.                           | Operator confirms Type II registration   | Loan-fund investment       | Kanto3103 | https://funds.jp/guide |

#### Thailand (7 records)

7 listed portals; 6 with currently dated approval periods. Trustender displays an approval expiry of 1 Sep 2026; renewal unresolved. PeerPower is expressly equity-only.

Sources: https://www.sec.or.th/TH/Pages/MarketData/ListOperator.aspx
Source date(s): 2026-10-30

**Registered or listed (trading/activity not verified) (6):**

| Brand                       | Legal entity                                 | Status (as of source)          | Type                           | ID                        | Website |
| --------------------------- | -------------------------------------------- | ------------------------------ | ------------------------------ | ------------------------- | ------- |
| Siam Validus Capital        | บริษัท สยาม วาลิดัส แคปปิตอล จำกัด           | Listed approval period current | Securities crowdfunding portal | 22 Jan 2026 - 21 Jan 2031 |         |
| FS Siam / Funding Societies | บริษัท เอฟเอส สยาม จำกัด                     | Listed approval period current | Securities crowdfunding portal | 2 Feb 2026 - 1 Feb 2031   |         |
| Investree Thailand          | บริษัท อินเวสทรี (ไทยแลนด์) จำกัด            | Listed approval period current | Securities crowdfunding portal | 23 Feb 2026 - 22 Feb 2031 |         |
| Crowdfunding Portal         | บริษัท คราวด์ฟันดิง พอร์ทัล จำกัด            | Listed approval period current | Securities crowdfunding portal | 7 Jan 2026 - 6 Jan 2031   |         |
| Bay Smart Ventures Thailand | บริษัท เบย์ สมาร์ท เวนเชอส์ (ไทยแลนด์) จำกัด | Listed approval period current | Securities crowdfunding portal | 7 Feb 2026 - 6 Feb 2031   |         |
| Peer Power Platform         | บริษัท เพียร์ พาวเวอร์ แพลตฟอร์ม จำกัด       | Listed approval period current | Equity-only crowdfunding       | 17 Jan 2025 - 16 Jan 2030 |         |

**Unverified (company, press or third-party claim only) (1):**

| Brand      | Legal entity              | Status (as of source)                          | Type                           | ID                      | Website |
| ---------- | ------------------------- | ---------------------------------------------- | ------------------------------ | ----------------------- | ------- |
| Trustender | บริษัท ทรัสเทนเดอร์ จำกัด | Displayed approval expired; renewal unverified | Securities crowdfunding portal | 2 Sep 2021 - 1 Sep 2026 |         |

#### Kazakhstan (AIFC) (6 records)

AFSA registers: 3 active dual-permission firms on the main register, InvestRoom active in the FinTech Lab, and 2 firms licensed but pending approval to commence. National Kazakhstan (outside the AIFC) was not assumed covered.

Sources: https://publicreg.myafsa.com/authorised_mi/ ; https://publicreg.myafsa.com/fintech/
Source date(s): 2026-10-30

**Registered or listed (trading/activity not verified) (4):**

| Brand | Legal entity     | Status (as of source)                       | Type                             | ID                  | Website |
| ----- | ---------------- | ------------------------------------------- | -------------------------------- | ------------------- | ------- |
|       | FFusion Ltd.     | active per AFSA market-institution register | Loan and investment crowdfunding | AFSA-A-LA-2025-0017 |         |
|       | iKapitalist Ltd. | active per AFSA market-institution register | Loan and investment crowdfunding | AFSA-A-LA-2023-0005 |         |
|       | GoCrowd Limited  | active per AFSA market-institution register | Loan and investment crowdfunding | AFSA-A-LA-2021-0014 |         |
|       | InvestRoom Ltd.  | active                                      | Loan crowdfunding                | AFSA-G-LA-2022-0005 |         |

**Pending, applied or not granted (2):**

| Brand | Legal entity                | Status (as of source)                                             | Type                             | ID                  | Website |
| ----- | --------------------------- | ----------------------------------------------------------------- | -------------------------------- | ------------------- | ------- |
|       | CapitalLink Ltd.            | Licence granted - pending approval for commencement of operations | Loan and investment crowdfunding | AFSA-A-LA-2026-0024 |         |
|       | Investment Club BRICS+ Ltd. | Licence granted - pending approval for commencement of operations | Loan and investment crowdfunding | AFSA-G-LA-2024-0014 |         |

#### Singapore (6 records)

MAS profile headings verified for 6 named entities; Validus has lodged notice of cessation. CMS listings do not prove current crowdfunding offers; Alta is a broader private-market platform.

Sources: - https://eservices.mas.gov.sg/fid/institution/detail/200699-FUNDED-HERE-PTE-LTD<br>- https://eservices.mas.gov.sg/fid/institution/detail/200949-IN-FUND-PTE-LTD<br>- https://eservices.mas.gov.sg/fid/institution/detail/200984-FUNDING-SOCIETIES-PTE-LTD ; https://help.fundingsocieties.com/en/articles/700585-is-funding-societies-a-regulated-financial-institution-by-mas<br>- https://eservices.mas.gov.sg/fid/institution/detail/201008-ALTA-ALTERNATIVE-INVESTMENTS-PTE-LTD<br>- https://eservices.mas.gov.sg/fid/institution/detail/201141-CA-FUNDING-PTE-LTD<br>- https://eservices.mas.gov.sg/fid/institution/detail/218417-VALIDUS-CAPITAL-PTE-LTD
Source date(s): 2026-10-30

**Registered or listed (trading/activity not verified) (4):**

| Brand                   | Legal entity                           | Status (as of source)                                            | Type                                                             | ID  | Website                                                                                                            |
| ----------------------- | -------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- | --- | ------------------------------------------------------------------------------------------------------------------ |
| Funding Societies       | Funding Societies Pte. Ltd.            | CMS Licensee, dealing securities; exempt FA                      | P2P / debt crowdfunding                                          |     | https://help.fundingsocieties.com/en/articles/700585-is-funding-societies-a-regulated-financial-institution-by-mas |
| FundedHere              | Funded Here Pte. Ltd.                  | CMS Licensee, dealing securities                                 | Capital / co-investment platform                                 |     | https://www.fundedhere.com/about-us                                                                                |
| MoolahSense             | IN FUND Pte. Ltd.                      | CMS Licensee, dealing securities; exempt FA                      | Debt crowdfunding (historical brand)                             |     | http://www.moolahsense.com                                                                                         |
| Alta (formerly Fundnel) | Alta Alternative Investments Pte. Ltd. | CMS Licensee: fund management, securities/CIS dealing; exempt FA | Private-market investment/syndication, broader than crowdfunding |     | https://www.alta.exchange/                                                                                         |

**Unverified (company, press or third-party claim only) (1):**

| Brand                 | Legal entity         | Status (as of source)                                                | Type                           | ID  | Website                                                                                                                                          |
| --------------------- | -------------------- | -------------------------------------------------------------------- | ------------------------------ | --- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| CoAssets / CA Funding | CA Funding Pte. Ltd. | CMS Licensee and exempt FA; current crowdfunding activity unresolved | Debt crowdfunding (historical) |     | https://www.mas.gov.sg/regulation/enforcement/enforcement-actions/2021/singapore-police-force-and-mas-investigate-companies-under-coassets-group |

**Cancelled, withdrawn, ceased or historical (1):**

| Brand   | Legal entity              | Status (as of source)                     | Type                | ID  | Website                |
| ------- | ------------------------- | ----------------------------------------- | ------------------- | --- | ---------------------- |
| Validus | Validus Capital Pte. Ltd. | CMS Licensee - LODGED NOTICE OF CESSATION | P2P / SME financing |     | https://gxscapital.sg/ |

#### Philippines (3 records)

The SEC December 2023 list of 3 intermediaries is historical; current licence status could not be confirmed (CheckWithSEC attempts timed out). Investree PH announced wind-down.

Sources: https://pia.gov.ph/press-release/sec-sees-msmes-start-ups-tapping-capital-market-amid-success-of-nationwide-roadshow/ ; https://pia.gov.ph/press-release/sec-sees-msmes-start-ups-tapping-capital-market-amid-success-of-nationwide-roadshow/ ; https://www.philstar.com/business/2024/05/26/2357865/investree-philippines-close-shop-next-year
Source date(s): 2023-12-28 official list; checked 2026-10-30

**Unverified (company, press or third-party claim only) (2):**

| Brand     | Legal entity                               | Status (as of source)                                  | Type                | ID  | Website                  |
| --------- | ------------------------------------------ | ------------------------------------------------------ | ------------------- | --- | ------------------------ |
| Round One | Eastern Securities Development Corporation | SEC named in Dec2023; current operator site available  | Equity crowdfunding |     | https://www.roundone.ph/ |
| SeedIn    | SeedIn Technology, Inc.                    | SEC named in Dec2023; current active status unresolved | Debt crowdfunding   |     |                          |

**Cancelled, withdrawn, ceased or historical (1):**

| Brand        | Legal entity                | Status (as of source)                                               | Type              | ID  | Website |
| ------------ | --------------------------- | ------------------------------------------------------------------- | ----------------- | --- | ------- |
| Investree PH | Investree Philippines, Inc. | Historical: announced wind-down through Sep2025; not current-active | Debt crowdfunding |     |         |

#### Uzbekistan (2 records)

2 investment-platform operators in the NAPP special regime (sandbox; not an unrestricted licence).

Sources: https://napp.uz/en/pages/register-of-ips
Source date(s): 2026-10-30

**Experimental permit or sandbox (not a full licence) (2):**

| Brand      | Legal entity                 | Status (as of source)                 | Type                        | ID                             | Website             |
| ---------- | ---------------------------- | ------------------------------------- | --------------------------- | ------------------------------ | ------------------- |
| WAY INVEST | WAY II MANAGEMENT LLC        | Registered special-regime participant | Investment platform sandbox | #0001 / Decision35 28.04.2026  | https://wayll.uz/ru |
| IMANUM     | Adl INVESTMENTS PLATFORM LLC | Registered special-regime participant | Investment platform sandbox | #0002 / Decision142 24.09.2026 | https://imanum.app  |

#### Taiwan (2 records)

TPEx list of 2 securities firms operating equity crowdfunding. The GISA board is separate.

Sources: https://www.tpex.org.tw/zh-tw/service/securities-firm/eqcf/sec.html
Source date(s): 2026-10-30

**Registered or listed (trading/activity not verified) (2):**

| Brand | Legal entity                   | Status (as of source)                            | Type                | ID   | Website |
| ----- | ------------------------------ | ------------------------------------------------ | ------------------- | ---- | ------- |
|       | 第一金證券 / First Securities  | TPEx list of firms operating equity crowdfunding | Equity crowdfunding | 5380 |         |
|       | 大昌證券 / Ta Chang Securities | TPEx list of firms operating equity crowdfunding | Equity crowdfunding | 6460 |         |

#### Bhutan (1 records)

Bhutan Crowdfunding: operator states RMA licensed; not an exhaustive licence register read.

Sources: https://bhutancrowdfunding.rsebl.org.bt/
Source date(s): 2026-10-30

**Unverified (company, press or third-party claim only) (1):**

| Brand               | Legal entity                        | Status (as of source)             | Type                | ID  | Website                                  |
| ------------------- | ----------------------------------- | --------------------------------- | ------------------- | --- | ---------------------------------------- |
| Bhutan Crowdfunding | Royal Securities Exchange of Bhutan | Operator site states RMA licensed | Equity crowdfunding |     | https://bhutancrowdfunding.rsebl.org.bt/ |

#### Hong Kong (1 records)

AngelHub licence SUSPENDED (dealing and advising) per its actual SFC profile read 30 Oct 2026 - a search-result active flag was not used.

Sources: https://apps.sfc.hk/publicregWeb/corp/BLO833/details
Source date(s): 2026-10-30

**Suspended (1):**

| Brand    | Legal entity     | Status (as of source)                                                   | Type                                             | ID     | Website                              |
| -------- | ---------------- | ----------------------------------------------------------------------- | ------------------------------------------------ | ------ | ------------------------------------ |
| AngelHub | AngelHub Limited | SFC licence SUSPENDED: Dealing in Securities and Advising on Securities | Equity crowdfunding, professional investors only | BLO833 | https://angelhub.io/company/about-us |

#### Pakistan (1 records)

Finja: SECP grant 2023 plus current operator statement. No exhaustive P2P register extracted.

Sources: https://www.secp.gov.pk/wp-content/uploads/2023/06/Press-Release-June-13-SECP-approves-Pakistans-first-P2P-Lending-Platform.pdf
Source date(s): 2026-10-30

**Unverified (company, press or third-party claim only) (1):**

| Brand        | Legal entity                   | Status (as of source)                           | Type               | ID  | Website                      |
| ------------ | ------------------------------ | ----------------------------------------------- | ------------------ | --- | ---------------------------- |
| Finja Invest | Finja Lending Services Limited | SECP grant 2023; current operator says licensed | P2P financing only |     | https://www.finjainvest.com/ |

### Middle East

#### Iran (26 records)

About 30 platform names from two third-party lists, which disagree on some sponsors. The Fara Bourse / SEO register (Persian) was not read. Sanctions and payment limits not assessed.

Sources: https://noviraco.com/list-crowdfundings/ ; https://blog.hafez.co/iran-crowdfunding-platforms-list/
Source date(s): 2026-10-30

**Unverified (company, press or third-party claim only) (22):**

| Brand          | Legal entity | Status (as of source)                                      | Type                                                  | ID  | Website |
| -------------- | ------------ | ---------------------------------------------------------- | ----------------------------------------------------- | --- | ------- |
| Dongi          |              | On third-party platform lists; regulator register not read | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |
| Karen Crowd    |              | On third-party platform lists; regulator register not read | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |
| Hamafarin      |              | On third-party platform lists; regulator register not read | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |
| IB Crowd       |              | On third-party platform lists; regulator register not read | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |
| Halal Fund     |              | On third-party platform lists; regulator register not read | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |
| Razavi         |              | On third-party platform lists; regulator register not read | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |
| Zarin Crowd    |              | On third-party platform lists; regulator register not read | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |
| Startamin      |              | On third-party platform lists; regulator register not read | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |
| Hamashena      |              | On third-party platform lists; regulator register not read | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |
| iFund          |              | On third-party platform lists; regulator register not read | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |
| Charisma Crowd |              | On third-party platform lists; regulator register not read | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |
| Zeema          |              | On third-party platform lists; regulator register not read | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |
| Maskan Plus    |              | On third-party platform lists; regulator register not read | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |
| Pulsar         |              | On third-party platform lists; regulator register not read | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |
| Danayan Crowd  |              | On third-party platform lists; regulator register not read | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |
| Fundocrowd     |              | On third-party platform lists; regulator register not read | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |
| Zotch          |              | On third-party platform lists; regulator register not read | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |
| Sepehrino      |              | On third-party platform lists; regulator register not read | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |
| Vesta Crowd    |              | On third-party platform lists; regulator register not read | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |
| Novin Crowd    |              | On third-party platform lists; regulator register not read | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |
| Opal Crowd     |              | On third-party platform lists; regulator register not read | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |
| Rayfund        |              | On third-party platform lists; regulator register not read | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |

**Cancelled, withdrawn, ceased or historical (4):**

| Brand         | Legal entity | Status (as of source)                                              | Type                                                  | ID  | Website |
| ------------- | ------------ | ------------------------------------------------------------------ | ----------------------------------------------------- | --- | ------- |
| Mobin Crowd   |              | Marked inactive by one third-party list (historical (third-party)) | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |
| Ati Crowd     |              | Marked inactive by one third-party list (historical (third-party)) | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |
| Smart Funding |              | Marked inactive by one third-party list (historical (third-party)) | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |
| Paresh        |              | Marked inactive by one third-party list (historical (third-party)) | Crowdfunding platform (SEO directive via Fara Bourse) |     |         |

#### Turkey (18 records)

Complete official SPK list of 18 share-based platforms (Dinamik removed, bulletin 2026/28). No debt-based platform is on the list.

Sources: https://spk.gov.tr/sirketler/kitle-fonlama-platformlari/listeye-alinan-platformlar
Source date(s): 2026-10-30

**Registered or listed (trading/activity not verified) (18):**

| Brand         | Legal entity                              | Status (as of source)                                                           | Type                                                          | ID  | Website       |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------- | --- | ------------- |
|               | Vakif Yatirim Menkul Degerler AS          | On SPK list of authorised share-based crowdfunding platforms (as of 2021-04-01) | Share-based crowdfunding platform (SPK Communique III-35/A.2) |     |               |
|               | Global Kitle Fonlama Platformu AS         | On SPK list of authorised share-based crowdfunding platforms (as of 2021-04-08) | Share-based crowdfunding platform (SPK Communique III-35/A.2) |     |               |
|               | Halk Yatirim Menkul Degerler AS           | On SPK list of authorised share-based crowdfunding platforms (as of 2021-09-30) | Share-based crowdfunding platform (SPK Communique III-35/A.2) |     |               |
|               | Info Yatirim Menkul Degerler AS           | On SPK list of authorised share-based crowdfunding platforms (as of 2021-11-25) | Share-based crowdfunding platform (SPK Communique III-35/A.2) |     |               |
|               | Fongogo Kitle Fonlama Platformu AS        | On SPK list of authorised share-based crowdfunding platforms (as of 2022-01-06) | Share-based crowdfunding platform (SPK Communique III-35/A.2) |     |               |
| fonangels.com | Girisim Kitle Fonlama Platformu AS        | On SPK list of authorised share-based crowdfunding platforms (as of 2022-02-24) | Share-based crowdfunding platform (SPK Communique III-35/A.2) |     | fonangels.com |
|               | Ecofolio Kitle Fonlama Platformu AS       | On SPK list of authorised share-based crowdfunding platforms (as of 2023-04-13) | Share-based crowdfunding platform (SPK Communique III-35/A.2) |     |               |
|               | Nar Kitle Fonlama Platformu AS            | On SPK list of authorised share-based crowdfunding platforms (as of 2023-05-05) | Share-based crowdfunding platform (SPK Communique III-35/A.2) |     |               |
|               | Startupfon Kitle Fonlama Platformu AS     | On SPK list of authorised share-based crowdfunding platforms (as of 2023-09-28) | Share-based crowdfunding platform (SPK Communique III-35/A.2) |     |               |
|               | Forte Kitle Fonlama Platformu AS          | On SPK list of authorised share-based crowdfunding platforms (as of 2023-11-22) | Share-based crowdfunding platform (SPK Communique III-35/A.2) |     |               |
|               | Mag Kitle Fonlama Platformu AS            | On SPK list of authorised share-based crowdfunding platforms (as of 2023-12-21) | Share-based crowdfunding platform (SPK Communique III-35/A.2) |     |               |
|               | Birikim Kitle Fonlama Platformu AS        | On SPK list of authorised share-based crowdfunding platforms (as of 2024-01-09) | Share-based crowdfunding platform (SPK Communique III-35/A.2) |     |               |
|               | Ardventure Kitle Fonlama Platformu AS     | On SPK list of authorised share-based crowdfunding platforms (as of 2024-03-21) | Share-based crowdfunding platform (SPK Communique III-35/A.2) |     |               |
|               | Startupcentrum Kitle Fonlama Platformu AS | On SPK list of authorised share-based crowdfunding platforms (as of 2024-09-19) | Share-based crowdfunding platform (SPK Communique III-35/A.2) |     |               |
|               | Trinkfon Kitle Fonlama Platformu AS       | On SPK list of authorised share-based crowdfunding platforms (as of 2024-11-28) | Share-based crowdfunding platform (SPK Communique III-35/A.2) |     |               |
|               | Tohum Kitle Fonlama Platformu AS          | On SPK list of authorised share-based crowdfunding platforms (as of 2024-12-05) | Share-based crowdfunding platform (SPK Communique III-35/A.2) |     |               |
|               | Misyon Yatirim Bankasi AS                 | On SPK list of authorised share-based crowdfunding platforms (as of 2025-03-27) | Share-based crowdfunding platform (SPK Communique III-35/A.2) |     |               |
|               | Fonventure Kitle Fonlama Platformu AS     | On SPK list of authorised share-based crowdfunding platforms (as of 2025-08-28) | Share-based crowdfunding platform (SPK Communique III-35/A.2) |     |               |

#### Saudi Arabia (CMA) (12 records)

12 firms hold CMA experimental fintech permits for offering/investing in debt instruments - permits, not licences; names transliterated from Arabic.

Sources: https://cma.gov.sa/Market/fintech/Pages/ExpFinTechs.aspx
Source date(s): 2026-10-30

**Experimental permit or sandbox (not a full licence) (12):**

| Brand | Legal entity                            | Status (as of source)                                                      | Type                                                                          | ID  | Website |
| ----- | --------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --- | ------- |
|       | Al Amin Capital                         | CMA experimental fintech permit (permit, not a licence) (as of 2020-01-01) | Offering debt instruments and investing in them (experimental fintech permit) |     |         |
|       | Rakeez Financial                        | CMA experimental fintech permit (permit, not a licence) (as of 2022-01-01) | Offering debt instruments and investing in them (experimental fintech permit) |     |         |
|       | Al Tanafusiya Financial                 | CMA experimental fintech permit (permit, not a licence) (as of 2022-01-01) | Offering debt instruments and investing in them (experimental fintech permit) |     |         |
|       | Tarmeez Capital Financial               | CMA experimental fintech permit (permit, not a licence) (as of 2022-01-01) | Offering debt instruments and investing in them (experimental fintech permit) |     |         |
|       | Qarar Platform for Financial Technology | CMA experimental fintech permit (permit, not a licence) (as of 2023-01-01) | Offering debt instruments and investing in them (experimental fintech permit) |     |         |
|       | Safqa Financial                         | CMA experimental fintech permit (permit, not a licence) (as of 2023-01-01) | Offering debt instruments and investing in them (experimental fintech permit) |     |         |
|       | Tarh Financial                          | CMA experimental fintech permit (permit, not a licence) (as of 2023-01-01) | Offering debt instruments and investing in them (experimental fintech permit) |     |         |
|       | Ajdar Fintech                           | CMA experimental fintech permit (permit, not a licence) (as of 2023-01-01) | Offering debt instruments and investing in them (experimental fintech permit) |     |         |
|       | Irat Financial                          | CMA experimental fintech permit (permit, not a licence) (as of 2023-01-01) | Offering debt instruments and investing in them (experimental fintech permit) |     |         |
|       | Kifaya Financial                        | CMA experimental fintech permit (permit, not a licence) (as of 2023-01-01) | Offering debt instruments and investing in them (experimental fintech permit) |     |         |
|       | Oasis Al-Usool for Financial Technology | CMA experimental fintech permit (permit, not a licence) (as of 2024-01-01) | Offering debt instruments and investing in them (experimental fintech permit) |     |         |
|       | Sahim Platform Financial                | CMA experimental fintech permit (permit, not a licence) (as of 2024-01-01) | Offering debt instruments and investing in them (experimental fintech permit) |     |         |

#### Oman (11 records)

The FSA named 7 licensed platforms (Sep 2025); only the Ithbar register entry was read individually (Active, expiry 2028). Sharek and New Sphere were cancelled in March 2025.

Sources: - https://fsa.gov.om/Home/DisplayCompanyDetails?companyId=7&companyType=18&selectedCo=<br>- https://fsa.gov.om/Home/News/10690<br>- https://fsa.gov.om/home/PrintNews/10727<br>- https://fsa.gov.om/home/PrintNews/9493
Source date(s): 2026-10-30

**Registered or listed (trading/activity not verified) (8):**

| Brand   | Legal entity                  | Status (as of source)                                                    | Type                                            | ID  | Website |
| ------- | ----------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------- | --- | ------- |
| Rawafid |                               | Named as licensed platform in FSA statement (28 Sep 2025)                | Crowdfunding platform (FSA Decision E/153/2021) |     |         |
| Ithbar  |                               | Named as licensed platform in FSA statement (28 Sep 2025)                | Crowdfunding platform (FSA Decision E/153/2021) |     |         |
| Tamalak |                               | Named as licensed platform in FSA statement (28 Sep 2025)                | Crowdfunding platform (FSA Decision E/153/2021) |     |         |
| Beehive |                               | Named as licensed platform in FSA statement (28 Sep 2025)                | Crowdfunding platform (FSA Decision E/153/2021) |     |         |
| Ethis   |                               | Named as licensed platform in FSA statement (28 Sep 2025)                | Crowdfunding platform (FSA Decision E/153/2021) |     |         |
| Wadiaa  |                               | Named as licensed platform in FSA statement (28 Sep 2025)                | Crowdfunding platform (FSA Decision E/153/2021) |     |         |
| Mamun   |                               | Named as licensed platform in FSA statement (28 Sep 2025)                | Crowdfunding platform (FSA Decision E/153/2021) |     |         |
| EthisX  | Ethis Investment Platform LLC | First FSA-licensed platform (March 2022, FSA release) (as of 2022-03-01) | Crowdfunding platform                           |     |         |

**Unverified (company, press or third-party claim only) (1):**

| Brand  | Legal entity | Status (as of source)                                                      | Type                                  | ID         | Website |
| ------ | ------------ | -------------------------------------------------------------------------- | ------------------------------------- | ---------- | ------- |
| Ithbar | ITHBAR       | FSA company register: Active; licence expiry 31/12/2028 (as of 2022-09-18) | Crowd Funding (FSA register category) | CR 1451885 |         |

**Cancelled, withdrawn, ceased or historical (2):**

| Brand | Legal entity          | Status (as of source)                                                                                                       | Type                              | ID  | Website |
| ----- | --------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | --- | ------- |
|       | Sharek Investment LLC | Licence cancelled by FSA (March 2025) for never starting activity (as of 2025-03-01; historical register entry - cancelled) | Crowdfunding platform (cancelled) |     |         |
|       | New Sphere LLC        | Licence cancelled by FSA (March 2025) for never starting activity (as of 2025-03-01; historical register entry - cancelled) | Crowdfunding platform (cancelled) |     |         |

#### United Arab Emirates (DIFC) (10 records)

DFSA register filtered by "Operating a Crowdfunding Platform": 6 authorised firms and 4 withdrawn. Eureeca DIFC is withdrawn (24 Nov 2023); an earlier DFSA alert predates the withdrawal.

Sources: https://www.dfsa.ae/public-register/firms
Source date(s): 2026-10-30

**Registered or listed (trading/activity not verified) (6):**

| Brand | Legal entity             | Status (as of source)                              | Type                                            | ID      | Website |
| ----- | ------------------------ | -------------------------------------------------- | ----------------------------------------------- | ------- | ------- |
|       | Smart Crowd Limited      | Authorised firm (DFSA register) (as of 2018-04-19) | Crowdfunding platform (activity limit not read) | F004285 |         |
|       | Beehive P2P Limited      | Authorised firm (DFSA register) (as of 2017-08-01) | Loan crowdfunding platform                      | F004422 |         |
|       | Funding Souq Limited     | Authorised firm (DFSA register) (as of 2020-05-21) | Crowdfunding platform (activity limit not read) | F005822 |         |
|       | Stake Properties Limited | Authorised firm (DFSA register)                    | Crowdfunding platform (activity limit not read) | F005879 |         |
|       | Analah (DIFC) Limited    | Authorised firm (DFSA register)                    | Crowdfunding platform (activity limit not read) | F006695 |         |
|       | Baytukum Tech Ltd        | Authorised firm (DFSA register) (as of 2022-07-07) | Property crowdfunding platform                  | F006796 |         |

**Cancelled, withdrawn, ceased or historical (4):**

| Brand | Legal entity            | Status (as of source)                                                                  | Type                                            | ID      | Website |
| ----- | ----------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------- | ------- | ------- |
|       | Eureeca DIFC Limited    | Withdrawn from DFSA register (as of 2023-11-24; historical register entry - withdrawn) | Investment crowdfunding platform                | F006024 |         |
|       | FundedByMe MENA Limited | Withdrawn from DFSA register (as of 2022-03-23; historical register entry - withdrawn) | Crowdfunding platform (activity limit not read) | F004344 |         |
|       | Bambucorn Ltd           | Withdrawn from DFSA register (as of 2023-02-10; historical register entry - withdrawn) | Equity crowdfunding platform                    | F005637 |         |
|       | YVC MEA LTD             | Withdrawn from DFSA register (historical register entry - withdrawn)                   | Crowdfunding platform (activity limit not read) | F005616 |         |

#### Saudi Arabia (SAMA) (8 records)

SAMA stated on 24 Nov 2025 that 14 companies are licensed for debt-based crowdfunding. The full list could not be read (SAMA pages errored); 8 are named here from official SAMA/SPA announcements. Dated statement, not a current verified count.

Sources: - https://spa.gov.sa/en/N2034232<br>- https://spa.gov.sa/en/N2103591<br>- https://spa.gov.sa/en/N2643228<br>- https://www.sama.gov.sa/en-US/News/Pages/news-1064.aspx ; https://www.spa.gov.sa/en/N2235926<br>- https://www.sama.gov.sa/en-us/mediacenter/news/pages/news-1122.aspx<br>- https://www.spa.gov.sa/en/N2078214<br>- https://www.zawya.com/en/business/fintech/saudi-central-bank-licenses-2-debt-based-crowdfunding-fintechs-380942
Source date(s): 2026-10-30

**Registered or listed (trading/activity not verified) (8):**

| Brand                     | Legal entity | Status (as of source)                                                                        | Type                                   | ID  | Website |
| ------------------------- | ------------ | -------------------------------------------------------------------------------------------- | -------------------------------------- | --- | ------- |
| Forusand                  |              | Licensed per SAMA/SPA announcement; announced Jan 2023 (as of 2023-01-01)                    | Debt-based crowdfunding (SAMA licence) |     |         |
| Tameed                    |              | Licensed per SAMA/SPA announcement; announced Jan 2023 (as of 2023-01-01)                    | Debt-based crowdfunding (SAMA licence) |     |         |
| Thara                     |              | Licensed per SAMA/SPA announcement; announced date not read                                  | Debt-based crowdfunding (SAMA licence) |     |         |
| Funding Souq              |              | Licensed per SAMA/SPA announcement (10th licensed); announced 3 Apr 2024 (as of 2024-04-03)  | Debt-based crowdfunding (SAMA licence) |     |         |
| Hala Financing            |              | Licensed per SAMA/SPA announcement; announced date not read                                  | Debt-based crowdfunding (SAMA licence) |     |         |
| Tal Finance               |              | Licensed per SAMA/SPA announcement; announced date not read                                  | Debt-based crowdfunding (SAMA licence) |     |         |
| Madd Balas                |              | Licensed per SAMA/SPA announcement (14th licensed); announced 24 Nov 2025 (as of 2025-11-24) | Debt-based crowdfunding (SAMA licence) |     |         |
| Mansat Hima for Financing |              | Licensed per SAMA/SPA announcement; announced date not read                                  | Debt-based crowdfunding (SAMA licence) |     |         |

#### Bahrain (3 records)

Names are company/press claims; the CBB directory has no crowdfunding category and name searches returned no rows.

Sources: https://www.beban.me/content/faq/ ; https://www.tradearabia.com/News/268277/Beban-receives-CBB-license-for-crowdfunding-activities
Source date(s): 2026-10-30

**Unverified (company, press or third-party claim only) (3):**

| Brand     | Legal entity | Status (as of source)                           | Type                                                            | ID  | Website |
| --------- | ------------ | ----------------------------------------------- | --------------------------------------------------------------- | --- | ------- |
| Beban     |              | Claimed licensed; not confirmed on CBB register | Crowdfunding platform (CBB CFP module, regulations 28 Apr 2022) |     |         |
| Bambucorn |              | Claimed licensed; not confirmed on CBB register | Crowdfunding platform (CBB CFP module, regulations 28 Apr 2022) |     |         |
| Beehive   |              | Claimed licensed; not confirmed on CBB register | Crowdfunding platform (CBB CFP module, regulations 28 Apr 2022) |     |         |

#### Israel (2 records)

Two coordinator names; the current ISA coordinator register was not located.

Sources: https://invest.fundit.co.il/page/coordinator ; https://www.new.isa.gov.il/images/Fittings/isa/asset_library_pic/al_lobby/al_lobby-627a6153674e4/MPM.pdf
Source date(s): 2026-10-30

**Unverified (company, press or third-party claim only) (2):**

| Brand    | Legal entity                   | Status (as of source)                                                                                                             | Type                                                      | ID  | Website |
| -------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --- | ------- |
| Fund-it  | Fund-it (2016) Ltd             | Own coordinator disclosure page; current ISA coordinator register not located                                                     | Offering coordinator (ISA 2017 regulations, amended 2025) |     |         |
| PipelBiz | PipelBiz Social Businesses Ltd | ISA letter: entered in offering coordinator register 14 Jan 2018; current ISA coordinator register not located (as of 2018-01-14) | Offering coordinator (ISA 2017 regulations, amended 2025) |     |         |

#### United Arab Emirates (ADGM) (1 records)

Finstreet Capital: Active as a Private Financing Platform from Sep 2024. Other ADGM operators not ruled out (no usable activity filter).

Sources: https://www.adgm.com/public-registers/fsra/firms/financial-firms/finstreet-capital-limited-220148
Source date(s): 2026-10-30

**Registered or listed (trading/activity not verified) (1):**

| Brand     | Legal entity              | Status (as of source)                                                                | Type                                | ID         | Website |
| --------- | ------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------- | ---------- | ------- |
| Finstreet | Finstreet Capital Limited | Active: Operating a Private Financing Platform (from 04 Sep 2024) (as of 2024-09-04) | Private Financing Platform operator | FSP 220148 |         |

#### United Arab Emirates (federal SCA) (1 records)

BHM Capital: first SCA crowdfunding platform operator licence (June 2023, company disclosure); current status not rechecked. Mainland trade licences are not financial licences.

Sources: https://feeds.dfm.ae/documents/2023/Jun/06/3314d8b7-387a-49eb-a43f-6f0e9e2c257f/BHMCAPITAL_E_06_06_2023.pdf
Source date(s): 2026-10-30

**Unverified (company, press or third-party claim only) (1):**

| Brand       | Legal entity                       | Status (as of source)                                                                                                                   | Type                                                        | ID                      | Website |
| ----------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------- | ------- |
| BHM Capital | BHM Capital Financial Services PSC | First SCA crowdfunding platform operator licence (announced June 2023); current status not rechecked on SCA register (as of 2023-06-06) | Crowdfunding platform operator (Cabinet Resolution 36/2022) | SCA registration 604097 |         |

#### Kuwait (1 records)

Almowazi Capital (iMowazi): CMA approval per press; register entry not found.

Sources: https://kuwaittimes.com/article/30886/business/imowazi-kuwaits-first-registered-digital-securities-based-crowdfunding-platform/
Source date(s): 2026-10-30

**Unverified (company, press or third-party claim only) (1):**

| Brand   | Legal entity     | Status (as of source)                                                        | Type                                   | ID  | Website |
| ------- | ---------------- | ---------------------------------------------------------------------------- | -------------------------------------- | --- | ------- |
| iMowazi | Almowazi Capital | CMA-approved per company and press (July 2025); CMA register entry not found | Securities-based crowdfunding platform |     |         |

#### Jordan (1 records)

Sources: https://beeezcrowd.com/how-it-works.html
Source date(s): 2026-10-30

**Unverified (company, press or third-party claim only) (1):**

| Brand                        | Legal entity | Status (as of source)                                                                          | Type                                | ID  | Website |
| ---------------------------- | ------------ | ---------------------------------------------------------------------------------------------- | ----------------------------------- | --- | ------- |
| BeeezCrowd (pontoon fintech) | Beeezcrowd   | Own site: only taking interest registrations, cannot take investments; NOT a licensed platform | Crowdfunding platform (pre-licence) |     |         |

### Africa

#### Ghana (5 records)

Complete SEC Ghana lists: 5 platforms. The Regulatory Status column is blank on both lists.

Sources: https://licensees.sec.gov.gh/licensees/CrowdfundingPlatform.php ; https://licensees.sec.gov.gh/licensees/CrowdfundingIntermediary.php
Source date(s): 2026-10-30

**Registered or listed (trading/activity not verified) (5):**

| Brand | Legal entity                                     | Status (as of source)                                            | Type                                              | ID  | Website            |
| ----- | ------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------- | --- | ------------------ |
|       | Grow For Me Limited                              | On SEC Ghana crowdfunding platform list (intermediary list: yes) | Crowdfunding platform (SEC Ghana Guidelines 2024) |     | growforme.com      |
|       | Obotan Limited                                   | On SEC Ghana crowdfunding platform list (intermediary list: no)  | Crowdfunding platform (SEC Ghana Guidelines 2024) |     | obotanplc.com      |
|       | Pesewa Rising Ltd                                | On SEC Ghana crowdfunding platform list (intermediary list: no)  | Crowdfunding platform (SEC Ghana Guidelines 2024) |     | pesewarising.com   |
|       | Propartners Exchange Limited                     | On SEC Ghana crowdfunding platform list (intermediary list: yes) | Crowdfunding platform (SEC Ghana Guidelines 2024) |     | propartners.com.gh |
|       | Regulus Investment and Financial Services Gh Ltd | On SEC Ghana crowdfunding platform list (intermediary list: yes) | Crowdfunding platform (SEC Ghana Guidelines 2024) |     | regulus.finance    |

#### Nigeria (5 records)

4 "Crowdfunding Platform" entries found on the SEC register in a partial sweep (33 of 70 pages read before site timeouts). More may be registered; MonieWorx was not seen on the pages read.

Sources: - https://monieworx.com/ ; https://nairametrics.com/2025/09/20/meet-the-owners-of-nigerias-sec-approved-crowdfunding-platforms/<br>- https://sec.gov.ng/for-investors/find-a-registered-operator/?page=38<br>- https://sec.gov.ng/for-investors/find-a-registered-operator/?page=45<br>- https://sec.gov.ng/for-investors/find-a-registered-operator/?page=46<br>- https://sec.gov.ng/for-investors/find-a-registered-operator/?page=48
Source date(s): 2026-10-30

**Registered or listed (trading/activity not verified) (4):**

| Brand | Legal entity                 | Status (as of source)                                                                             | Type                                   | ID          | Website |
| ----- | ---------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------- | ----------- | ------- |
|       | Maxfund Africa Limited       | On SEC "Find a Registered Operator" register, function "Crowdfunding Platform"                    | Crowdfunding Platform (SEC Rules 2021) | CAC 6921479 |         |
|       | Susumi Capital Index Limited | On SEC "Find a Registered Operator" register, function "Crowdfunding Platform" (as of 2026-10-18) | Crowdfunding Platform (SEC Rules 2021) | CAC 1536123 |         |
|       | Pennytree Business Limited   | On SEC "Find a Registered Operator" register, function "Crowdfunding Platform" (as of 2023-09-01) | Crowdfunding Platform (SEC Rules 2021) | CAC 1834911 |         |
|       | Propcrowdy Limited           | On SEC "Find a Registered Operator" register, function "Crowdfunding Platform" (as of 2022-01-01) | Crowdfunding Platform (SEC Rules 2021) | CAC 1543260 |         |

**Unverified (company, press or third-party claim only) (1):**

| Brand     | Legal entity                         | Status (as of source)                                                     | Type                                   | ID  | Website |
| --------- | ------------------------------------ | ------------------------------------------------------------------------- | -------------------------------------- | --- | ------- |
| MonieWorx | Obelix 4.1.1 Alternative Finance Ltd | Not seen on the 33 SEC register pages read; may be on the 37 unread pages | Crowdfunding platform (SEC Rules 2021) |     |         |

#### Morocco (1 records)

AMMC investment category: no crowdfunding company approved (page current as read). Bank Al-Maghrib approved Invest Alif SA (loan/donation); two further 2024 approvals unnamed in sources found.

Sources: https://librentreprise.ma/2025/05/26/crowdfunding-bank-al-maghrib-autorise-une-nouvelle-societe/
Source date(s): 2026-10-30

**Registered or listed (trading/activity not verified) (1):**

| Brand       | Legal entity   | Status (as of source)                                                                | Type                                                        | ID  | Website |
| ----------- | -------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------- | --- | ------- |
| Invest Alif | Invest Alif SA | Approved by Bank Al-Maghrib, Governor order no. 140 (20 Jun 2024) (as of 2024-06-20) | Loan and donation crowdfunding (Law 15-18, Bank Al-Maghrib) |     |         |

#### Algeria (1 records)

YINVESTI: COSOB final CIP approval confirmed from the notice title only.

Sources: https://cosob.dz/octroi-dun-agrement-definitif-a-la-societe-yinvesti-pour-exercer-en-tant-que-conseiller-
Source date(s): 2026-10-30

**Registered or listed (trading/activity not verified) (1):**

| Brand    | Legal entity  | Status (as of source)                     | Type                                                   | ID  | Website |
| -------- | ------------- | ----------------------------------------- | ------------------------------------------------------ | --- | ------- |
| YINVESTI | YINVESTI SARL | Final CIP approval granted (COSOB notice) | Conseiller en investissement participatif (CIP, COSOB) |     |         |

#### Kenya (1 records)

No licensed platform verified. Pezesha: CMA sandbox exit 2020 with "no objection"; no licence under the 2022 Regulations found.

Sources: https://capitalfm.africa/pezesha-exits-from-the-cma-regulatory-sandbox/
Source date(s): 2026-10-30

**Unverified (company, press or third-party claim only) (1):**

| Brand   | Legal entity           | Status (as of source)                                                                                                   | Type                                           | ID  | Website |
| ------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | --- | ------- |
| Pezesha | Pezesha Africa Limited | CMA "no objection" Oct 2020 after regulatory sandbox; CMA sandbox page lists it as successful, "now in the mass market" | Debt-based crowdfunding (CMA Regulations 2022) |     |         |

#### Tanzania (1 records)

Sources: https://www.thecitizen.co.tz/tanzania/business/cashme-tanzania-expands-access-to-investment-and-sme-financing-through-fintech-innovation-534
Source date(s): 2026-10-30

**Unverified (company, press or third-party claim only) (1):**

| Brand           | Legal entity | Status (as of source)                                             | Type                                                         | ID  | Website |
| --------------- | ------------ | ----------------------------------------------------------------- | ------------------------------------------------------------ | --- | ------- |
| CashMe Tanzania |              | Press says it operates under CMSA oversight; licence not verified | Investment and SME financing platform (CMSA guidelines 2023) |     |         |

#### Djibouti (1 records)

Sources: https://www.lanation.dj/le-premier-ministre-preside-la-ceremonie-de-lancement-officiel-de-la-premiere-soc ; https://www.inclufin.dj/
Source date(s): 2026-10-30

**Unverified (company, press or third-party claim only) (1):**

| Brand    | Legal entity                          | Status (as of source)                                                             | Type                                                | ID  | Website |
| -------- | ------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------- | --- | ------- |
| Inclufin | Inclufin (Sovereign Fund of Djibouti) | Described in press as the first crowdfunding company; no regulator approval found | Crowdfunding company (Startup Act 179/AN/25/9eme L) |     |         |

#### South Africa (1 records)

Sources: https://thecrowdspace.com/platform/uprise-africa/
Source date(s): 2026-10-30

**Unverified (company, press or third-party claim only) (1):**

| Brand         | Legal entity | Status (as of source)                                                   | Type                                                    | ID  | Website |
| ------------- | ------------ | ----------------------------------------------------------------------- | ------------------------------------------------------- | --- | ------- |
| Uprise.Africa |              | Named by secondary directory only; FSCA sandbox or FSP status not found | Equity crowdfunding (no dedicated regime; FSCA sandbox) |     |         |

#### Mauritius (1 records)

Sources: https://fundkiss.mu/about
Source date(s): 2026-10-30

**Unverified (company, press or third-party claim only) (1):**

| Brand    | Legal entity | Status (as of source)                                                                                    | Type                                  | ID  | Website |
| -------- | ------------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------- | --- | ------- |
| Fundkiss |              | Company says it holds an FSC P2P licence (blog 3 May 2021); FSC register returned empty content to fetch | P2P lending (FSC P2P Rules 2017/2020) |     |         |

## Global limits

- Official registers read in full: Brazil (CVM), Mexico (CNBV), Turkey (SPK), Russia (Bank of Russia), Chile (CMF, zero authorised), Isle of Man (FSA, zero under crowdfunding class), Ghana (SEC), UAE-DIFC (DFSA filter), Australia (ASIC CSF permission), India (RBI P2P classification), Indonesia (KSEI + OJK), Malaysia (SC), New Zealand (FMA), South Korea P2P (KFTC), Thailand (SEC list), Uzbekistan (NAPP), Taiwan (TPEx), Kazakhstan AIFC (AFSA). These show registration, not activity.
- Partial or bounded: UK (no crowdfunding category at the FCA; firm pages read for 15 named operators; P2P permission list is not a platform list), Canada (CSA search CAPTCHA-blocked; provincial disagreement), Saudi SAMA (14 licensed per Nov 2025 statement; full list unread - server error), Nigeria (33 of 70 register pages), Oman (1 of 7 register entries read), Morocco BAM (1 of 3 names), Singapore/Hong Kong (named-entity profiles, not exhaustive CMS/SFC sweeps), Japan (list dated May 2024), South Korea securities-CF (4 identified, no complete register), Pakistan, Philippines (current status unresolved).
- Blocked sources: Argentina CNV (reCAPTCHA, not bypassed), Canada CSA NRS (CAPTCHA, not bypassed), SAMA licensed-entities pages (server error), SEC Nigeria (site timeouts), CBB Bahrain (no category), FSC Mauritius (empty to fetch), CMA Kenya (no category), ISA Israel (register file not located), CREPMF WAEMU (name-search only), Bank Al-Maghrib list, Iran Fara Bourse (Persian, unread). No absence is claimed from any of these.
- Unresolved, not zero: Norway, Iceland, Liechtenstein, Andorra, Kosovo, Gibraltar, Georgia, Ukraine, Serbia, Albania, Belarus, Bosnia, Monaco, Montenegro, North Macedonia, San Marino, Paraguay, Dominican Republic, Ecuador, Costa Rica, Panama, Eastern Caribbean, Barbados, Bolivia, Guatemala, Honduras/Nicaragua/El Salvador, Jamaica, Trinidad and Tobago, Belize/Guyana/Suriname/Haiti, Venezuela, Cuba, Qatar, Lebanon, Kuwait, Bahrain, Kenya, Tanzania, Mauritius, Namibia, CEMAC, WAEMU, Fiji, Sri Lanka, Vietnam.
- Platform activity (live, dormant, campaign failures) was not checked anywhere. Dates and statuses are as read on 30 October 2026 unless a row says otherwise; none were confirmed with a regulator.

### Corrections to the prior global regulation map found during this research

1. **Morocco**: the row says AMMC lists approved platforms. The AMMC page says no crowdfunding company in the "investment" category is approved (page read 30 Oct 2026; it showed AMMC news dated up to 26 Oct 2026, so it is current). Loan and donation platforms are licensed by Bank Al-Maghrib.
2. **Algeria**: COSOB has granted YINVESTI a final CIP approval (see section 2).
3. **Jordan**: the review says draft only. The Central Bank of Jordan issued Instruction 2/2026 (15 Jan 2026) regulating loan-based crowdfunding; the Securities Law amendment for equity is still a draft (Cabinet 10 May 2026).
4. **Angola**: Parliament approved the crowdfunding legal regime law on 25 June 2026 (CMC notice). Promulgation and entry into force not confirmed.
5. **Mozambique**: Council of Ministers approved the bill on 2 June 2026 (press). Not yet law as far as found.
6. **Tunisia**: CnBees (ACM-approved) is donation-based only; no licensed investment or loan platform was verified (not proof that none exists).
7. **Qatar**: no licensed platform name found. QCrowd (QFCA licence) withdrew its licence on 30 Aug 2023 and is closed (third-party profile).
8. **Oman**: FSA says 7 licensed platforms in Sept 2025 (it named seven names; its text calls them "seven"). In March 2025 it cancelled the licences of Sharek Investment LLC and New Sphere LLC for never starting activity.

### Asia-Pacific status updates of note

AngelHub is SUSPENDED. Validus has LODGED NOTICE OF CESSATION. AIFC includes two pending commencement entries. Japan five-name source remains dated May2024 although still linked by current JSDA hub.

Korea: CrowdNet official deregistered/dissolved intermediary page lists Opentrade (4 Aug 2025), Korea Asset Investment Securities (31 Jan 2024), WADIZ (18 Jan 2024), among others. Do not promote old government guide entries to active. https://www.crowdnet.or.kr/eng/funding_info_archive/revoked_brokers.jsp
