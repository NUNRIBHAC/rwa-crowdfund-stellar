# CONDA full supplied campaign list by project type (2026-10-30)

This file classifies the full campaign list the user supplied on WhatsApp on 2026-10-30 (19:06 WET). The earlier section 11A of `conda-capital-platform-blueprint-2026-10-30.md` covers only the 12 campaigns in the ZIP archive and stays unchanged. Companion CSV with one row per input entry and per-row evidence: `conda-full-list-by-project-type.csv`.

The 17 industry categories below, plus "Unclear from available evidence" as a status (not an industry), use the wording the user supplied on WhatsApp on 2026-10-30 (19:36 and 19:40 WET). They are an analyst grouping made for this document. They are not CONDA's own taxonomy; CONDA's own industry chip is kept in its own column.

## 1. Input entries, URLs and assets

| Item                                                                                           |                                           Count |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------: |
| Numbered rows supplied (IDs 325-594, no gaps, no duplicate IDs)                                |                                             270 |
| Numbered rows with a URL                                                                       |                                             269 |
| Numbered rows without a URL (row 378)                                                          |                                               1 |
| Unnumbered URL entries (orphan)                                                                |                                               1 |
| Distinct URLs supplied (269 numbered + 1 orphan)                                               |                                             270 |
| German pages (`/kampagnen/`) / English pages (`/en/campaigns/`) among the 270 URLs             |                                        250 / 20 |
| Unique offerings across the 269 numbered URLs, counted by the asset ID in each page's metadata |                                             248 |
| Orphan URL asset                                                                               | same asset ID as row 474 (adds no new offering) |

Row 378 arrived as "| 378 | Not specified |" with no URL. One URL, `https://conda-capital.com/en/campaigns/ubergossene-alm-resort-subordinate-bond`, appeared unnumbered after row 594. They are kept as two separate entries. The orphan page shares its asset ID with row 474 (German Uebergossene Alm page), so it is the English page of the same offering. That shows a translation of 474. It does not show that it belongs to row 378: it is only a candidate. Row 378 is left unclassified.

All 270 URLs were fetched live on 2026-10-30. Row 378 has no page. The user label on every numbered row is "Not specified". The 248 count rests on the asset ID the page exposes; it was not cross-checked against any other source.

## 2. Instrument categories

The instrument hint comes from titles and contract document names on each fetched page (all 269 numbered rows with a URL; row 378 has no page and the orphan URL duplicates row 474's offering). It is not a verified legal form (see section 4). The hints are filed into the unified instrument categories the user supplied on WhatsApp on 2026-10-30:

**Participation**

1. Participation right / certificate
   - Substance profit participation right (Substanzgenussrecht) - subtype of 1
2. Share - the instrument; a capital increase is the action that creates new shares, not a separate instrument
3. Indirect participation - an ownership structure, not a distinct instrument
4. Limited partnership interest

**Debt** - two generic parents, three states each:

5. Loan - state: senior / subordinated / unspecified
6. Bond - state: senior (non-subordinated) / subordinated / unspecified

**Structure overlays** (combine with 5 or 6, never standalone):

- Zero-coupon (Zero Bond): a coupon structure, not a seniority
- Convertible: a conversion feature on a bond

**Rank and label qualifiers** (site wording, preserved as-is):

- "junior": a lower-rank label; indicates subordinated ranking but does not by itself establish contractual qualified subordination
- "qualified / qualifiziert": the site's own wording on loans and bonds; on bonds it is not read as qualified subordination unless the term says subordinated
- "Mini Bond": small-denomination bond label

**Role overlay**:

- Bridge financing: a financing role (short-term interim funding), not an instrument class and not a seniority. No CONDA campaign hint uses this role.

Mapping of the 7 instrument hints (269 numbered rows with a URL):

| Instrument hint (from title or contract document name)            | Rows    | Category                            | State / structure                                                  |
| ----------------------------------------------------------------- | ------- | ----------------------------------- | ------------------------------------------------------------------ |
| Subordinated loan or bond ("nachrangig" in title or contract doc) | 125     | 5 Loan or 6 Bond (unresolved)       | Subordinated; the fetched fields do not distinguish loan from bond |
| Loan (Darlehen)                                                   | 64      | 5 Loan                              | Seniority unspecified                                              |
| Not stated in fetched fields                                      | 32      | Unclassified                        | No instrument hint on the page                                     |
| Profit participation certificate (Genussschein)                   | 21      | 1 Participation right / certificate | Not established as the Substanzgenussrecht subtype                 |
| Bond                                                              | 19      | 6 Bond                              | Seniority unspecified                                              |
| Share / equity                                                    | 7       | 2 Share                             | -                                                                  |
| Convertible bond                                                  | 1       | 6 Bond                              | Seniority unspecified; convertible structure                       |
| **Total**                                                         | **269** |                                     |                                                                    |

Campaigns per instrument category (row IDs; full details in the section 7 tables):

- 1. Participation right / certificate - profit participation certificate (Genussschein), 21 rows: 326, 330, 338, 353, 358, 368, 381, 403, 407, 482, 486, 487, 491, 493, 498, 504, 508, 511, 518, 529, 590
  - 1a. Substanzgenussrecht subtype - 0 rows (no hint says Substanzgenussrecht)
- 2. Share - share/equity hint, 7 rows: 357, 389, 475, 479, 495, 507, 543
- 3. Indirect participation - 0 rows
- 4. Limited partnership interest - 0 rows
- 5. Loan
  - senior - 0 rows (no hint states a senior loan)
  - subordinated - unresolved with 6 Bond, see the shared bucket below
  - seniority unspecified - loan (Darlehen), 64 rows: 327, 334, 337, 339, 343, 345, 354, 359, 367, 369, 373, 374, 377, 379, 383, 386, 388, 392, 394, 398, 404, 418, 422, 423, 425, 432, 444, 446, 449, 464, 477, 483, 488, 506, 509, 513, 515, 519, 520, 522, 528, 532, 537, 538, 544, 546, 550, 553, 554, 556, 560, 562, 563, 564, 566, 572, 574, 575, 577, 580, 581, 583, 585, 587
- 6. Bond
  - senior (non-subordinated) - 0 rows (no hint states a senior bond)
  - subordinated - unresolved with 5 Loan, see the shared bucket below
  - seniority unspecified - bond, 19 rows: 325, 346, 349, 350, 413, 447, 469, 470, 480, 485, 489, 490, 499, 500, 510, 533, 592, 593, 594
  - seniority unspecified, convertible structure - convertible bond, 1 row: 523
- Subordinated loan or bond (subordination stated, loan vs bond unresolved) - "nachrangig" in title or contract doc, 125 rows: 328, 331, 332, 333, 335, 336, 340, 341, 342, 347, 348, 351, 352, 355, 361, 363, 364, 365, 370, 371, 372, 375, 376, 380, 382, 385, 387, 393, 395, 396, 397, 399, 401, 402, 405, 406, 410, 411, 412, 414, 415, 416, 417, 420, 421, 424, 427, 428, 429, 430, 431, 433, 434, 436, 437, 438, 439, 440, 441, 442, 445, 448, 450, 451, 452, 453, 456, 457, 458, 459, 460, 461, 462, 463, 465, 466, 467, 471, 472, 474, 478, 484, 492, 494, 496, 501, 502, 503, 505, 512, 514, 516, 517, 521, 526, 527, 530, 534, 535, 539, 540, 541, 542, 545, 547, 548, 551, 552, 557, 558, 559, 561, 565, 568, 569, 570, 571, 573, 578, 579, 582, 584, 586, 589, 591
- No instrument stated in fetched fields (unclassified) - 32 rows: 329, 344, 356, 360, 362, 366, 384, 390, 391, 400, 408, 409, 419, 426, 435, 443, 454, 455, 468, 473, 476, 481, 497, 524, 525, 531, 536, 549, 555, 567, 576, 588

- The hint is a label from titles and contract document names, not a verified legal form, and it does not establish contractual qualified subordination: "nachrangig" shows subordinated ranking; whether that subordination is "qualified" was not checked per campaign.
- Unspecified is not senior: the 64 loans, 19 bonds and 1 convertible bond with no stated seniority stay "unspecified", and the 32 rows with no hint stay unclassified. No CONDA campaign is confirmed as a senior loan or a senior bond on the fetched fields.
- No CONDA campaign maps to categories 3 (indirect participation) or 4 (limited partnership interest), to the Substanzgenussrecht subtype, to the zero-coupon structure, or to the "junior", "qualified" or "Mini Bond" labels, on the fetched fields.
- Row 378 (no URL) has no instrument hint and is not classified. The orphan URL (English Übergossene Alm page) carries the hint "subordinated loan or bond"; it duplicates row 474's offering and adds no row.

## 3. Translations and tranches

German + English pairs (same asset ID), 19 in all: 467/384, 364/469, 413/349, 470/592, 471/514, 474/(orphan), 475/479, 484/594, 486/407, 487/353, 489/593, 490/415, 491/391, 498/493, 500/499, 529/403, 533/325, 535/478, 543/389. Also: Green Energy Bond has three pages (350, 485 German; 346 English); eventDATA-services has two German pages (332, 452).

Distinct tranches, kept separate (different asset IDs): Giesinger Braeu 1-6 (565, 335, 440, 340, 395, 396), Olchinger Braumanufaktur 1-3 (526, 352, 367), Rapid InvesTOR (333, 434, 436, 473, 481), nine FMTG campaigns (383, 435, 477, 483, 537, 553, 574, 581, 585), Familux 1.0 (535/478) vs 2.0 (512), Super Power Generation bond 2.0 (364/469) vs Green Energy Bond (350/485/346), Vello (487/353 vs 377), Kaahee (328 vs 393), Innolytics (543/389 vs 507), Wohnwagon (338 vs 586), markta (503 vs 509), Trumer (510 vs 555), Greenstorm (380 vs 439), Moerwald bond (413/349) vs Moerwald hotel (575).

## 4. Method and limits

- Each page was read live; the CSV `evidence` column quotes the first 200 characters of the page summary or description that the classification rests on.
- `site_industry_chip` is CONDA's own label. It exists on 63 of 270 pages only. `activity_category` is the analyst grouping of what the issuer's business does (the industry), so the two can differ; differences are listed in `chip_conflict`.
- `basis` shows how solid each row is. Pages 343 (AVORIS Darlehen 2020), 447 (Kollitsch Immobilien Anleihe 2020) and 527 (SCUBAJET) have no description. 343 and 447 are tentatively filed as real estate on title and issuer name only. 527 is unclear.
- `instrument_hint` comes from titles and contract document names. It is not a verified legal form.
- Each row has one category. Several are judgement calls (food platforms, bike accessories, HMW Mobility, FMTG as hotel operator). The reasoning is in `evidence`.

## 5. Project/financing type and property type

Three separate fields, as the user asked. Industry (sections 6 and 7) says what the issuer does. Project/financing type says what kind of financing the entry is. Property type applies only to Real estate.

> **Provisional.** The financing type below is based on the issuer (an operating business), not on a verified use of proceeds. "Corporate" does not mean the financing purpose was confirmed as corporate. Only the 4 property rows rest on page text or title.

| Project/financing type (issuer-based, provisional)                         | Rows (269 numbered with URL)                                     |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------: |
| Corporate (issuer-based, provisional; use of proceeds not verified)        |                                                              264 |
| Property project                                                           |                                                                2 |
| Property project (tentative, unverified)                                   |                                                                2 |
| Project financing (asset-specific, energy infrastructure; not real estate) | none confirmed (not assessed; corporate rows were not sub-typed) |
| Unclear from available evidence                                            |                                                                1 |
| **Total**                                                                  |                                                          **269** |

Limits of the financing type: "Corporate" is assigned at issuer level. The page describes an operating business and names no specific property asset. The use of proceeds was not checked against each instrument's terms, so some corporate rows may in fact fund a specific project (a plant, a hotel build-out). No further sub-type (for example asset-specific non-property project) is asserted because the evidence was not read for that. Unknown stays unknown: row 527 (page empty) is "Unclear from available evidence", not corporate. Row 378 has no URL and is not classified. The orphan URL is a duplicate of row 474's offering and is not counted.

### Real estate

Property type: 394 Kremplhof is Mixed-use (residential + commercial; "Wohnen und Arbeiten", Leoben). 476 UKO-Tower is Commercial/office (office and knowledge park, described as an "Immobilienprojekt"). Both are confirmed from page text. 343 AVORIS Darlehen 2020 and 447 Kollitsch Immobilien Anleihe 2020 are tentative: their pages are empty, the filing rests on title and issuer name only, and the property type is not determined. No campaign is confirmed as a purely residential development.

| Property type (real estate rows only)                     | Rows                        |
| --------------------------------------------------------- | --------------------------- |
| Residential (new-build development)                       | 0 confirmed                 |
| Residential (subtype detail unconfirmed)                  | 0 confirmed                 |
| Residential (renovation/revitalization)                   | 0 confirmed                 |
| Residential (renovation + new-build)                      | 0 confirmed                 |
| Residential (holiday apartments, incl. hotel conversions) | 0 confirmed                 |
| Commercial/office                                         | 1 confirmed (476 UKO-Tower) |
| Mixed-use (residential + commercial elements)             | 1 confirmed (394 Kremplhof) |
| Other property types                                      | 0 confirmed                 |
| Not determined (pages empty; title and issuer name only)  | 2 tentative (343, 447)      |

Prefab or mobile housing makers (448 Heise Haus, 518 McCube, 338 and 586 Wohnwagon) and building product makers (489/593 KAPO windows, 534 LCT light concrete) are filed under Building products and prefab housing, financing type Corporate, not Real estate. Hotel operators and holdings (FMTG, Moerwald, Familux, COOEE alpin, Uebergossene Alm, MyGym) are filed by what they run. Some of those loans may fund buildings; the pages describe corporate funding, so they are not counted as real estate.

## 6. Counts by industry category

The industry is what the issuer's business does. It says nothing about use of proceeds (see section 5).

| Industry category                                                                 | Rows                         | Unique offerings |
| --------------------------------------------------------------------------------- | ---------------------------- | ---------------- |
| Food and beverage products                                                        | 31                           | 30               |
| Information Technology, software and digital platforms                            | 29                           | 26               |
| Energy and utilities                                                              | 29                           | 23               |
| Hotels, hospitality and tourism                                                   | 28                           | 24               |
| E-bikes and light mobility                                                        | 25                           | 24               |
| Brewery, wine and spirits                                                         | 20                           | 19               |
| Consumer products, fashion, apparel and retail                                    | 17                           | 17               |
| Sports, leisure and entertainment                                                 | 15                           | 14               |
| Health (Healthcare), wellness and medtech                                         | 15                           | 15               |
| Industrial technology and manufacturing                                           | 14                           | 14               |
| Restaurants and gastronomy                                                        | 12                           | 11               |
| Agriculture, environment and recycling                                            | 10                           | 10               |
| Building products and prefab housing                                              | 7                            | 6                |
| Financial services and investment vehicles                                        | 5                            | 5                |
| Education and aviation training                                                   | 4                            | 2                |
| Transport and logistics                                                           | 3                            | 3                |
| Real estate (Residential, Commercial/office, Mixed-use and other property types.) | 4 (2 confirmed, 2 tentative) | 4                |
| Unclear from available evidence                                                   | 1                            | 1                |
| **Total**                                                                         | **269**                      | **248**          |

Row 378 (no URL) and the orphan URL are outside these counts; the orphan duplicates row 474.

## 7. Campaigns by category

Every row below has financing type "Corporate (issuer-based, provisional; use of proceeds not verified)" except the real estate rows and the unclear row, which are marked in their own tables.

### Food and beverage products (31 rows)

| IDs       | Campaign                                        | Issuer                               | Chip             | Basis                          | Notes |
| --------- | ----------------------------------------------- | ------------------------------------ | ---------------- | ------------------------------ | ----- |
| 328       | Kaahée 2                                        | Kaahee Research and Development GmbH | -                | page text                      |       |
| 334       | iss mich!                                       | iss mich!                            | -                | page text                      |       |
| 348       | Upsynth                                         | Alpdrinks GmbH (ehem. Upsynth GmbH)  | -                | page text                      |       |
| 351       | WILDER HEINRICH                                 | WILDER HEINRICH GmbH                 | -                | page text                      |       |
| 357       | frizle fresh foods AG – Aktieneigenemission     | frizle fresh foods AG                | -                | page text                      |       |
| 376       | Kuchentratsch                                   | Kuchentratsch GmbH                   | -                | page text                      |       |
| 381       | Die Abonauten – Genuss zum Abonnieren           | Abonauten GmbH                       | Trade and retail | site industry chip + page text |       |
| 393       | Kaahée – the Anti-Hangover Drink                | Kaahee Research and Development GmbH | -                | page text                      |       |
| 400       | LOBSTERS                                        | LOBSTERS GmbH                        | -                | page text                      |       |
| 402       | I LIKE TOFU                                     | Avokado d.o.o                        | -                | page text                      |       |
| 407 / 486 | HAKUMA - Profit Participation Certificate       | Hakuma Handels GmbH                  | Trade and retail | site industry chip + page text |       |
| 410       | VIVALDI - Mehr als nur herkömmliches Tierfutter | Vivaldi Tiernahrungsvertrieb GmbH    | -                | page text                      |       |
| 414       | WATT'N SENF                                     | WATT´N SENF GmbH                     | -                | page text                      |       |
| 416       | all i need 2                                    | all i need beverage GmbH             | -                | page text                      |       |
| 420       | ZIBIBBO                                         | Zibibbo GmbH                         | -                | page text                      |       |
| 428       | Sweet speed                                     | Softible d.o.o.                      | -                | page text                      |       |
| 451       | Bentianna                                       | Taste Evolution s.r.o.               | -                | page text                      |       |
| 456       | SUPERDRINK                                      | SUPERDRINK GmbH                      | -                | page text                      |       |
| 503       | markta 2.0                                      | markta GmbH                          | -                | page text                      |       |
| 509       | markta                                          | markta GmbH                          | -                | page text                      |       |
| 513       | HAPPYKEKS                                       | Happykeks GmbH                       | -                | page text                      |       |
| 516       | Mösls Bio Smoothie                              | Mösl GmbH                            | -                | page text                      |       |
| 517       | HELGA                                           | HELGA - evasis edibles GmbH          | -                | page text                      |       |
| 522       | KAFFEIN                                         | kaffein black matter operation GmbH  | -                | page text                      |       |
| 540       | RisottoBox                                      | RisottoBox Betriebsges.m.b.H.        | -                | page text                      |       |
| 548       | SOLARBAKERY                                     | SOLARBAKERY GmbH                     | -                | page text                      |       |
| 554       | Paddies by Selectum - Eine neue Snack-Kategorie | Selectum GmbH                        | -                | page text                      |       |
| 560       | FRYDO                                           | FRYDO GmbH                           | -                | page text                      |       |
| 562       | QimiQ                                           | QimiQ Handels GmbH                   | Trade and retail | site industry chip + page text |       |
| 567       | CUTZ                                            | Jahubi Genuss GmbH                   | -                | page text                      |       |

### Information Technology, software and digital platforms (29 rows)

| IDs       | Campaign                                                            | Issuer                                         | Chip                   | Basis                          | Notes |
| --------- | ------------------------------------------------------------------- | ---------------------------------------------- | ---------------------- | ------------------------------ | ----- |
| 332 / 452 | eventDATA-services                                                  | eventDATA-services Austria GmbH                | -                      | page text                      |       |
| 341       | Content Exchange                                                    | I.R.V. d.o.o.                                  | -                      | page text                      |       |
| 359       | corplife                                                            | corplife GmbH                                  | Information Technology | site industry chip + page text |       |
| 361       | Welmoa                                                              | Welmoa GmbH                                    | -                      | page text                      |       |
| 363       | dasEssen.at                                                         | dasEssen GmbH                                  | -                      | page text                      |       |
| 366       | GetTheLight                                                         | GetTheLight GmbH                               | -                      | page text                      |       |
| 382       | bitiago                                                             | Crypto Consulting GmbH                         | -                      | page text                      |       |
| 388       | NYZZU - Wir ändern</br>das Social-Media-Game</br>für Kids & Eltern! | Nyzzu Media GmbH                               | -                      | page text                      |       |
| 389 / 543 | Innolytics® AG - Share                                              | Innolytics AG                                  | Information Technology | site industry chip + page text |       |
| 406       | Betcheck                                                            | Betcheck GmbH                                  | -                      | page text                      |       |
| 411       | HADI App                                                            | HADI App GmbH                                  | -                      | page text                      |       |
| 419       | HELFERLINE - Die Technik-Profis                                     | HELFERLINE GmbH                                | -                      | page text                      |       |
| 426       | juni.com                                                            | juni.com GmbH & Co. KG                         | -                      | page text                      |       |
| 441       | Verklickern                                                         | Verklickern GmbH                               | -                      | page text                      |       |
| 465       | Lasker Cross-Media                                                  | Lasker Cross-Media GmbH                        | -                      | page text                      |       |
| 470 / 592 | devolo solutions GmbH - Anleihe                                     | devolo solutions GmbH                          | Information Technology | site industry chip + page text |       |
| 497       | bundle                                                              | NAS Smart Platforms GmbH                       | -                      | page text                      |       |
| 501       | hrConnectum                                                         | hrConnectum GmbH                               | -                      | page text                      |       |
| 506       | m.o.r.e. technology                                                 | m.o.r.e. technology GmbH                       | -                      | page text                      |       |
| 507       | Innolytics AG - Aktieneigenemission                                 | Innolytics AG                                  | -                      | page text                      |       |
| 528       | MARSCHPAT                                                           | Marschpat GmbH                                 | -                      | page text                      |       |
| 531       | Orbix                                                               | ORBIX GmbH                                     | -                      | page text                      |       |
| 558       | techbold                                                            | techbold technology group AG                   | -                      | page text                      |       |
| 561       | Gettpal                                                             | Gettpal s.r.o.                                 | -                      | page text                      |       |
| 573       | ETRON onRetail                                                      | ETRON Softwareentwicklungs- und Vertriebs GmbH | -                      | page text                      |       |
| 577       | #DubistPflege                                                       | Du bist. Placement. GmbH                       | -                      | page text                      |       |

### Energy and utilities (29 rows)

| IDs             | Campaign                                               | Issuer                                                       | Chip                 | Basis                          | Notes |
| --------------- | ------------------------------------------------------ | ------------------------------------------------------------ | -------------------- | ------------------------------ | ----- |
| 342             | PVAU - nachrangige Anleihe - Ankündigung               | PVAU GmbH                                                    | Energy and utilities | site industry chip + page text |       |
| 346 / 350 / 485 | Green Energy Bond                                      | Super Power Generation GmbH                                  | Energy and utilities | site industry chip + page text |       |
| 356             | Strom aus Wind und Sonne                               | WEB Windenergie AG                                           | -                    | page text                      |       |
| 364 / 469       | Super Power Generation nachrangige Anleihe 2.0         | Super Power Generation GmbH                                  | Energy and utilities | site industry chip + page text |       |
| 373             | Erneuerbare Energie für Ihre Freizeit in Zell am See   | Salzburg AG für Energie, Verkehr und Telekommunikation       | -                    | page text                      |       |
| 384 / 467       | Eternal Power Wasserstoff Invest                       | Eternal Power GmbH                                           | Energy and utilities | site industry chip + page text |       |
| 390             | Crystalsol - die nächste Generation von Photovoltaik   | crystalsol GmbH                                              | -                    | page text                      |       |
| 391 / 491       | EWIA 3.0 - indirect participation                      | EWIA Green Investments GmbH                                  | Energy and utilities | site industry chip + page text |       |
| 421             | neovoltaic                                             | neovoltaic AG                                                | -                    | page text                      |       |
| 425             | Congo Basin Pellets                                    | Congo Basin Pellets GmbH                                     | -                    | page text                      |       |
| 445             | AAA Green Energy                                       | AAA Green Energy GmbH                                        | Energy and utilities | site industry chip + page text |       |
| 453             | Pelletswerk Sachsenburg                                | Solarenergie Ulm GmbH & Co. KG                               | -                    | page text                      |       |
| 472             | Dorfelektrifizierung Kamerun                           | EWIA Impact I UG                                             | Energy and utilities | site industry chip + page text |       |
| 475 / 479       | oekostrom AG energy group Kapitalerhöhung 2026 - Aktie | oekostrom AG energy group                                    | Energy and utilities | site industry chip + page text |       |
| 494             | EnerKite                                               | EnerKíte GmbH                                                | Energy and utilities | site industry chip + page text |       |
| 505             | 100% steirisches Ökostrom Projekt                      | CC Lärchenholz PV GmbH                                       | -                    | page text                      |       |
| 547             | LCG Energy Technology                                  | LCG Energy Technology GmbH                                   | -                    | page text                      |       |
| 552             | GW Energy                                              | Sun Contracting Austria GmbH (ehem. GW Energie Holding GmbH) | -                    | page text                      |       |
| 563             | eFriends                                               | eFriends Energy GmbH                                         | -                    | page text                      |       |
| 570             | Maister                                                | Maister GmbH                                                 | -                    | page text                      |       |
| 578             | DeBE Deutsche BürgerEnergie                            | Energieversorger Deutsche BürgerEnergie GmbH                 | -                    | page text                      |       |
| 582             | Infrastructure Batch 1                                 | EWIA Impact I UG                                             | Energy and utilities | site industry chip + page text |       |
| 587             | Mehr Sonne für Salzburg                                | Salzburg AG für Energie, Verkehr und Telekommunikation       | -                    | page text                      |       |

### Hotels, hospitality and tourism (28 rows)

| IDs                | Campaign                                                           | Issuer                                          | Chip                    | Basis                          | Notes |
| ------------------ | ------------------------------------------------------------------ | ----------------------------------------------- | ----------------------- | ------------------------------ | ----- |
| 327                | SeVi Boutique Hotel Zanzibar                                       | SEVI Boutique Hotel Zanzibar GmbH               | Hospitality and tourism | site industry chip + page text |       |
| 336                | COOEE alpin Hotels                                                 | bkk hotel errichtungs gmbh                      | -                       | page text                      |       |
| 349 / 413          | Mörwald Holding GmbH - Bond                                        | Mörwald Holding GmbH                            | Hospitality and tourism | site industry chip + page text |       |
| 360                | Best4Travel                                                        | Jedek Reisen GmbH                               | -                       | page text                      |       |
| 383                | Ihr Geld schläft nicht!                                            | FMTG – Falkensteiner Michaeler Tourism Group AG | -                       | page text                      |       |
| 435                | Ihre Anlage. In bester Lage.                                       | FMTG – Falkensteiner Michaeler Tourism Group AG | -                       | page text                      |       |
| 438                | Hotel Christoph                                                    | Fun Hotel BetriebsgmbH & Co KG I                | -                       | page text                      |       |
| 442                | sleeperoo                                                          | sleeperoo GmbH                                  | -                       | page text                      |       |
| 471 / 514          | COOEE alpin - nachrangige Anleihe der You Will Like It Hotels GmbH | You Will Like It Hotels GmbH                    | Hospitality and tourism | site industry chip + page text |       |
| 474 / (orphan URL) | Übergossene Alm Resort - nachrangige Anleihe                       | Alois Burgschwaiger GmbH                        | Hospitality and tourism | site industry chip + page text |       |
| 477                | Anlegen mit Ausblick.                                              | FMTG – Falkensteiner Michaeler Tourism Group AG | -                       | page text                      |       |
| 478 / 535          | Familux Invest 1.0 - subordinate bond                              | Mayer family hotels GmbH                        | Hospitality and tourism | site industry chip + page text |       |
| 480                | Best Western Hotelbetriebsgesellschaft GmbH - Anleihe              | Hotelbetriebsgesellschaft Kiefersfelden GmbH    | Hospitality and tourism | site industry chip + page text |       |
| 482                | nook society - Genussschein                                        | Nook Society GmbH & Co. KG                      | Hospitality and tourism | site industry chip + page text |       |
| 483                | Ein Investment. Viel Urlaub.                                       | FMTG – Falkensteiner Michaeler Tourism Group AG | -                       | page text                      |       |
| 495                | Roatel - Aktie                                                     | Roatel Holding AG                               | Hospitality and tourism | site industry chip + page text |       |
| 499 / 500          | we-are-travel INVEST - bond                                        | we-are.travel Invest GmbH                       | Hospitality and tourism | site industry chip + page text |       |
| 512                | Familux Invest 2.0 - nachrangige Anleihe                           | Mayer family hotels GmbH                        | Hospitality and tourism | site industry chip + page text |       |
| 537                | Investieren mit Weitblick 3 Jahre                                  | FMTG – Falkensteiner Michaeler Tourism Group AG | -                       | page text                      |       |
| 553                | Investieren mit Weitblick 5 Jahre                                  | FMTG – Falkensteiner Michaeler Tourism Group AG | -                       | page text                      |       |
| 574                | Anlegen. Ankommen.                                                 | FMTG - Falkensteiner Michaeler Tourism Group AG | -                       | page text                      |       |
| 575                | MÖRWALD HOTEL Gutshof & Weinhandlung                               | Mörwald Holding GmbH                            | Hospitality and tourism | site industry chip + page text |       |
| 581                | FMTG Invest: Ihre Anlage. Erreichen Sie neue Ziele                 | FMTG – Falkensteiner Michaeler Tourism Group AG | -                       | page text                      |       |
| 585                | Ihre Anlage. Investieren in Qualität & Kompetenz                   | FMTG - Falkensteiner Michaeler Tourism AG       | Hospitality and tourism | site industry chip + page text |       |

### E-bikes and light mobility (25 rows)

| IDs       | Campaign                                                               | Issuer                                       | Chip                    | Basis                          | Notes |
| --------- | ---------------------------------------------------------------------- | -------------------------------------------- | ----------------------- | ------------------------------ | ----- |
| 337       | SUSHI BIKES                                                            | SUSHI Mobility GmbH                          | Trade and retail        | site industry chip + page text |       |
| 353 / 487 | VELLO BIKE - profit participation certificate                          | VELLO GmbH                                   | -                       | page text                      |       |
| 354       | BLOBBER                                                                | Blobber GmbH                                 | -                       | page text                      |       |
| 365       | ORYX                                                                   | Baier Motors GmbH                            | -                       | page text                      |       |
| 369       | Die Baierkraft – Das perfekte Motorrad für Afrika                      | Baier Motors GmbH                            | -                       | page text                      |       |
| 377       | VELLO BIKE - DAS FALTRAD                                               | VELLO GmbH                                   | -                       | page text                      |       |
| 380       | GREENSTORM                                                             | Greenstorm Mobility GmbH                     | -                       | page text                      |       |
| 392       | Paul und Ernst - smarte E-Mobility für die Food und Beverage Industrie | Paul & Ernst GmbH                            | -                       | page text                      |       |
| 412       | FEDDZ – die individuelle E-Mobilität mit E-Bikes und E-Moped           | EMO-Bike GmbH & Co.KG                        | -                       | page text                      |       |
| 423       | Das Wunderbike für die Mobilitätswende                                 | Black Tea Motorbikes GmbH                    | Transport and logistics | site industry chip + page text |       |
| 427       | HAWK Bike                                                              | HAWK Bike Sales GmbH                         | -                       | page text                      |       |
| 437       | Starbike                                                               | Starbike GmbH                                | -                       | page text                      |       |
| 439       | GREENSTORM 2                                                           | Greenstorm Mobility GmbH                     | -                       | page text                      |       |
| 446       | NOX Cycles                                                             | NOX Cycles Austria GmbH                      | -                       | page text                      |       |
| 449       | 2Rad-Börse                                                             | BCV Reparaturen GmbH                         | -                       | page text                      |       |
| 459       | Sycube.                                                                | Sycube                                       | -                       | page text                      |       |
| 488       | Velobis                                                                | Bikesplus Matrix Service GmbH                | -                       | page text                      |       |
| 511       | EGO Sports GmbH                                                        | EGO-Sports GmbH                              | -                       | page text                      |       |
| 515       | WSF Bicycle Technology GmbH                                            | WSF Bicycle Technology GmbH                  | Trade and retail        | site industry chip + page text |       |
| 520       | Super Mobility World                                                   | Velo Locate GmbH (ehem. Super Mobility GmbH) | -                       | page text                      |       |
| 546       | B TURTLE - nachhaltig radreisen                                        | B-Turtle GmbH                                | -                       | page text                      |       |
| 550       | NOX CYCLES: EPIUM                                                      | NOX Cycles Austria GmbH                      | -                       | page text                      |       |
| 580       | PohlBock - Black Forest E.Power                                        | Pohlbock GmbH                                | Transport and logistics | site industry chip + page text |       |
| 583       | BIKE GORILLAZ                                                          | Bike Gorillaz GmbH                           | -                       | page text                      |       |

### Brewery, wine and spirits (20 rows)

| IDs       | Campaign                          | Issuer                                                          | Chip             | Basis                          | Notes |
| --------- | --------------------------------- | --------------------------------------------------------------- | ---------------- | ------------------------------ | ----- |
| 325 / 533 | Sektkellerei J. Oppmann AG - Bond | Sektkellerei J. Oppmann                                         | Trade and retail | site industry chip + page text |       |
| 330       | NIXE Bier                         | NIXE Bier GmbH                                                  | -                | page text                      |       |
| 335       | Giesinger Bräu 2                  | Giesinger Biermanufaktur und Spezialitäten Braugesellschaft mbH | -                | page text                      |       |
| 340       | Giesinger Bräu 4                  | Giesinger Biermanufaktur und Spezialitäten Braugesellschaft mbH | -                | page text                      |       |
| 352       | Olchinger Braumanufaktur 2        | Olchinger Braumanufaktur GmbH                                   | -                | page text                      |       |
| 367       | Olchinger Braumanufaktur 3        | Olchinger Braumanufaktur GmbH                                   | -                | page text                      |       |
| 370       | 9WEINE                            | Neun Weine GmbH                                                 | -                | page text                      |       |
| 375       | Brauerei Maisach                  | Brauerei Maisach GmbH                                           | -                | page text                      |       |
| 395       | Giesinger Bräu 5                  | Giesinger Biermanufaktur und Spezialitäten Braugesellschaft mbH | -                | page text                      |       |
| 396       | Giesinger Bräu 6                  | Giesinger Biermanufaktur und Spezialitäten Braugesellschaft mbH | -                | page text                      |       |
| 398       | ENKIDUS Braustube                 | Enkidus Braustube GmbH                                          | -                | page text                      |       |
| 409       | MUNICH DISTILLERS GmbH            | Dahoam in Minga GmbH (ehem. MUNICH DISTILLERS GmbH)             | -                | page text                      |       |
| 440       | Giesinger Bräu 3                  | Giesinger Biermanufaktur und Spezialitäten Braugesellschaft mbH | -                | page text                      |       |
| 510       | TRUMER Anleihe Braufunding 4.0    | Trumer Bier GmbH                                                | -                | page text                      |       |
| 526       | Olchinger Braumanufaktur          | Olchinger Braumanufaktur GmbH                                   | -                | page text                      |       |
| 542       | Nixe Deutschland GmbH             | NIXE Deutschland GmbH                                           | -                | page text                      |       |
| 555       | TRUMER Braufunding 4.0            | Trumer Bier GmbH                                                | -                | page text                      |       |
| 565       | Giesinger Bräu                    | Giesinger Biermanufaktur und Spezialitäten Braugesellschaft mbH | -                | page text                      |       |
| 566       | Craft Bier Fest                   | Supersud GmbH                                                   | -                | page text                      |       |

### Consumer products, fashion, apparel and retail (17 rows)

| IDs | Campaign                                            | Issuer                                       | Chip                    | Basis                          | Notes                                                              |
| --- | --------------------------------------------------- | -------------------------------------------- | ----------------------- | ------------------------------ | ------------------------------------------------------------------ |
| 329 | YAMAZOKi                                            | YAMAZOKi GmbH                                | -                       | page text                      |                                                                    |
| 331 | Gebrüder Stitch                                     | ants in your pants GmbH                      | -                       | page text                      |                                                                    |
| 347 | sanSirro                                            | QUS Tech GmbH (ehem. sanSirro GmbH)          | -                       | page text                      |                                                                    |
| 387 | Joadre - Mode für Veränderung                       | Rolemodelx Impact Group GmbH                 | -                       | page text                      |                                                                    |
| 405 | Puzzles Living GmbH                                 | Pazls GmbH (ehem. Puzzles Living GmbH)       | -                       | page text                      |                                                                    |
| 408 | AUROCO                                              | Auroco GmbH                                  | -                       | page text                      |                                                                    |
| 422 | GENTLETENT                                          | Gentletent GmbH                              | -                       | page text                      |                                                                    |
| 430 | tip me - Trinkgeld direkt an Näher*innen            | tip me Global GmbH                           | -                       | page text                      |                                                                    |
| 454 | Das Futterhaus                                      | KAFU Handels GmbH (ehem. Wofu Handels GmbH)  | -                       | page text                      |                                                                    |
| 461 | Heatle - Wärme auf den Punkt gebracht               | BrandBrandNew GmbH                           | Hospitality and tourism | site industry chip + page text | site chip "Hospitality and tourism" differs from activity category |
| 463 | Zooblitz.                                           | Zooblitz GmbH                                | -                       | page text                      |                                                                    |
| 502 | THE SON                                             | CROWND T8 GmbH (ehem. VESTWERK The SON GmbH) | -                       | page text                      |                                                                    |
| 541 | Freemotion                                          | FREEMOTION GmbH                              | -                       | page text                      |                                                                    |
| 545 | CIRCLY – Die Upcycling Revolution in der Hautpflege | Foodignity Labs GmbH                         | -                       | page text                      |                                                                    |
| 551 | paper republic - Sei Teil der Revolution            | paper republic GmbH                          | -                       | page text                      |                                                                    |
| 559 | WEMOVE RUNNINGSTORES                                | WEMOVE Marketing GmbH                        | -                       | page text                      |                                                                    |
| 590 | Bio Strohhalme GmbH                                 | Bio Strohhalme GmbH                          | -                       | page text                      |                                                                    |

### Sports, leisure and entertainment (15 rows)

| IDs       | Campaign                                        | Issuer                      | Chip                    | Basis                          | Notes                                                              |
| --------- | ----------------------------------------------- | --------------------------- | ----------------------- | ------------------------------ | ------------------------------------------------------------------ |
| 333       | Rapid InvesTOR 7                                | SK Rapid GmbH               | -                       | page text                      |                                                                    |
| 374       | RACEWORLD                                       | RaceWorld GmbH              | -                       | page text                      |                                                                    |
| 385       | ZEEEM eSports – High End Fahrsimulation         | ZEEEM eSports GmbH          | -                       | page text                      |                                                                    |
| 386       | ErlebnisCard                                    | digital card solutions GmbH | -                       | page text                      |                                                                    |
| 415 / 490 | MYGYM 2.0 - subordinated bond                   | My Gym Verwaltungs GmbH     | Hospitality and tourism | site industry chip + page text | site chip "Hospitality and tourism" differs from activity category |
| 429       | Adventure Golf – Das Freizeiterlebnis für Alle! | GLM Abenteuergolf GmbH      | -                       | page text                      |                                                                    |
| 432       | M.A.N.D.U.                                      | Markovics Fit&Vid GmbH      | -                       | page text                      |                                                                    |
| 434       | Rapid InvesTOR 5                                | SK Rapid GmbH               | -                       | page text                      |                                                                    |
| 436       | Rapid InvesTOR 9                                | SK Rapid GmbH               | -                       | page text                      |                                                                    |
| 443       | Der Industrie Gigant - Der große Aufbruch       | UIG Games 1 GmbH            | -                       | page text                      |                                                                    |
| 466       | FK Austria Wien Arena Invest                    | FK Austria Wien AG          | -                       | page text                      |                                                                    |
| 473       | Rapid InvesTOR 2.0 - 10 Jahre                   | SK Rapid GmbH               | -                       | page text                      |                                                                    |
| 481       | Rapid InvesTOR 2.0 - 5 Jahre                    | SK Rapid GmbH               | -                       | page text                      |                                                                    |
| 525       | CAVISTO                                         | CAVISTO GmbH                | -                       | page text                      |                                                                    |

### Health (Healthcare), wellness and medtech (15 rows)

| IDs | Campaign                                                 | Issuer                                        | Chip       | Basis                          | Notes |
| --- | -------------------------------------------------------- | --------------------------------------------- | ---------- | ------------------------------ | ----- |
| 344 | igevia                                                   | igevia GmbH                                   | -          | page text                      |       |
| 417 | EAP® WIR ROCKEN DIE ZAHNMEDIZIN                          | EAP® Produktions- und Patentverwertungs- GmbH | -          | page text                      |       |
| 424 | Naturaslim                                               | Natura Health GmbH                            | -          | page text                      |       |
| 431 | Autonom Health                                           | Autonom Health GesundheitsbildungsGmbH        | -          | page text                      |       |
| 450 | PharmGenomics                                            | PharmGenomics GmbH                            | -          | page text                      |       |
| 496 | SomaView                                                 | SomaView GmbH                                 | -          | page text                      |       |
| 523 | ProFem - Going Public Wandelanleihe                      | ProFem GmbH                                   | Healthcare | site industry chip + page text |       |
| 538 | VIBIOTA - Premium Hanf-Produkte aus Österreich           | VIBIOTA GmbH                                  | -          | page text                      |       |
| 539 | Opilomed                                                 | GROOBA Trading GmbH                           | -          | page text                      |       |
| 544 | PROFEM                                                   | Profem GmbH                                   | -          | page text                      |       |
| 556 | HUNIC - Ergonomische Exoskelette für die Arbeitswelt 4.0 | HUNIC GmbH                                    | -          | page text                      |       |
| 564 | BIOGENA: Gesundheit zahlt sich aus!                      | Biogena GmbH & Co KG                          | -          | page text                      |       |
| 579 | AlpStories 4.0                                           | VASTOK d.o.o.                                 | -          | page text                      |       |
| 588 | Discovering Hands Österreich                             | Taktile Gesundheitsvorsorge GmbH              | -          | page text                      |       |
| 589 | Deep Nature Project                                      | Deep Nature Project GmbH                      | -          | page text                      |       |

### Industrial technology and manufacturing (14 rows)

| IDs | Campaign                                 | Issuer                                 | Chip | Basis     | Notes |
| --- | ---------------------------------------- | -------------------------------------- | ---- | --------- | ----- |
| 362 | viRaCube                                 | viRaTec GmbH                           | -    | page text |       |
| 399 | SENITEC SeniTurn                         | Senitec GmbH                           | -    | page text |       |
| 418 | ArgusOne                                 | JJE Development GmbH                   | -    | page text |       |
| 433 | Mundoplant                               | Mundoplant GmbH                        | -    | page text |       |
| 458 | SCIO Technology                          | SCIO Holding GmbH                      | -    | page text |       |
| 460 | Handvenen-Scan: der Mensch als Schlüssel | philippeit GmbH BiometricSecureSystems | -    | page text |       |
| 462 | coolGiants)® AG                          | coolGiants)                            | -    | page text |       |
| 524 | zzysh - natürliche Frische mit System    | innveri Deutschland GmbH               | -    | page text |       |
| 549 | 3D-Kennzeichen                           | 3D-Kennzeichen GmbH                    | -    | page text |       |
| 568 | AMADEO                                   | AMADEO Systems GmbH                    | -    | page text |       |
| 571 | Beerjet                                  | Beerjet GmbH                           | -    | page text |       |
| 572 | VABATEC                                  | VaBaTec GmbH                           | -    | page text |       |
| 576 | Lumindo.de                               | Lumindo GmbH                           | -    | page text |       |
| 584 | Cybershoes®                              | Cybershoes GmbH                        | -    | page text |       |

### Restaurants and gastronomy (12 rows)

| IDs       | Campaign                                       | Issuer                            | Chip                    | Basis                          | Notes                                                              |
| --------- | ---------------------------------------------- | --------------------------------- | ----------------------- | ------------------------------ | ------------------------------------------------------------------ |
| 326       | Masta George Gastronomie GmbH                  | Masta George Gastronomie GmbH     | -                       | page text                      |                                                                    |
| 339       | Vanillas                                       | Vanillas GmbH                     | -                       | page text                      |                                                                    |
| 358       | Kurt Pure Frozen Yogurt                        | Optimates Mobile GmbH             | -                       | page text                      |                                                                    |
| 397       | Kreutzers                                      | Kreutzers Gourmet GmbH            | -                       | page text                      |                                                                    |
| 401       | Surf'n'Fries is coming to Austria!             | Surf'n'Fries GmbH                 | -                       | page text                      |                                                                    |
| 444       | Vollpension Generationencafe                   | Vollpension Generationencafé GmbH | -                       | page text                      |                                                                    |
| 493 / 498 | beets&roots - profit participation certificate | Beets & Roots GmbH                | Hospitality and tourism | site industry chip + page text | site chip "Hospitality and tourism" differs from activity category |
| 504       | Pizza Innovazione                              | Pizza Innovazione UG              | -                       | page text                      |                                                                    |
| 530       | Paul & Ernst - 2017                            | Paul & Ernst GmbH                 | -                       | page text                      |                                                                    |
| 532       | Der Gute Fang                                  | Guter Fang Gastronomie GmbH       | -                       | page text                      |                                                                    |
| 569       | Feuerdorf International                        | Feuerdorf International GmbH      | -                       | page text                      |                                                                    |

### Agriculture, environment and recycling (10 rows)

| IDs | Campaign                                               | Issuer                            | Chip | Basis     | Notes |
| --- | ------------------------------------------------------ | --------------------------------- | ---- | --------- | ----- |
| 345 | CARBON RECOVERY - ROHSTOFFE AUS ALTREIFEN RÜCKGEWINNEN | Carbon Recovery GmbH              | -    | page text |       |
| 355 | Treesource                                             | oekotree GmbH                     | -    | page text |       |
| 368 | Compuritas                                             | Compuritas GmbH                   | -    | page text |       |
| 372 | Autonome Traktoren                                     | PAS PESCHAK AUTONOME SYSTEME GmbH | -    | page text |       |
| 379 | BerlinGreen                                            | BerlinGreen.tech UG               | -    | page text |       |
| 404 | youbee                                                 | youbee GmbH                       | -    | page text |       |
| 492 | plants4friends                                         | plants4friends GmbH               | -    | page text |       |
| 519 | clean & green                                          | clean & green holdings GmbH       | -    | page text |       |
| 521 | UMWELTPIONIER NATURDÜNGER                              | up-Umweltpionier GmbH             | -    | page text |       |
| 591 | Alga Pangea                                            | Alga Pangea GmbH                  | -    | page text |       |

### Building products and prefab housing (7 rows)

| IDs       | Campaign                                        | Issuer                      | Chip         | Basis                          | Notes                                                        |
| --------- | ----------------------------------------------- | --------------------------- | ------------ | ------------------------------ | ------------------------------------------------------------ |
| 338       | wohnwagon                                       | WW Wohnwagon GmbH           | -            | title/issuer name only         | mobile tiny homes (product company)                          |
| 448       | Heise Haus                                      | Heise Haus GmbH             | -            | page text                      | residential (timber-based housing product); page text        |
| 489 / 593 | KAPO - Fenster in eine grüne Zukunft - Anleihe. | KAPO Fenster und Türen GmbH | Construction | site industry chip + page text | building products (windows/doors manufacturer)               |
| 518       | McCube – Häuser zum Mitnehmen                   | M.C.B. GesmbH               | -            | page text                      | modular buildings (product company, not property investment) |
| 534       | LCT                                             | LCT GesmbH                  | -            | page text                      | building products (light concrete)                           |
| 586       | Wohnwagon wächst weiter                         | WW Wohnwagon GmbH           | -            | page text                      | mobile tiny homes (product company)                          |

### Financial services and investment vehicles (5 rows)

| IDs | Campaign                        | Issuer                 | Chip                  | Basis                          | Notes |
| --- | ------------------------------- | ---------------------- | --------------------- | ------------------------------ | ----- |
| 455 | Venture Space                   | Venture Space          | -                     | page text                      |       |
| 468 | NYALA - Digital Public Offering | NYALA Digital Asset AG | Finance and insurance | site industry chip + page text |       |
| 508 | SMG Holding - Genussschein      | SMG Holding            | Finance and insurance | site industry chip + page text |       |
| 536 | INYOVA-CROWDINVESTING           | Yova AG                | -                     | page text                      |       |
| 557 | Borza terjatev                  | BORZA TERJATEV d.o.o.  | -                     | page text                      |       |

### Education and aviation training (4 rows)

| IDs       | Campaign                                           | Issuer                        | Chip                   | Basis                          | Notes |
| --------- | -------------------------------------------------- | ----------------------------- | ---------------------- | ------------------------------ | ----- |
| 403 / 529 | HMW Mobility - Profit Participation Certificate    | HMW Mobility GmbH             | Education and research | site industry chip + page text |       |
| 484 / 594 | SKYGATE Aviation funding 1.0 - nachrangige Anleihe | Skygate Aviation Academy GmbH | Education and research | site industry chip + page text |       |

### Transport and logistics (3 rows)

| IDs | Campaign      | Issuer             | Chip | Basis     | Notes |
| --- | ------------- | ------------------ | ---- | --------- | ----- |
| 371 | Camper Gold   | Campergold GmbH    | -    | page text |       |
| 457 | Lieferschotte | Lieferschotte GmbH | -    | page text |       |
| 464 | myrobin       | myrobin GmbH       | -    | page text |       |

### Real estate (Residential, Commercial/office, Mixed-use and other property types.) (4 rows)

| IDs | Campaign                                            | Issuer                              | Status                        | Property type                        | Financing type                           |
| --- | --------------------------------------------------- | ----------------------------------- | ----------------------------- | ------------------------------------ | ---------------------------------------- |
| 343 | AVORIS Darlehen 2020                                | AVORIS GmbH                         | tentative (title/issuer only) | Not determined (page empty)          | Property project (tentative, unverified) |
| 394 | Kremplhof Darlehen 2020                             | AVORIS Kremplhof GmbH               | confirmed                     | Mixed-use (residential + commercial) | Property project                         |
| 447 | KOLLITSCH MANAGEMENT GMBH - IMMOBILIEN ANLEIHE 2020 | KOLLITSCH - IMMOBILIEN ANLEIHE 2020 | tentative (title/issuer only) | Not determined (page empty)          | Property project (tentative, unverified) |
| 476 | INVESTIEREN IN SALZBURGS SILICON VALLEY!            | UKO Holding GmbH                    | confirmed                     | Commercial/office                    | Property project                         |

### Unclear from available evidence (1 row, status not industry)

| IDs | Campaign  | Issuer        | Chip | Basis                                            | Notes                                                          |
| --- | --------- | ------------- | ---- | ------------------------------------------------ | -------------------------------------------------------------- |
| 527 | SCUBAJET. | Scubajet GmbH | -    | title/issuer name only (page has no description) | page has no description; classification from title/issuer only |

## 8. Not in the counts

- Row 378: no URL supplied.
- Orphan URL (English Uebergossene Alm page): duplicate of the asset in row 474; candidate for row 378, unproven.
