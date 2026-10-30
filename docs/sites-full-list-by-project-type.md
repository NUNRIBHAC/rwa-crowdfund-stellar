# Full supplied campaign lists by project type - all sites (cumulative, started 2026-10-30)

This file gathers the per-site campaign classifications in one place and grows cumulatively: each new site is appended as a new numbered site section. Each site section embeds the full text of that site's standalone report (headings nested under the site heading, otherwise unchanged). The standalone per-site files in this folder stay unchanged and remain the per-site source of truth.

## Site index

| Site   | Platform                            | Standalone report                                                                          | Companion CSV                                                                                | Input entries                                                            | Added      |
| ------ | ----------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------- |
| Site 1 | CONDA (conda-capital.com)           | [conda-full-list-by-project-type.md](conda-full-list-by-project-type.md)                   | [conda-full-list-by-project-type.csv](conda-full-list-by-project-type.csv)                   | 270 entries (269 numbered URLs + 1 unnumbered row), 248 unique offerings | 2026-10-30 |
| Site 2 | dagobertinvest (dagobertinvest.com) | [dagobertinvest-full-list-by-project-type.md](dagobertinvest-full-list-by-project-type.md) | [dagobertinvest-full-list-by-project-type.csv](dagobertinvest-full-list-by-project-type.csv) | 347 URL entries (342 campaigns, 4 unresolved rows, 1 legacy page)        | 2026-10-30 |

## How to add a new site

1. Create the standalone report `docs/<site>-full-list-by-project-type.md` (and its `.csv` companion) from that site's supplied list.
2. Add a row to the site index above with the next site number.
3. Append a new `## Site N: <platform>` section at the end of this file. Embed the full report text with every heading shifted two levels deeper (so the report's `#` title becomes `###`), preceded by a one-line note that the section's row IDs are the site's own numbering.
4. Do not rewrite earlier site sections when adding a new one, and do not add cross-site totals (see the conventions below).

## Conventions across sites

- Shared axes: every site report uses the same classification axes - the unified instrument categories (participation 1-4; loan and bond, each with senior / subordinated / unspecified states; zero-coupon and convertible as structure overlays; junior / qualified / Mini Bond as site labels; bridge financing as a role overlay), the project/financing type, the property type inside real estate, and the industry category.
- Row IDs are per-site: each report numbers its own supplied input rows, so the same number can appear under several sites. In cross-site context cite them with the site prefix: S1-394 (CONDA), S2-41 (dagobertinvest).
- No cross-site totals: CONDA counts each supplied URL separately (a translated page of the same offering is a separate URL; 270 URLs for 248 offerings), and both sites count separate tranches of one project as separate campaigns. Summing counts across sites would double count, so per-site totals stay per site.
- "Unclear from available evidence" is a status, not a category. Provisional and tentative labels stay as written in each report; nothing is reclassified in the embedding.

## Site 1: CONDA (conda-capital.com)

Standalone report: [conda-full-list-by-project-type.md](conda-full-list-by-project-type.md) (unchanged). The row IDs below are CONDA's own input numbering - cite them as S1-<id> in cross-site context. The full report text follows.

### CONDA full supplied campaign list by project type (2026-10-30)

This file classifies the full campaign list the user supplied on WhatsApp on 2026-10-30 (19:06 WET). The earlier section 11A of `conda-capital-platform-blueprint-2026-10-30.md` covers only the 12 campaigns in the ZIP archive and stays unchanged. Companion CSV with one row per input entry and per-row evidence: `conda-full-list-by-project-type.csv`.

The 17 industry categories below, plus "Unclear from available evidence" as a status (not an industry), use the wording the user supplied on WhatsApp on 2026-10-30 (19:36 and 19:40 WET). They are an analyst grouping made for this document. They are not CONDA's own taxonomy; CONDA's own industry chip is kept in its own column.

#### 1. Input entries, URLs and assets

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

#### 2. Instrument categories

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

#### 3. Translations and tranches

German + English pairs (same asset ID), 19 in all: 467/384, 364/469, 413/349, 470/592, 471/514, 474/(orphan), 475/479, 484/594, 486/407, 487/353, 489/593, 490/415, 491/391, 498/493, 500/499, 529/403, 533/325, 535/478, 543/389. Also: Green Energy Bond has three pages (350, 485 German; 346 English); eventDATA-services has two German pages (332, 452).

Distinct tranches, kept separate (different asset IDs): Giesinger Braeu 1-6 (565, 335, 440, 340, 395, 396), Olchinger Braumanufaktur 1-3 (526, 352, 367), Rapid InvesTOR (333, 434, 436, 473, 481), nine FMTG campaigns (383, 435, 477, 483, 537, 553, 574, 581, 585), Familux 1.0 (535/478) vs 2.0 (512), Super Power Generation bond 2.0 (364/469) vs Green Energy Bond (350/485/346), Vello (487/353 vs 377), Kaahee (328 vs 393), Innolytics (543/389 vs 507), Wohnwagon (338 vs 586), markta (503 vs 509), Trumer (510 vs 555), Greenstorm (380 vs 439), Moerwald bond (413/349) vs Moerwald hotel (575).

#### 4. Method and limits

- Each page was read live; the CSV `evidence` column quotes the first 200 characters of the page summary or description that the classification rests on.
- `site_industry_chip` is CONDA's own label. It exists on 63 of 270 pages only. `activity_category` is the analyst grouping of what the issuer's business does (the industry), so the two can differ; differences are listed in `chip_conflict`.
- `basis` shows how solid each row is. Pages 343 (AVORIS Darlehen 2020), 447 (Kollitsch Immobilien Anleihe 2020) and 527 (SCUBAJET) have no description. 343 and 447 are tentatively filed as real estate on title and issuer name only. 527 is unclear.
- `instrument_hint` comes from titles and contract document names. It is not a verified legal form.
- Each row has one category. Several are judgement calls (food platforms, bike accessories, HMW Mobility, FMTG as hotel operator). The reasoning is in `evidence`.

#### 5. Project/financing type and property type

Three separate fields, as the user asked. Industry (sections 6 and 7) says what the issuer does. Project/financing type says what kind of financing the entry is. Property type applies only to Real estate.

> **Provisional.** The financing type below is based on the issuer (an operating business), not on a verified use of proceeds. "Corporate" does not mean the financing purpose was confirmed as corporate. Only the 4 property rows rest on page text or title.

| Project/financing type (issuer-based, provisional)                         |                                     Rows (269 numbered with URL) |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------: |
| Corporate (issuer-based, provisional; use of proceeds not verified)        |                                                              264 |
| Property project                                                           |                                                                2 |
| Property project (tentative, unverified)                                   |                                                                2 |
| Project financing (asset-specific, energy infrastructure; not real estate) | none confirmed (not assessed; corporate rows were not sub-typed) |
| Unclear from available evidence                                            |                                                                1 |
| **Total**                                                                  |                                                          **269** |

Limits of the financing type: "Corporate" is assigned at issuer level. The page describes an operating business and names no specific property asset. The use of proceeds was not checked against each instrument's terms, so some corporate rows may in fact fund a specific project (a plant, a hotel build-out). No further sub-type (for example asset-specific non-property project) is asserted because the evidence was not read for that. Unknown stays unknown: row 527 (page empty) is "Unclear from available evidence", not corporate. Row 378 has no URL and is not classified. The orphan URL is a duplicate of row 474's offering and is not counted.

##### Real estate

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

#### 6. Counts by industry category

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

#### 7. Campaigns by category

Every row below has financing type "Corporate (issuer-based, provisional; use of proceeds not verified)" except the real estate rows and the unclear row, which are marked in their own tables.

##### Food and beverage products (31 rows)

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

##### Information Technology, software and digital platforms (29 rows)

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

##### Energy and utilities (29 rows)

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

##### Hotels, hospitality and tourism (28 rows)

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

##### E-bikes and light mobility (25 rows)

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

##### Brewery, wine and spirits (20 rows)

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

##### Consumer products, fashion, apparel and retail (17 rows)

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

##### Sports, leisure and entertainment (15 rows)

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

##### Health (Healthcare), wellness and medtech (15 rows)

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

##### Industrial technology and manufacturing (14 rows)

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

##### Restaurants and gastronomy (12 rows)

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

##### Agriculture, environment and recycling (10 rows)

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

##### Building products and prefab housing (7 rows)

| IDs       | Campaign                                        | Issuer                      | Chip         | Basis                          | Notes                                                        |
| --------- | ----------------------------------------------- | --------------------------- | ------------ | ------------------------------ | ------------------------------------------------------------ |
| 338       | wohnwagon                                       | WW Wohnwagon GmbH           | -            | title/issuer name only         | mobile tiny homes (product company)                          |
| 448       | Heise Haus                                      | Heise Haus GmbH             | -            | page text                      | residential (timber-based housing product); page text        |
| 489 / 593 | KAPO - Fenster in eine grüne Zukunft - Anleihe. | KAPO Fenster und Türen GmbH | Construction | site industry chip + page text | building products (windows/doors manufacturer)               |
| 518       | McCube – Häuser zum Mitnehmen                   | M.C.B. GesmbH               | -            | page text                      | modular buildings (product company, not property investment) |
| 534       | LCT                                             | LCT GesmbH                  | -            | page text                      | building products (light concrete)                           |
| 586       | Wohnwagon wächst weiter                         | WW Wohnwagon GmbH           | -            | page text                      | mobile tiny homes (product company)                          |

##### Financial services and investment vehicles (5 rows)

| IDs | Campaign                        | Issuer                 | Chip                  | Basis                          | Notes |
| --- | ------------------------------- | ---------------------- | --------------------- | ------------------------------ | ----- |
| 455 | Venture Space                   | Venture Space          | -                     | page text                      |       |
| 468 | NYALA - Digital Public Offering | NYALA Digital Asset AG | Finance and insurance | site industry chip + page text |       |
| 508 | SMG Holding - Genussschein      | SMG Holding            | Finance and insurance | site industry chip + page text |       |
| 536 | INYOVA-CROWDINVESTING           | Yova AG                | -                     | page text                      |       |
| 557 | Borza terjatev                  | BORZA TERJATEV d.o.o.  | -                     | page text                      |       |

##### Education and aviation training (4 rows)

| IDs       | Campaign                                           | Issuer                        | Chip                   | Basis                          | Notes |
| --------- | -------------------------------------------------- | ----------------------------- | ---------------------- | ------------------------------ | ----- |
| 403 / 529 | HMW Mobility - Profit Participation Certificate    | HMW Mobility GmbH             | Education and research | site industry chip + page text |       |
| 484 / 594 | SKYGATE Aviation funding 1.0 - nachrangige Anleihe | Skygate Aviation Academy GmbH | Education and research | site industry chip + page text |       |

##### Transport and logistics (3 rows)

| IDs | Campaign      | Issuer             | Chip | Basis     | Notes |
| --- | ------------- | ------------------ | ---- | --------- | ----- |
| 371 | Camper Gold   | Campergold GmbH    | -    | page text |       |
| 457 | Lieferschotte | Lieferschotte GmbH | -    | page text |       |
| 464 | myrobin       | myrobin GmbH       | -    | page text |       |

##### Real estate (Residential, Commercial/office, Mixed-use and other property types.) (4 rows)

| IDs | Campaign                                            | Issuer                              | Status                        | Property type                        | Financing type                           |
| --- | --------------------------------------------------- | ----------------------------------- | ----------------------------- | ------------------------------------ | ---------------------------------------- |
| 343 | AVORIS Darlehen 2020                                | AVORIS GmbH                         | tentative (title/issuer only) | Not determined (page empty)          | Property project (tentative, unverified) |
| 394 | Kremplhof Darlehen 2020                             | AVORIS Kremplhof GmbH               | confirmed                     | Mixed-use (residential + commercial) | Property project                         |
| 447 | KOLLITSCH MANAGEMENT GMBH - IMMOBILIEN ANLEIHE 2020 | KOLLITSCH - IMMOBILIEN ANLEIHE 2020 | tentative (title/issuer only) | Not determined (page empty)          | Property project (tentative, unverified) |
| 476 | INVESTIEREN IN SALZBURGS SILICON VALLEY!            | UKO Holding GmbH                    | confirmed                     | Commercial/office                    | Property project                         |

##### Unclear from available evidence (1 row, status not industry)

| IDs | Campaign  | Issuer        | Chip | Basis                                            | Notes                                                          |
| --- | --------- | ------------- | ---- | ------------------------------------------------ | -------------------------------------------------------------- |
| 527 | SCUBAJET. | Scubajet GmbH | -    | title/issuer name only (page has no description) | page has no description; classification from title/issuer only |

#### 8. Not in the counts

- Row 378: no URL supplied.
- Orphan URL (English Uebergossene Alm page): duplicate of the asset in row 474; candidate for row 378, unproven.

## Site 2: dagobertinvest (dagobertinvest.com)

Standalone report: [dagobertinvest-full-list-by-project-type.md](dagobertinvest-full-list-by-project-type.md) (unchanged). The row IDs below are dagobertinvest's own input numbering - cite them as S2-<id> in cross-site context. The full report text follows.

### dagobertinvest full supplied campaign list by project type (2026-10-30)

This file classifies the full dagobertinvest campaign list the user supplied on WhatsApp on 2026-10-30 (19:57 WET): 347 URL entries, each with a sitemap lastmod date. The supplied list matches, row for row, the 347 URLs and dates of the verified per-row page review carried out earlier on 2026-10-30, so the classification below reuses that review's evidence (live page reads, purpose clauses, campaign names, instrument terms). The CONDA documents in this folder stay unchanged.

Two separate axes, as the user asked. Industry says what the issuer or project does. Project/financing type says what kind of financing the entry is. Property type applies only inside real estate. The industry labels use the user's wording; "Unclear from available evidence" is a status, not an industry.

#### 1. Input entries, URLs and dates

| Item                                                                       | Count                    |
| -------------------------------------------------------------------------- | ------------------------ |
| Numbered rows supplied (1-347, no gaps, no duplicates)                     | 347                      |
| Rows with a URL                                                            | 347                      |
| Distinct URLs                                                              | 347                      |
| Sitemap lastmod date range                                                 | 2021-10-11 to 2026-10-21 |
| Live pages as of 2026-10-30 (342 campaign pages + 1 legacy marketing page) | 343                      |
| Homepage fragments (standalone campaign page returns 404)                  | 2                        |
| Full 404 pages                                                             | 2                        |
| Live but not a campaign (legacy issuer marketing page, row 5)              | 1                        |

Every URL and date in the supplied list equals the corresponding row of the earlier verified review. No additions, removals, spelling changes or date changes were found, so no row had to be re-fetched for this classification.

#### 2. Instrument forms and related tranches

Instrument class from the site's own "Vertragsform" term per campaign page (all 342 readable campaign pages have a term; the 4 unresolved rows and the non-campaign row have none). The site terms are filed into the unified instrument categories the user supplied on WhatsApp on 2026-10-30:

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

- Bridge financing: a financing role (short-term interim funding), not an instrument class and not a seniority. Each bridge campaign keeps whatever instrument and seniority its own page states.

Mapping of the 8 site Vertragsform terms (342 campaigns):

| Site term (Vertragsform)                                          | Campaigns | Category     | State / structure                                                          |
| ----------------------------------------------------------------- | --------- | ------------ | -------------------------------------------------------------------------- |
| Subordinated loan (qualified) / Qualifiziertes Nachrangdarlehen   | 261       | 5 Loan       | Subordinated; "qualified" kept as the site's label                         |
| Bridge financing / Bridgefinanzierung                             | 27        | Role overlay | Instrument and seniority unverified per campaign                           |
| Junior loan                                                       | 21        | 5 Loan       | Subordinated rank by label; contractual qualified subordination not proven |
| Subordinated bond (Mini Bond) / Mini Bond (nachrangige Anleihe)   | 17        | 6 Bond       | Subordinated (term says "nachrangige Anleihe"); "Mini Bond" kept as label  |
| Zero-coupon bond / Zero Bond                                      | 12        | 6 Bond       | Seniority unspecified; zero-coupon structure                               |
| Subordinated bond (qualified) / Qualifizierte nachrangige Anleihe | 2         | 6 Bond       | Subordinated (explicit in term); "qualified" kept as the site's label      |
| Senior loan                                                       | 1         | 5 Loan       | Senior                                                                     |
| Bond (qualified) / Qualifizierte Anleihe                          | 1         | 6 Bond       | Seniority unspecified; "qualified" not read as subordination               |
| **Total**                                                         | **342**   |              |                                                                            |

- No dagobertinvest campaign maps to categories 1-4 (participation side), to a senior bond, or to the convertible structure.
- Bridge financing: the 27 campaigns stay a financing role until each campaign's own terms are checked. One checked page (row 314, Kronenhaus) is documented on its own page as a "qualifiziertes Nachrangdarlehen"; that single page does not establish the instrument of the other 26.
- The 12 Zero Bond rows and the 1 unlabelled qualified bond are not filed as senior bonds: their checked pages state no seniority (the Vierseithof Zero Bonds state mortgage security but no subordination).
- The mapping rests on the site's Vertragsform labels, not on a re-verification of each instrument's legal terms.

12 rows are child tranches of another campaign in the list and are kept as separate campaigns: 43 of 42 (aventa-anzengrubergasse-leoben), 50 of 49 (aventa-hartberg), 119 of 118 (fzw-bau-salzburg-parsch), 130 of 129 (gupympka-leobersdorf), 136 of 135 (herakles-hietzing2), 142 of 141 (home-management-mannersdorf), 148 of 147 (hyperia-drischuetzgasse-1110), 174 of 173 (k3-eisenstadt), 205 of 204 (mgroup-fulpmes), 212 of 211 (ml-bau-tulbing), 311 of 310 (umfeld-stjohanniT-Farcherweg), 321 of 320 (wertsecure-voecklabruck). Rows 312, 345 and 346 are three separate financings of the same hotel project (Haberent Hotel Vierseithof).

#### 3. Method and limits

- Each campaign page was read live on 2026-10-30 during the earlier review; the `Evidence` column quotes the text signal the classification rests on ("purpose clause" is the page's own Zweck/Verwendung statement, "Das Projekt" the project section, "name" the campaign name).
- The financing type below is based on what the campaign page presents, not on a re-verification of each instrument's legal terms. "Property project" means the page describes a specific property development for that campaign; it does not prove the final flow of funds.
- For 107 residential rows the page or name shows a residential property campaign but no further detail (new-build vs renovation); their subtype stays unconfirmed and is not guessed.
- Rows 1, 2, 87 and 88 have no readable campaign page (two homepage fragments whose standalone pages return 404, two full 404 pages). They are "Unclear from available evidence" on both axes; nothing is inferred from their URL slugs.
- Row 36 (Arcarius) is the one corporate financing: its own page states "Typus Unternehmensfinanzierung / unternehmerische Beteiligung" and offers a participation in all current and future investments of the issuer. Its industry is Health (Healthcare), wellness and medtech, from the page text: Arcarius markets the longevity therapies and products of Prof. Dr. med. Fred Fändrich internationally ("Longevity", extension of healthy lifespan).
- The 6 hotel campaigns were re-read on 2026-10-30. Each funds named property works, not a hotel operator generally: rows 312, 345 and 346 state Typus "Projektfinanzierung" (renovation and bridge financing of Hotel Vierseithof, Luckenwalde), row 72 names "Mittelverwendung: Sanierung des Anbaus und Umbau zu 12 Serviced Apartments" (Hotel Belair AG, secured loan), row 258 finances part of the property purchase ("Liegenschaftsankauf") for a 25-unit aparthotel new-build, and row 314 is a bridge loan for the conversion of the Kronenhaus into a 114-room hotel. They stay "Property project" on this evidence.
- One financing type is added beyond the three the user listed, because the evidence supports it and none of the three fits: row 41 (AustriaEnergy wind park in Patagonia, Chile) is an asset-specific project financing but not real estate. It is marked "Project financing (asset-specific, energy infrastructure; not real estate)".
- No new categories were needed on the industry axis: every classified row fits the user's list.

#### 4. Project/financing type

> **Provisional.** The financing type rests on the campaign pages, not on a check of each instrument's terms. "Corporate" here is issuer-based and does not mean the financing purpose was confirmed as corporate.

| Project/financing type                                                     | Entries (346 campaigns: 342 with a readable campaign page, 4 unresolved) |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Property project                                                           | 340                                                                      |
| Corporate (issuer-based, provisional; use of proceeds not verified)        | 1                                                                        |
| Project financing (asset-specific, energy infrastructure; not real estate) | 1                                                                        |
| Unclear from available evidence                                            | 4                                                                        |
| **Total**                                                                  | **346**                                                                  |

Row 5 (legacy issuer marketing page, not a campaign) is outside these counts; see section 7.

##### Property type inside real estate (334 campaigns)

| Property type                                             | Campaigns |
| --------------------------------------------------------- | --------- |
| Residential (new-build development)                       | 129       |
| Residential (subtype detail unconfirmed)                  | 107       |
| Residential (renovation/revitalization)                   | 55        |
| Residential (renovation + new-build)                      | 21        |
| Mixed-use (residential + commercial elements)             | 19        |
| Residential (holiday apartments, incl. hotel conversions) | 3         |
| **Total**                                                 | **334**   |

No campaign is confirmed as a purely Commercial/office development; the 19 mixed-use rows combine residential with commercial elements.

#### 5. Counts by industry category

The industry is what the issuer or project does. It says nothing about use of proceeds (see section 4).

| Industry category                                                                 | Campaigns |
| --------------------------------------------------------------------------------- | --------- |
| Real estate (Residential, Commercial/office, Mixed-use and other property types.) | 334       |
| Hotels, hospitality and tourism                                                   | 6         |
| Energy and utilities                                                              | 1         |
| Health (Healthcare), wellness and medtech                                         | 1         |
| Unclear from available evidence                                                   | 4         |
| **Total**                                                                         | **346**   |

Row 5 (not a campaign) is outside these counts.

#### 6. Campaigns by category

Financing type per category: real estate and hotel rows are "Property project"; the energy row is the added project-financing value; the health row (Arcarius) is "Corporate (issuer-based, provisional; use of proceeds not verified)"; the unclear rows carry no financing type.

##### Real estate (Residential, Commercial/office, Mixed-use and other property types.) (334 campaigns)

###### Residential (new-build development) (129 campaigns)

| Row | Campaign                                                      | URL                                                                                            | Sitemap lastmod | Evidence                                                                                  |
| --- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------- |
| 10  | A bis Z real estate: Glattfelden im Kanton Zürich             | https://www.dagobertinvest.com/crowdfunding-a-bis-z-glattfelden                                | 2026-02-19      | "Neubau" (Das Projekt)                                                                    |
| 11  | Moderner Wohnbau nahe Zürich                                  | https://www.dagobertinvest.com/crowdfunding-a-bis-z-glattfelden-zweidlen                       | 2026-04-28      | "Neubau" (Vorhaben)                                                                       |
| 18  | AK PROJEKTE vienna: Hütteldorfer Straße 101 - #2              | https://www.dagobertinvest.com/crowdfunding-akprojekte-vienna-huetteldorfer-strasse-2          | 2026-07-02      | "Wohnbauprojekt" (purpose clause)                                                         |
| 23  | AK PROJEKTE vienna: Klopstockgasse 45                         | https://www.dagobertinvest.com/crowdfunding-akprojektevienna-klopstockgasse                    | 2026-07-02      | "Erricht" (purpose clause)                                                                |
| 26  | ALPHA CENTER: Wohnen am Wolfersberg in Wien Penzing           | https://www.dagobertinvest.com/crowdfunding-alc-huettelbergstrasse                             | 2025-10-16      | "erricht" (Das Projekt)                                                                   |
| 27  | ALPHA CENTER: Doppelhäuser Gablitz bei Wien                   | https://www.dagobertinvest.com/crowdfunding-alc-nestroygasse-gablitz                           | 2026-10-12      | "erricht" (Das Projekt)                                                                   |
| 29  | Allvest: Exclusive Doppelhäuser Unterwaltersdorf              | https://www.dagobertinvest.com/crowdfunding-allvest-unterwaltersdorf                           | 2024-10-14      | "Erricht" (purpose clause)                                                                |
| 35  | APL: Traunterrassen Gmunden                                   | https://www.dagobertinvest.com/crowdfunding-apl-gmunden                                        | 2024-10-14      | "Erricht" (purpose clause)                                                                |
| 37  | Area: Fountain Suites Gmunden                                 | https://www.dagobertinvest.com/crowdfunding-area-gmunden                                       | 2026-02-19      | "Erricht" (purpose clause)                                                                |
| 38  | AREA: Wohnhausanlage Thalheim                                 | https://www.dagobertinvest.com/crowdfunding-area-thalheim                                      | 2024-10-14      | "Erricht" (purpose clause)                                                                |
| 42  | AVENTA: Wohnanlage Leoben                                     | https://www.dagobertinvest.com/crowdfunding-aventa-anzengrubergasse-leoben                     | 2026-07-14      | "entsteh" (Das Projekt)                                                                   |
| 43  | AVENTA: Wohnanlage Leoben - Minibond                          | https://www.dagobertinvest.com/crowdfunding-aventa-anzengrubergasse-leoben-child               | 2026-07-14      | "entsteh" (Das Projekt)                                                                   |
| 44  | AVENTA, Projekt St. Stefaner Straße, Gratkorn                 | https://www.dagobertinvest.com/crowdfunding-aventa-gratkorn                                    | 2024-10-16      | "erricht" (purpose clause)                                                                |
| 45  | Wohnhausanlage Gollweg, Graz                                  | https://www.dagobertinvest.com/crowdfunding-aventa-graz                                        | 2024-10-14      | "erricht" (purpose clause)                                                                |
| 46  | Eigentumswohnungen Blasbauerweg                               | https://www.dagobertinvest.com/crowdfunding-aventa-graz-goesting                               | 2024-10-14      | "erricht" (purpose clause)                                                                |
| 47  | AVENTA: Wohnanlage Waltendorf                                 | https://www.dagobertinvest.com/crowdfunding-aventa-graz-waltendorf                             | 2024-10-14      | "erricht" (purpose clause)                                                                |
| 48  | AVENTA: Wohnanlage Graz-Gösting                               | https://www.dagobertinvest.com/crowdfunding-aventa-graz-wienerstra%C3%9Fe                      | 2026-07-14      | "erricht" (Das Projekt)                                                                   |
| 51  | Doppelhaushälften Franz-Nabl-Weg                              | https://www.dagobertinvest.com/crowdfunding-aventa-hausmannstaetten                            | 2024-10-14      | "erricht" (purpose clause)                                                                |
| 53  | AVENTA: Wohnanlage Lieboch                                    | https://www.dagobertinvest.com/crowdfunding-aventa-lieboch                                     | 2024-11-27      | "erricht" (purpose clause)                                                                |
| 57  | Baudesign: Bisamberg bei Wien                                 | https://www.dagobertinvest.com/crowdfunding-baudesign-franz-zeiller-gasse-bisamberg            | 2024-10-14      | "Erricht" (Das Projekt)                                                                   |
| 59  | Bauwerk: Dreistetten in den Wiener Alpen                      | https://www.dagobertinvest.com/crowdfunding-bauwerk-dreistetten                                | 2025-06-04      | "Erricht" (Das Projekt)                                                                   |
| 66  | Bauwerk: Tullnerbach nahe Wien                                | https://www.dagobertinvest.com/crowdfunding-bauwerk-tullnerbach                                | 2025-03-13      | "Erricht" (Das Projekt)                                                                   |
| 68  | BBB beta: Starterwohnungen Pöttsching                         | https://www.dagobertinvest.com/crowdfunding-bbb-beta-poettsching                               | 2026-08-25      | "Erricht" (purpose clause)                                                                |
| 69  | BBB DELTA: Appartements im Salzburger Pinzgau                 | https://www.dagobertinvest.com/crowdfunding-bbb-delta-pinzgau-hollersbach                      | 2026-08-25      | "Erricht" (Das Projekt)                                                                   |
| 70  | BBB gamma: Landhäuser im Salzburger Pinzgau                   | https://www.dagobertinvest.com/crowdfunding-bbb-gamma-salzburg-hollersbach                     | 2025-08-14      | "Erricht" (purpose clause)                                                                |
| 74  | BOGE: Köflach im Bezirk Voitsberg                             | https://www.dagobertinvest.com/crowdfunding-boge-koeflach                                      | 2026-09-17      | "entsteh" (Das Projekt)                                                                   |
| 75  | Bridge Finanzierung: BOGE                                     | https://www.dagobertinvest.com/crowdfunding-boge-koeflach-bridge                               | 2026-03-10      | "entsteh" (Das Projekt)                                                                   |
| 76  | Bonafide Immobilien: Micro Apartments Berlin                  | https://www.dagobertinvest.com/crowdfunding-bonafide-rudow-berlin                              | 2025-09-30      | "Erricht" (purpose clause)                                                                |
| 78  | Bretschneider Immobilien: WH6, Hamburg                        | https://www.dagobertinvest.com/crowdfunding-bretschneider-immobilien-wilhelmi-hamburg          | 2026-01-13      | "Erricht" (purpose clause)                                                                |
| 79  | Steinbrunngasse Klosterneuburg                                | https://www.dagobertinvest.com/crowdfunding-c5-immobilien-klosterneuburg                       | 2026-09-21      | "erricht" (Das Projekt)                                                                   |
| 81  | Bridge Finanzierung: CS-Bau                                   | https://www.dagobertinvest.com/crowdfunding-cs-bau-bridge                                      | 2025-11-19      | "erricht" (Das Projekt)                                                                   |
| 84  | D2: Achau bei Wien                                            | https://www.dagobertinvest.com/crowdfunding-d2-achau-pearl                                     | 2026-09-10      | "erricht" (Das Projekt)                                                                   |
| 85  | D2 Holding: BEL AIR Achau                                     | https://www.dagobertinvest.com/crowdfunding-d2-belair-achau                                    | 2026-01-27      | "Erricht" (purpose clause)                                                                |
| 89  | Nachhaltiges Wohnen – Doppelhaushälften im Bau                | https://www.dagobertinvest.com/crowdfunding-davina-projekt-traiskirchen                        | 2025-10-20      | "im Bau" (name)                                                                           |
| 91  | DNS: Wohnanlage "Pomodoro" Block B, Münchendorf bei Wien      | https://www.dagobertinvest.com/crowdfunding-dns-muenchendorf-bauteil-b                         | 2026-01-27      | "erricht" (purpose clause)                                                                |
| 92  | Dr. Schmidt & Partner: Wohnpark Oberwaltersdorf               | https://www.dagobertinvest.com/crowdfunding-dr-schmidt-immobilien-wohnpark-oberwaltersdorf     | 2024-07-12      | "entsteh" (Das Projekt)                                                                   |
| 93  | Dr. Schmidt & Partner: Lichteiche 14 Purkersdorf bei Wien     | https://www.dagobertinvest.com/crowdfunding-dr-schmidt-partner-lichteiche-14-purkersdorf       | 2026-10-06      | "entsteh" (Das Projekt)                                                                   |
| 94  | Dr. Schmidt & Partner: Lichteiche 8 Purkersdorf bei Wien      | https://www.dagobertinvest.com/crowdfunding-dr-schmidt-partner-lichteiche-8-purkersdorf        | 2026-02-25      | "entsteh" (Das Projekt)                                                                   |
| 102 | Efficient Home: Neunkirchen in den Wiener Alpen               | https://www.dagobertinvest.com/crowdfunding-efficient-home-neunkirchen                         | 2026-06-09      | "erricht" (Das Projekt)                                                                   |
| 103 | Eichberg: Hamburg Altona                                      | https://www.dagobertinvest.com/crowdfunding-eichberg-hamburg-altona                            | 2026-07-29      | "erricht" (Das Projekt)                                                                   |
| 109 | EXAKT REAL: Ispergasse 44 Wien Floridsdorf                    | https://www.dagobertinvest.com/crowdfunding-exakt-holding-ispergasse-wien-floridsdorf          | 2025-05-20      | "im Bau" (Das Projekt)                                                                    |
| 113 | Fatestone: Puntigam Graz                                      | https://www.dagobertinvest.com/crowdfunding-fatestone-graz-maelzerweg                          | 2026-08-25      | "Erricht" (Das Projekt)                                                                   |
| 114 | Fatestone: Straßgang Graz                                     | https://www.dagobertinvest.com/crowdfunding-fatestone-graz-strassgang                          | 2026-08-25      | "entsteh" (Das Projekt)                                                                   |
| 118 | FZW: Wohnen im Villenviertel Salzburgs                        | https://www.dagobertinvest.com/crowdfunding-fzw-bau-salzburg-parsch                            | 2026-05-21      | "Neubau" (Das Projekt)                                                                    |
| 119 | FZW Bau - Minibond                                            | https://www.dagobertinvest.com/crowdfunding-fzw-bau-salzburg-parsch-child                      | 2026-02-25      | "Neubau" (Das Projekt)                                                                    |
| 120 | Bridge Finanzierung: FZW Bau                                  | https://www.dagobertinvest.com/crowdfunding-fzw-salzburg-wolfsgartenweg-bridge                 | 2026-03-10      | "Neubau" (Das Projekt)                                                                    |
| 124 | GOLDSTEIN: Waldresidenz Remscheid Nähe Düsseldorf             | https://www.dagobertinvest.com/crowdfunding-goldstein-remscheid                                | 2026-06-23      | "erricht" (Das Projekt)                                                                   |
| 125 | Green Living: Moosburg bei München                            | https://www.dagobertinvest.com/crowdfunding-green-living-moosburg-metropolregion-muenchen      | 2024-11-13      | "erricht" (Das Projekt)                                                                   |
| 126 | Wohnpark Gralla                                               | https://www.dagobertinvest.com/crowdfunding-greenhouse-gralla                                  | 2025-01-15      | "Erricht" (purpose clause)                                                                |
| 127 | Wohnanlage Hausmannstätten                                    | https://www.dagobertinvest.com/crowdfunding-greenhouse-hausmannstaetten                        | 2024-07-10      | "Erricht" (purpose clause)                                                                |
| 135 | Herakles Immobilien: Jenbachgasse 2.0 1130 Wien               | https://www.dagobertinvest.com/crowdfunding-herakles-hietzing2                                 | 2026-10-07      | "Bauvorhaben" (Das Projekt)                                                               |
| 136 | Herakles Immobilien - Mini Bond                               | https://www.dagobertinvest.com/crowdfunding-herakles-hietzing2-child                           | 2026-10-07      | "Bauvorhaben" (Das Projekt)                                                               |
| 138 | Herakles Immobilien: Villa am Schafberg, 1180 Wien            | https://www.dagobertinvest.com/crowdfunding-herakles-schoenbrunner-graben                      | 2026-10-07      | "Neubau" (Das Projekt)                                                                    |
| 139 | HK Property: Villa Margarita                                  | https://www.dagobertinvest.com/crowdfunding-hk-property-kufstein                               | 2026-05-04      | "Erricht" (purpose clause)                                                                |
| 140 | "An der Himmelsstiege"                                        | https://www.dagobertinvest.com/crowdfunding-hkproperty-kirchberg                               | 2024-07-10      | "Erricht" (purpose clause)                                                                |
| 141 | Home Management: Mannersdorf am Leithagebirge                 | https://www.dagobertinvest.com/crowdfunding-home-management-mannersdorf                        | 2026-01-28      | "Erricht" (Das Projekt)                                                                   |
| 145 | Hydra Real: EASTPARK 5                                        | https://www.dagobertinvest.com/crowdfunding-hydra-innsbruck-eastpark                           | 2026-06-30      | "Erricht" (purpose clause)                                                                |
| 152 | IDEALHAUSBAU: München-Feldmoching                             | https://www.dagobertinvest.com/crowdfunding-idealhausbau-muenchen-feldmoching                  | 2024-10-16      | "erricht" (purpose clause)                                                                |
| 153 | Reihenhäuser Podlahagasse 69                                  | https://www.dagobertinvest.com/crowdfunding-immacon-essling                                    | 2026-07-27      | "erricht" (purpose clause)                                                                |
| 154 | IMMACON: Doppelhäuser Gießhübl bei Wien                       | https://www.dagobertinvest.com/crowdfunding-immacon-giesshuebl                                 | 2026-08-27      | "erricht" (purpose clause)                                                                |
| 164 | IMMOGRAND: Reihenhäuser Rosenzeile                            | https://www.dagobertinvest.com/crowdfunding-immogrand-floridsdorf                              | 2024-10-14      | "Erricht" (Das Projekt)                                                                   |
| 166 | INTECH-Gruppe: Strausberg im Berliner Umland                  | https://www.dagobertinvest.com/crowdfunding-intech-strausberg-berlin-umland                    | 2026-02-25      | "entsteh" (Das Projekt)                                                                   |
| 167 | Invest4u: Oftringen im Kanton Aargau                          | https://www.dagobertinvest.com/crowdfunding-invest4u-oftringen                                 | 2026-04-13      | "erricht" (Das Projekt)                                                                   |
| 168 | INVESTIX Immobilien: Millennium Palais Leipzig                | https://www.dagobertinvest.com/crowdfunding-investix-leipzig                                   | 2024-10-14      | "erricht" (purpose clause)                                                                |
| 169 | Neuer Geschosswohnbau in Berlin                               | https://www.dagobertinvest.com/crowdfunding-investix-wald14-berlin                             | 2026-07-07      | "entsteh" (Das Projekt)                                                                   |
| 173 | EISK3 Projektentwicklung: Eisenstadt                          | https://www.dagobertinvest.com/crowdfunding-k3-eisenstadt                                      | 2026-08-19      | "erricht" (Das Projekt)                                                                   |
| 174 | K3 Eisenstadt - Minibond                                      | https://www.dagobertinvest.com/crowdfunding-k3-eisenstadt-child                                | 2026-03-10      | "erricht" (Das Projekt)                                                                   |
| 176 | KASPER IMMOBILIEN: Doppelhäuser Feldbach                      | https://www.dagobertinvest.com/crowdfunding-kasper-immobilien-feldbach                         | 2024-10-16      | "erricht" (purpose clause)                                                                |
| 178 | KIP Wohndesign: Anlegerwohnungen Kapfenberg AT                | https://www.dagobertinvest.com/crowdfunding-kip-wohndesign-kapfenberg                          | 2025-04-07      | "erricht" (Das Projekt)                                                                   |
| 181 | L2: Doppelhäuser - „Sonnenplatzerl“                           | https://www.dagobertinvest.com/crowdfunding-l2-wels                                            | 2024-10-14      | "Erricht" (purpose clause)                                                                |
| 182 | "An der Kammgarn"                                             | https://www.dagobertinvest.com/crowdfunding-landhaus-moellersdorf                              | 2024-10-14      | "erricht" (purpose clause)                                                                |
| 183 | Wohnen am Schlosspark Tribuswinkel bei Baden                  | https://www.dagobertinvest.com/crowdfunding-landhaus-tribuswinkel                              | 2026-07-02      | "entsteh" (Das Projekt)                                                                   |
| 185 | L&T: Wohnpark "Schneebergblick" Unterwaltersdorf              | https://www.dagobertinvest.com/crowdfunding-lehner-trompeter-unterwaltersdorf                  | 2024-10-14      | "Erricht" (purpose clause)                                                                |
| 186 | L&T: Panorama-Villenpark Brunn am Gebirge                     | https://www.dagobertinvest.com/crowdfunding-lehner-trompeter-villenpark-brunn-am-gebirge       | 2024-12-10      | "Erricht" (purpose clause)                                                                |
| 188 | Bridge Finanzierung: Löwentor Immobilien                      | https://www.dagobertinvest.com/crowdfunding-loewentor-grosshoeflein-bridge                     | 2026-03-10      | "erricht" (Das Projekt)                                                                   |
| 189 | Wohnbau Freudenstadt: Leben im Schwarzwald                    | https://www.dagobertinvest.com/crowdfunding-lumina-freudenstadt-schwarzwald                    | 2026-07-14      | "entsteh" (Das Projekt)                                                                   |
| 197 | Wohnhausanlage Josef-Dunkl-Straße 7                           | https://www.dagobertinvest.com/crowdfunding-mawo-jds-mistelbach                                | 2026-08-27      | "erricht" (purpose clause)                                                                |
| 198 | MCO Real Estate AG: Egliswil im Kanton Aargau                 | https://www.dagobertinvest.com/crowdfunding-mco-real-estate-egliswil                           | 2026-07-08      | "erricht" (Das Projekt)                                                                   |
| 200 | MG 1 Immobilien: Samhaberstraße Pöstlingberg Linz             | https://www.dagobertinvest.com/crowdfunding-mg-1-immobilien-samhaberstrasse-poestlingberg-linz | 2025-12-02      | "entsteh" (Das Projekt)                                                                   |
| 201 | MG Bayern Bau: Rottach-Egern am Tegernsee                     | https://www.dagobertinvest.com/crowdfunding-mg-bayern-bau-rottach-egern                        | 2026-07-08      | "Neubau" (Das Projekt)                                                                    |
| 206 | MH Architektur: Neuss Metropolregion Düsseldorf               | https://www.dagobertinvest.com/crowdfunding-mh-architektur-neuss                               | 2024-10-14      | "erricht" (Das Projekt)                                                                   |
| 207 | Residenz St. Pankraz                                          | https://www.dagobertinvest.com/crowdfunding-mh-energie-wohnbau-fuegenberg                      | 2024-10-15      | "erricht" (purpose clause)                                                                |
| 208 | ML BAU: Hauptstraße Wien Penzing                              | https://www.dagobertinvest.com/crowdfunding-ml-bau-1140-wien                                   | 2026-07-06      | "Neubau" (Das Projekt)                                                                    |
| 211 | ML BAU: Tulbing nahe Tulln an der Donau                       | https://www.dagobertinvest.com/crowdfunding-ml-bau-tulbing                                     | 2026-07-06      | "erricht" (Das Projekt)                                                                   |
| 212 | ML BAU - Minibond                                             | https://www.dagobertinvest.com/crowdfunding-ml-bau-tulbing-child                               | 2026-10-05      | "erricht" (Das Projekt)                                                                   |
| 213 | MNB: Mahlsdorf - Stadtteil von Berlin                         | https://www.dagobertinvest.com/crowdfunding-mnb-berlin-mahlsdorf                               | 2026-02-19      | "entsteh" (Das Projekt)                                                                   |
| 214 | MNB: Mahlsdorf Berlin #2                                      | https://www.dagobertinvest.com/crowdfunding-mnb-berlin-mahlsdorf-zwei                          | 2026-02-19      | "entsteh" (Das Projekt)                                                                   |
| 215 | Monaco Wohnbau: Maisacher Straße Fürstenfeldbruck bei München | https://www.dagobertinvest.com/crowdfunding-monaco-fuerstenfeldbruck                           | 2026-07-07      | "entsteh" (Das Projekt)                                                                   |
| 216 | Elegantes Wohnen in Dornbirn                                  | https://www.dagobertinvest.com/crowdfunding-monti-wohnbau-rohrbach-dornbirn                    | 2026-10-19      | "Neubau" (Vorhaben)                                                                       |
| 217 | Elegantes Wohnen in Dornbirn - Zero Bond                      | https://www.dagobertinvest.com/crowdfunding-monti-wohnbau-rohrbach-dornbirn-zerobond           | 2026-03-04      | "Neubau" (Vorhaben)                                                                       |
| 219 | MUST-GROUP: Am Heuberg in Salzburg                            | https://www.dagobertinvest.com/crowdfunding-must-heuberg-salzburg                              | 2026-10-21      | "erricht" (Das Projekt)                                                                   |
| 220 | MUST-Group: Wohlfühlzuhause Mondsee                           | https://www.dagobertinvest.com/crowdfunding-must-mondsee                                       | 2026-09-17      | "entsteh" (Das Projekt)                                                                   |
| 224 | Nagel INVEST: Henstedt-Ulzburg Metropolregion Hamburg         | https://www.dagobertinvest.com/crowdfunding-nagel-invest-henstedt-lzburg                       | 2024-11-13      | "entsteh" (Das Projekt)                                                                   |
| 227 | Bridge Finanzierung: NB Grundbesitz #2                        | https://www.dagobertinvest.com/crowdfunding-nb-grundbesitz-hamburg-bridge                      | 2024-07-11      | "erricht" (Das Projekt)                                                                   |
| 230 | neopartement: The River Terrace                               | https://www.dagobertinvest.com/crowdfunding-neopartement-1190-heiligenstaedterstrasse          | 2026-09-07      | "entsteh" (Das Projekt)                                                                   |
| 231 | neopartement: Kugelfanggasse 1210 Wien                        | https://www.dagobertinvest.com/crowdfunding-neopartement-kugelfanggasse                        | 2026-09-07      | "entsteh" (Das Projekt)                                                                   |
| 232 | Bridge Finanzierung: neopartement V                           | https://www.dagobertinvest.com/crowdfunding-neopartement-kugelfanggasse-bridge                 | 2026-03-10      | "Neubau" (Das Projekt)                                                                    |
| 233 | NewStandard: Stadtpalais Mülheim zwischen Essen und Duisburg  | https://www.dagobertinvest.com/crowdfunding-newstandard-muelheim                               | 2024-10-14      | "im Bau" (Das Projekt)                                                                    |
| 240 | Ortner Real: Wohnanlage RUDO Linz                             | https://www.dagobertinvest.com/crowdfunding-ortnerreal-rudo-linz                               | 2026-09-22      | "Wohnbauprojekt" (purpose clause)                                                         |
| 246 | PEMA: Innsbruck Kranebitten                                   | https://www.dagobertinvest.com/crowdfunding-pema-innsbruck-kranebitten                         | 2026-07-06      | "Erricht" (Das Projekt)                                                                   |
| 250 | Reihenhäuser in Gänserndorf bei Wien                          | https://www.dagobertinvest.com/crowdfunding-pip-gaenserndorf                                   | 2024-10-16      | "erricht" (Das Projekt)                                                                   |
| 257 | PROFBO: Neu-Ulm zwischen Stuttgart und München                | https://www.dagobertinvest.com/crowdfunding-profbo-neu-ulm                                     | 2025-11-26      | "entsteh" (Das Projekt)                                                                   |
| 259 | QP Holding: Wohnhausanlage Eßling Wien Donaustadt             | https://www.dagobertinvest.com/crowdfunding-qp-holding-essling-wien-donaustadt                 | 2026-07-02      | "entsteh" (Das Projekt)                                                                   |
| 260 | Vorsorgewohnungen in Graz                                     | https://www.dagobertinvest.com/crowdfunding-rc1-innovation-gmbh-co-kg-graz-goesting            | 2026-07-07      | "Erricht" (Das Projekt)                                                                   |
| 261 | Die Realität: Mehrfamilienhaus Morzg Salzburg                 | https://www.dagobertinvest.com/crowdfunding-realitaet-morzg-salzburg                           | 2025-02-17      | "entsteh" (Das Projekt)                                                                   |
| 263 | Die Realität: Wohnanlage Wiesing 2.0                          | https://www.dagobertinvest.com/crowdfunding-realitaet-tirol-wiesing                            | 2025-02-17      | "entsteh" (Das Projekt)                                                                   |
| 266 | Bridge Finanzierung: Die Realität                             | https://www.dagobertinvest.com/crowdfunding-realitaet-wiesing-bridge                           | 2026-03-10      | "entsteh" (Das Projekt)                                                                   |
| 271 | Römer Immobilien: Duggingen bei Basel                         | https://www.dagobertinvest.com/crowdfunding-roemer-immobilien-duggingen                        | 2026-05-20      | "Erricht" (Das Projekt)                                                                   |
| 273 | RT Gruppe: Villenwohnungen Lindo Leipzig                      | https://www.dagobertinvest.com/crowdfunding-rt-gruppe-lindo-leipzig                            | 2025-07-28      | "Neubau" (purpose clause)                                                                 |
| 274 | SAPAEN: An der Königswiesen 38                                | https://www.dagobertinvest.com/crowdfunding-sapaen-koenigswiese-moedling                       | 2025-02-18      | "Erricht" (purpose clause)                                                                |
| 287 | Stalder: Burghalde Aarburg CH                                 | https://www.dagobertinvest.com/crowdfunding-stalder-aarburg                                    | 2026-07-13      | "entsteh" (Das Projekt)                                                                   |
| 288 | STALDER: Eigenthal bei Luzern CH                              | https://www.dagobertinvest.com/crowdfunding-stalder-luzern-eigenthal                           | 2026-07-13      | "entsteh" (Das Projekt)                                                                   |
| 289 | Stalder: Seeresidenz am Vierwaldstättersee CH                 | https://www.dagobertinvest.com/crowdfunding-stalder-seeresidenz-vitznau-luzern                 | 2026-05-28      | "entsteh" (Das Projekt)                                                                   |
| 290 | STAUNE Immobilien: Aichhorngasse 1120 Wien                    | https://www.dagobertinvest.com/crowdfunding-staune-aichhorngasse-meidling                      | 2024-11-07      | "Wohnbauprojekt" (purpose clause)                                                         |
| 291 | Steinblick AG: Neuenhof bei Zürich CH                         | https://www.dagobertinvest.com/crowdfunding-steinblick-neunhof-bei-zuerich                     | 2024-07-10      | "entsteh" (Das Projekt)                                                                   |
| 300 | SYSTEOS: Wohnen am Schanzbach                                 | https://www.dagobertinvest.com/crowdfunding-systeos-kottingbrunn                               | 2024-10-30      | "Erricht" (purpose clause)                                                                |
| 306 | Bridge Finanzierung: Trajkovic Investment KG - Klosterneuburg | https://www.dagobertinvest.com/crowdfunding-trajkovic-klosterneuburg-bridge                    | 2025-08-22      | "erricht" (Das Projekt)                                                                   |
| 307 | Bridge Finanzierung: Trajkovic Investment KG                  | https://www.dagobertinvest.com/crowdfunding-trajkovic-purkersdorf                              | 2025-05-07      | "erricht" (Das Projekt)                                                                   |
| 309 | United Buildings Group: Kreuzbergl Hills Klagenfurt           | https://www.dagobertinvest.com/crowdfunding-ubg-kreuzbergl-klagenfurt                          | 2024-07-10      | "Erricht" (purpose clause)                                                                |
| 310 | Umfeld: Jägerhof in St. Johann i.T.                           | https://www.dagobertinvest.com/crowdfunding-umfeld-stjohanniT-Farcherweg                       | 2025-10-08      | "entsteh" (Das Projekt)                                                                   |
| 311 | Umfeld - Minibond                                             | https://www.dagobertinvest.com/crowdfunding-umfeld-stjohanniT-Farcherweg-child                 | 2025-10-08      | "entsteh" (Das Projekt)                                                                   |
| 313 | Valetono Group: Reihenhäuser Leopoldauer Straße 1210 Wien     | https://www.dagobertinvest.com/crowdfunding-valetono-leopoldau-wien-floridsdorf                | 2026-10-06      | "entsteh" (Das Projekt)                                                                   |
| 318 | Wohnanlage "Weererwirt" - Innsbruck                           | https://www.dagobertinvest.com/crowdfunding-weererwirt-tirol                                   | 2024-07-10      | page text: "entsteht ein Neubauprojekt mit drei Bauteilen und insgesamt 46 ... Wohnungen" |
| 322 | Gartensiedlung Biedermannsdorf                                | https://www.dagobertinvest.com/crowdfunding-whitestone-biedermannsdorf                         | 2024-07-10      | "entsteh" (Das Projekt)                                                                   |
| 323 | Condo 118                                                     | https://www.dagobertinvest.com/crowdfunding-whitestone-condo118-donaustadt                     | 2026-09-21      | "entsteh" (Das Projekt)                                                                   |
| 324 | WHITESTONE: Mirabelle Premium Suites Laxenburg                | https://www.dagobertinvest.com/crowdfunding-whitestone-laxenburg                               | 2025-12-09      | "Bauvorhaben" (purpose clause)                                                            |
| 342 | Wohnquadrat Berlin: Stühlinger Straße im Prinzenviertel       | https://www.dagobertinvest.com/crowdfunding-wohnquadrat-berlin-stuehlingerstrasse              | 2024-11-05      | "Wohnbauprojekt" (Das Projekt)                                                            |
| 343 | Your Immo: Doppelhäuser-Ried im Innkreis                      | https://www.dagobertinvest.com/crowdfunding-your-immo-hohenzell                                | 2025-07-22      | "Erricht" (purpose clause)                                                                |
| 344 | Your Immo: Reihenhäuser Taiskirchen                           | https://www.dagobertinvest.com/crowdfunding-your-immo-taiskirchen                              | 2026-02-03      | "Erricht" (purpose clause)                                                                |

###### Residential (subtype detail unconfirmed) (107 campaigns)

| Row | Campaign                                               | URL                                                                                       | Sitemap lastmod | Evidence                                        |
| --- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------- |
| 3   | Anlegerwohnungen Magdeburg                             | https://www.dagobertinvest.com/as-magdeburg-liegenschaften-lindenstrasse                  | 2025-11-19      | subtype not confirmed in name/project statement |
| 4   | Anlegerwohnungen Magdeburg (Zero Bond)                 | https://www.dagobertinvest.com/as-magdeburg-liegenschaften-lindenstrasse-zero-bond        | 2026-07-27      | subtype not confirmed in name/project statement |
| 6   | Appartement-Haus Salzburg Land                         | https://www.dagobertinvest.com/crowdfunding-1508-appartementhaus-hochkoenig               | 2026-09-08      | subtype not confirmed in name/project statement |
| 7   | Nachhaltig Wohnen im Wiener Speckgürtel                | https://www.dagobertinvest.com/crowdfunding-1a-projekt-tullnerbach-gmbh                   | 2026-07-13      | subtype not confirmed in name/project statement |
| 12  | ABIZ: Wohnanlage Zeiselmauer                           | https://www.dagobertinvest.com/crowdfunding-abiz-zeiselmauer                              | 2024-10-15      | subtype not confirmed in name/project statement |
| 17  | AK PROJEKTE vienna: Hütteldorfer Straße 101 - #1       | https://www.dagobertinvest.com/crowdfunding-akprojekte-huetteldorfer-strasse              | 2026-07-02      | subtype not confirmed in name/project statement |
| 20  | AK PROJEKT vienna: Obere Amtshausgasse 49              | https://www.dagobertinvest.com/crowdfunding-akprojektevienna-amtshausgasse                | 2026-01-14      | subtype not confirmed in name/project statement |
| 24  | Alpha Center - Baden                                   | https://www.dagobertinvest.com/crowdfunding-alc-baden                                     | 2024-10-14      | subtype not confirmed in name/project statement |
| 28  | Casa d'Oro II - Gablitz                                | https://www.dagobertinvest.com/crowdfunding-alc-riederberg                                | 2026-01-27      | subtype not confirmed in name/project statement |
| 30  | Alpha Center - Gablitz                                 | https://www.dagobertinvest.com/crowdfunding-alphacenter-immobilie-gablitz                 | 2024-07-10      | subtype not confirmed in name/project statement |
| 31  | Alphacenter - Münchendorf - 7,25%                      | https://www.dagobertinvest.com/crowdfunding-alphacenter-immobilie-muenchendorf            | 2024-10-16      | subtype not confirmed in name/project statement |
| 32  | WHA Grazerstraße, Wiener Neustadt                      | https://www.dagobertinvest.com/crowdfunding-alwa-grazerstrasse-wiener-neustadt            | 2026-07-02      | subtype not confirmed in name/project statement |
| 33  | Stadtentwicklung erstrangig besichert                  | https://www.dagobertinvest.com/crowdfunding-aoc-dessau-meisterhausblick                   | 2025-12-18      | subtype not confirmed in name/project statement |
| 34  | Vollvermietete Wohnanlage in Magdeburg                 | https://www.dagobertinvest.com/crowdfunding-ap-management-curiestrasse-magdeburg          | 2026-08-17      | subtype not confirmed in name/project statement |
| 39  | LUX Wohnbau: Leobendorf bei Wien                       | https://www.dagobertinvest.com/crowdfunding-arge-baudesign-lux-wohnbau-leobendorf         | 2024-10-14      | subtype not confirmed in name/project statement |
| 40  | ARGE BDS&LUX - Strebersdorf                            | https://www.dagobertinvest.com/crowdfunding-argebaudesignlux-strebersdorf                 | 2024-10-16      | subtype not confirmed in name/project statement |
| 52  | AVENTA: Wohnanlage - Hirtenberg                        | https://www.dagobertinvest.com/crowdfunding-aventa-hirtenberg                             | 2024-11-27      | subtype not confirmed in name/project statement |
| 56  | Bisamberg Donaugraben                                  | https://www.dagobertinvest.com/crowdfunding-baudesign-bisamberg                           | 2024-10-16      | subtype not confirmed in name/project statement |
| 58  | BAUDESIGN Einfamilienhäuser Hagenbrunn bei Wien        | https://www.dagobertinvest.com/crowdfunding-baudesign-hagenbrunn                          | 2024-10-14      | subtype not confirmed in name/project statement |
| 60  | Bridge Finanzierung: Bauwerk                           | https://www.dagobertinvest.com/crowdfunding-bauwerk-dreistetten-bridge                    | 2026-03-10      | subtype not confirmed in name/project statement |
| 61  | Wohnhausanlage Großenzersdorf                          | https://www.dagobertinvest.com/crowdfunding-bauwerk-grossenzersdorf                       | 2026-09-21      | subtype not confirmed in name/project statement |
| 62  | Bauwerk - Wien Meidling - 7,35%                        | https://www.dagobertinvest.com/crowdfunding-bauwerk-immobilie-wien-meidling               | 2024-07-10      | subtype not confirmed in name/project statement |
| 63  | Doppelhäuser Laxenburg                                 | https://www.dagobertinvest.com/crowdfunding-bauwerk-laxenburg                             | 2024-07-10      | subtype not confirmed in name/project statement |
| 64  | Bauwerk - Gate One                                     | https://www.dagobertinvest.com/crowdfunding-bauwerk-mariabrunn                            | 2026-09-21      | subtype not confirmed in name/project statement |
| 65  | Reihenhäuser Oberpiesting                              | https://www.dagobertinvest.com/crowdfunding-bauwerk-oberpiesting                          | 2024-10-14      | subtype not confirmed in name/project statement |
| 73  | Projektierung in München                               | https://www.dagobertinvest.com/crowdfunding-bfh-projektierung-muenchen                    | 2026-07-23      | subtype not confirmed in name/project statement |
| 77  | Wohntraum Felixdorf                                    | https://www.dagobertinvest.com/crowdfunding-bretschneider-felixdorf                       | 2024-10-16      | subtype not confirmed in name/project statement |
| 80  | Concepta: Rottweil bei Stuttgart                       | https://www.dagobertinvest.com/crowdfunding-concepta-rottweil                             | 2026-08-27      | subtype not confirmed in name/project statement |
| 82  | Bridge Finanzierung: cwbeteiligungs GmbH               | https://www.dagobertinvest.com/crowdfunding-cwbau-bayern-bridge                           | 2026-05-07      | subtype not confirmed in name/project statement |
| 83  | cwbauprojekte: Freihaus 35 - Bad Wiessee               | https://www.dagobertinvest.com/crowdfunding-cwbauprojekte-bad-wiessee                     | 2024-10-14      | subtype not confirmed in name/project statement |
| 86  | 7DS GmbH: Metropolregion Frankfurt                     | https://www.dagobertinvest.com/crowdfunding-dadgar-invest-frankfurt                       | 2026-02-19      | subtype not confirmed in name/project statement |
| 90  | Donaublick in Wien Döbling                             | https://www.dagobertinvest.com/crowdfunding-dgm-holding-donauwartesteig-gmbh              | 2026-09-16      | subtype not confirmed in name/project statement |
| 95  | Dullovi Bau: Niederlenz im Kanton Aargau               | https://www.dagobertinvest.com/crowdfunding-dullovi-bau-niederlenz                        | 2026-03-10      | subtype not confirmed in name/project statement |
| 96  | DUSCHEK: Wohnhausprojekt Bahnstraße 35                 | https://www.dagobertinvest.com/crowdfunding-duschek-immobilien-mattersburg                | 2026-09-21      | subtype not confirmed in name/project statement |
| 100 | ecoLIVING - Tulln 7,25%                                | https://www.dagobertinvest.com/crowdfunding-ecoliving-tulln-immobilie                     | 2024-10-16      | subtype not confirmed in name/project statement |
| 111 | Bridge Finanzierung: EXAKT REAL                        | https://www.dagobertinvest.com/crowdfunding-exakt-real-ispergasse-bridge                  | 2025-05-14      | subtype not confirmed in name/project statement |
| 112 | Bibersiedlung                                          | https://www.dagobertinvest.com/crowdfunding-fairhome-bibersiedlung-simmering              | 2024-10-16      | subtype not confirmed in name/project statement |
| 117 | FX Immo - Fischamend                                   | https://www.dagobertinvest.com/crowdfunding-fx-immo-immobilie-fischamend                  | 2024-07-10      | subtype not confirmed in name/project statement |
| 121 | Villen in Grünwald                                     | https://www.dagobertinvest.com/crowdfunding-g22-villen-in-gr%C3%BCnwald                   | 2026-02-16      | subtype not confirmed in name/project statement |
| 122 | Villen in Grünwald - Zero Bond                         | https://www.dagobertinvest.com/crowdfunding-g22-villen-in-gr%C3%BCnwald-zero-bond         | 2026-02-25      | subtype not confirmed in name/project statement |
| 134 | Herakles Immobilien: Villa Jenbachgasse Wien 13        | https://www.dagobertinvest.com/crowdfunding-herakles-hietzing                             | 2024-10-14      | subtype not confirmed in name/project statement |
| 137 | HERAKLES IMMOBILIEN: Am Ölberg Klosterneuburg bei Wien | https://www.dagobertinvest.com/crowdfunding-herakles-klosterneuburg                       | 2024-10-14      | subtype not confirmed in name/project statement |
| 142 | Home Management - Minibond                             | https://www.dagobertinvest.com/crowdfunding-home-management-mannersdorf-child             | 2026-01-22      | subtype not confirmed in name/project statement |
| 144 | Hydra Real: RESIDENZ 206, Innsbruck                    | https://www.dagobertinvest.com/crowdfunding-hydra-innsbruck                               | 2026-06-30      | subtype not confirmed in name/project statement |
| 146 | Hydra Spyder: Investmentfokus Tirol                    | https://www.dagobertinvest.com/crowdfunding-hydra-spyder-investmentfokus-tirol            | 2026-10-13      | subtype not confirmed in name/project statement |
| 156 | Immo Galaxy: Wohnungspaket Steiermark - Kärnten        | https://www.dagobertinvest.com/crowdfunding-immo-galaxy-wohnungspaket                     | 2026-02-19      | subtype not confirmed in name/project statement |
| 157 | Bauwerk - Wien Donaustadt - 7,25%                      | https://www.dagobertinvest.com/crowdfunding-immobilie-bauwerk-wien-donaustadt             | 2024-07-10      | subtype not confirmed in name/project statement |
| 158 | Trendhaus- Wien Donaustadt                             | https://www.dagobertinvest.com/crowdfunding-immobilie-biberhaufenweg-trendhaus            | 2026-01-08      | subtype not confirmed in name/project statement |
| 159 | DNS - Münchendorf                                      | https://www.dagobertinvest.com/crowdfunding-immobilie-dns-muenchendorf                    | 2024-07-10      | subtype not confirmed in name/project statement |
| 160 | FX Immo - Maria Gugging - 7,15%                        | https://www.dagobertinvest.com/crowdfunding-immobilie-fx-immo-maria-gugging               | 2024-10-16      | subtype not confirmed in name/project statement |
| 161 | Lehner & Trompeter                                     | https://www.dagobertinvest.com/crowdfunding-immobilie-lehner_trompeter                    | 2024-08-21      | subtype not confirmed in name/project statement |
| 162 | Prime Real - Brunn am Gebirge                          | https://www.dagobertinvest.com/crowdfunding-immobilie-prime-real-brunn-am-gebirge         | 2025-03-26      | subtype not confirmed in name/project statement |
| 163 | Baudesign - Immobilien - Wien Umgebung                 | https://www.dagobertinvest.com/crowdfunding-immobilien-baudesign                          | 2024-07-10      | subtype not confirmed in name/project statement |
| 165 | IMMOgreen: Kellergasse - Kleinengersdorf               | https://www.dagobertinvest.com/crowdfunding-immogreen-kleinengersdorf                     | 2025-02-18      | subtype not confirmed in name/project statement |
| 171 | K + A Bauinvest: Wahren in Leipzig                     | https://www.dagobertinvest.com/crowdfunding-k+a-wahren-leipzig                            | 2025-09-02      | subtype not confirmed in name/project statement |
| 172 | Bridge-Finanzierung: K + A Bauinvest                   | https://www.dagobertinvest.com/crowdfunding-k+a-wahren-leipzig-bridge                     | 2026-03-10      | subtype not confirmed in name/project statement |
| 180 | L2: Reihenhäuser - "Linzblick"                         | https://www.dagobertinvest.com/crowdfunding-l2-lichtenberg                                | 2025-02-17      | subtype not confirmed in name/project statement |
| 184 | Lehner & Trompeter - Gablitz 7%                        | https://www.dagobertinvest.com/crowdfunding-lehner-trompeter-gablitz                      | 2024-07-10      | subtype not confirmed in name/project statement |
| 202 | Bridge-Finanzierung: MG Bayern BAU                     | https://www.dagobertinvest.com/crowdfunding-mg-bayern-bau-rottach-egern-bridge            | 2026-03-10      | subtype not confirmed in name/project statement |
| 223 | MUST-GROUP: Wohlfühlzuhause Straßwalchen               | https://www.dagobertinvest.com/crowdfunding-must-strasswalchen                            | 2024-10-14      | subtype not confirmed in name/project statement |
| 225 | NB Grundbesitz: Hamburg Blankenese Mitte               | https://www.dagobertinvest.com/crowdfunding-nb-grundbesitz-hamburg-blankenese-mitte       | 2025-05-13      | subtype not confirmed in name/project statement |
| 226 | NB Grundbesitz: Hamburg Blankenese Ost                 | https://www.dagobertinvest.com/crowdfunding-nb-grundbesitz-hamburg-blankenese-ost         | 2025-06-24      | subtype not confirmed in name/project statement |
| 228 | NB Grundbesitz: Hamburg Finkenwerder                   | https://www.dagobertinvest.com/crowdfunding-nb-grundbesitz-hamburg-finkenwerder           | 2025-05-13      | subtype not confirmed in name/project statement |
| 229 | Bridge Finanzierung: NB Grundbesitz #1                 | https://www.dagobertinvest.com/crowdfunding-nb-grundstuecksentwicklung-hamburg-bridge     | 2024-07-11      | subtype not confirmed in name/project statement |
| 239 | I ORTNER REAL: Investmentfokus Projekte in Österreich  | https://www.dagobertinvest.com/crowdfunding-ortner-real-blind-pool                        | 2026-02-03      | subtype not confirmed in name/project statement |
| 241 | Ortner Real: Schill 21 Linz                            | https://www.dagobertinvest.com/crowdfunding-ortnerreal-schill-linz                        | 2026-05-08      | subtype not confirmed in name/project statement |
| 245 | Pego Swiss Property: Ossingen im Kanton Zürich         | https://www.dagobertinvest.com/crowdfunding-pegoswissproperty-ossingen                    | 2026-07-29      | subtype not confirmed in name/project statement |
| 247 | PAUL&PARTNER: Adonisweg Wien-Donaustadt                | https://www.dagobertinvest.com/crowdfunding-pip-adonisweg-wien-donaustadt                 | 2024-10-14      | subtype not confirmed in name/project statement |
| 251 | PAUL&PARTNER: Hainburg an der Donau                    | https://www.dagobertinvest.com/crowdfunding-pip-hainburg                                  | 2024-10-14      | subtype not confirmed in name/project statement |
| 253 | SOMI Immobilieninvestment eins GmbH                    | https://www.dagobertinvest.com/crowdfunding-pip-strasshof                                 | 2024-10-16      | subtype not confirmed in name/project statement |
| 254 | Hessegasse 2.0                                         | https://www.dagobertinvest.com/crowdfunding-pip-waldheimstrasse                           | 2024-10-16      | subtype not confirmed in name/project statement |
| 255 | Bridge Finanzierung: PROFBO                            | https://www.dagobertinvest.com/crowdfunding-profbo-eningen-bridge                         | 2025-12-03      | subtype not confirmed in name/project statement |
| 256 | PROFBO: Möttlingen Metropolregion Stuttgart            | https://www.dagobertinvest.com/crowdfunding-profbo-moettlingen                            | 2025-07-17      | subtype not confirmed in name/project statement |
| 262 | Die Realität: Wohnhausanlage - Saalfelden              | https://www.dagobertinvest.com/crowdfunding-realitaet-saalfelden                          | 2026-02-03      | subtype not confirmed in name/project statement |
| 264 | Wohnhausanlage Wattens                                 | https://www.dagobertinvest.com/crowdfunding-realitaet-wattens                             | 2024-10-14      | subtype not confirmed in name/project statement |
| 265 | Die Realität: Wohnanlage Wiesing                       | https://www.dagobertinvest.com/crowdfunding-realitaet-wiesing                             | 2024-10-14      | subtype not confirmed in name/project statement |
| 267 | DIE REALITÄT: Wohnhausanlage Wattens bei Innsbruck 2.0 | https://www.dagobertinvest.com/crowdfunding-realitaet-wohnanlage-wattens                  | 2025-02-17      | subtype not confirmed in name/project statement |
| 268 | realXwohncity: Wohnpark Strasshof                      | https://www.dagobertinvest.com/crowdfunding-realxwohncity-wohnpark-strasshof              | 2024-10-14      | subtype not confirmed in name/project statement |
| 270 | Das Andritz                                            | https://www.dagobertinvest.com/crowdfunding-rg35-andritz-graz                             | 2025-11-20      | subtype not confirmed in name/project statement |
| 272 | RT.Gruppe: EAST LIVING Leipzig - #1                    | https://www.dagobertinvest.com/crowdfunding-rt-gruppe-east-living-leipzig                 | 2026-07-08      | subtype not confirmed in name/project statement |
| 275 | Sapaen: An den Königswiesen                            | https://www.dagobertinvest.com/crowdfunding-sapaen-moedling                               | 2024-10-16      | subtype not confirmed in name/project statement |
| 282 | SLEVEN: Golf Chalets Lanzenkirchen                     | https://www.dagobertinvest.com/crowdfunding-sleven-lanzenkirchen                          | 2024-10-14      | subtype not confirmed in name/project statement |
| 283 | SLEVEN: Einfamilienhäuser - Neumitterndorf             | https://www.dagobertinvest.com/crowdfunding-sleven-neumitterndorf                         | 2024-10-15      | subtype not confirmed in name/project statement |
| 286 | Projektierung nahe Schönbrunn                          | https://www.dagobertinvest.com/crowdfunding-sobra-immobilien-rosenhuegelstrasse-1120-wien | 2026-07-27      | subtype not confirmed in name/project statement |
| 293 | S & B: Wohnpark Urscha                                 | https://www.dagobertinvest.com/crowdfunding-sub-immo-gleisdorf                            | 2026-08-27      | subtype not confirmed in name/project statement |
| 294 | Wohnhausanlage-Albrechtsgasse                          | https://www.dagobertinvest.com/crowdfunding-subimmo-baden                                 | 2024-10-16      | subtype not confirmed in name/project statement |
| 299 | SW: "Über der Stadt"                                   | https://www.dagobertinvest.com/crowdfunding-sw-liegenschaftsverwertung-voitsberg          | 2025-02-17      | subtype not confirmed in name/project statement |
| 301 | Bridge Finanzierung: TechWoodHomes                     | https://www.dagobertinvest.com/crowdfunding-techwoodhomes-bridge                          | 2026-05-07      | subtype not confirmed in name/project statement |
| 302 | Teichelmann-Gruppe: Köhn-Quartier, Leipzig             | https://www.dagobertinvest.com/crowdfunding-teichelmann-gruppe-leipzig                    | 2026-08-27      | subtype not confirmed in name/project statement |
| 303 | RT GRUPPE: Köhn-Quartier II, Leipzig                   | https://www.dagobertinvest.com/crowdfunding-teichelmann-leipzig-koehn-quartier-2          | 2025-07-28      | subtype not confirmed in name/project statement |
| 305 | Bridge Finanzierung: Trajkovic Investment KG - Gablitz | https://www.dagobertinvest.com/crowdfunding-trajkovic-gablitz                             | 2025-05-07      | subtype not confirmed in name/project statement |
| 325 | Telephonweg 261: Wien Donaustadt                       | https://www.dagobertinvest.com/crowdfunding-wien-donaustadt-telephonweg                   | 2026-07-02      | subtype not confirmed in name/project statement |
| 327 | WOHNPARK: Einzelhäuser Baden bei Wien                  | https://www.dagobertinvest.com/crowdfunding-wohnpark-albrechtsgasse-baden                 | 2024-10-16      | subtype not confirmed in name/project statement |
| 328 | 1220 Wien, Auspitzgasse                                | https://www.dagobertinvest.com/crowdfunding-wohnpark-aspern                               | 2024-10-16      | subtype not confirmed in name/project statement |
| 329 | Wohnpark-Baden, Melkergasse                            | https://www.dagobertinvest.com/crowdfunding-wohnpark-baden                                | 2024-07-10      | subtype not confirmed in name/project statement |
| 330 | WOHNPARK: Doppelhaus Baden bei Wien                    | https://www.dagobertinvest.com/crowdfunding-wohnpark-baden-trimplinggasse                 | 2024-07-10      | subtype not confirmed in name/project statement |
| 331 | WOHNPARK: Wohnen nahe der Seestadt                     | https://www.dagobertinvest.com/crowdfunding-wohnpark-burgkmairgasse-donaustadt            | 2024-07-10      | subtype not confirmed in name/project statement |
| 332 | Wohnpark-Staackmanngasse                               | https://www.dagobertinvest.com/crowdfunding-wohnpark-floridsdorf-staackmanngasse          | 2024-07-10      | subtype not confirmed in name/project statement |
| 333 | Wohnpark: Perchtoldsdorf bei Wien                      | https://www.dagobertinvest.com/crowdfunding-wohnpark-koloniegasse-perchtoldsdorf          | 2026-07-02      | subtype not confirmed in name/project statement |
| 334 | Wohnpark - Laxenburg                                   | https://www.dagobertinvest.com/crowdfunding-wohnpark-laxenburg                            | 2024-07-24      | subtype not confirmed in name/project statement |
| 335 | WOHNPARK: Doppel- und Reihenhaus in der Leopoldau      | https://www.dagobertinvest.com/crowdfunding-wohnpark-leopoldau-wien-floridsdorf           | 2024-07-10      | subtype not confirmed in name/project statement |
| 336 | WOHNPARK: Einfamilienhäuser - Mödling                  | https://www.dagobertinvest.com/crowdfunding-wohnpark-moedling                             | 2026-05-26      | subtype not confirmed in name/project statement |
| 337 | Perchtoldsdorf, Pfarrer Huber Gasse                    | https://www.dagobertinvest.com/crowdfunding-wohnpark-perchtoldsdorf                       | 2024-10-16      | subtype not confirmed in name/project statement |
| 338 | Wohnpark - Pfaffstätten                                | https://www.dagobertinvest.com/crowdfunding-wohnpark-pfaffstaetten                        | 2024-07-10      | subtype not confirmed in name/project statement |
| 339 | Wohnpark - Tribuswinkel 6,6%                           | https://www.dagobertinvest.com/crowdfunding-wohnpark-tribuswinkel                         | 2024-10-16      | subtype not confirmed in name/project statement |
| 340 | Wohnpark-Tribuswinkel                                  | https://www.dagobertinvest.com/crowdfunding-wohnpark-tribuswinkel-weidengasse             | 2024-07-10      | subtype not confirmed in name/project statement |
| 341 | Wohnpark, Schlachthammergasse                          | https://www.dagobertinvest.com/crowdfunding-wohnpark-wien-schlachthammerstrasse           | 2026-09-21      | subtype not confirmed in name/project statement |

###### Residential (renovation/revitalization) (55 campaigns)

| Row | Campaign                                                  | URL                                                                                                          | Sitemap lastmod | Evidence                                                                                                  |
| --- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------- | --------------------------------------------------------------------------------------------------------- |
| 13  | Adriale Holding: Revitalisierungsprojekt 1150 Wien        | https://www.dagobertinvest.com/crowdfunding-adriale-1150-to%C3%9Fgasse                                       | 2026-02-19      | "Revitalisier" (name)                                                                                     |
| 14  | ADRIALE HOLDING: Wohnhaussanierung Fasanviertel 1030 Wien | https://www.dagobertinvest.com/crowdfunding-adriale-amata-trubelgasse                                        | 2026-02-19      | "sanier" (name)                                                                                           |
| 15  | ADRIALE Holding: Wohnhaussanierung Alt-Erdberg 1030 Wien  | https://www.dagobertinvest.com/crowdfunding-adriale-porto-immo-erdbergstrasse-wien-landstrasse               | 2026-04-30      | "sanier" (name)                                                                                           |
| 16  | ADRIALE Holding: Blindpool Wien und Umgebung              | https://www.dagobertinvest.com/crowdfunding-adriale-wien-und-umgebung                                        | 2026-02-19      | "Bestand" (purpose clause)                                                                                |
| 21  | Gentzgasse 144                                            | https://www.dagobertinvest.com/crowdfunding-akprojektevienna-gentzgasse                                      | 2026-07-27      | "Dachgesch" (purpose clause)                                                                              |
| 67  | Bridge Finanzierung: Bauwerk                              | https://www.dagobertinvest.com/crowdfunding-bauwerk-tullnerbach-bridge                                       | 2026-03-10      | "bestand" (Das Projekt)                                                                                   |
| 71  | Altbausanierung in Leipzig                                | https://www.dagobertinvest.com/crowdfunding-bdre-leipzig-plagwitz                                            | 2026-10-13      | "Altbau" (name)                                                                                           |
| 104 | ENA Immobilien: Wien Penzing - Reinlgasse                 | https://www.dagobertinvest.com/crowdfunding-ena-immobilien-wien-penzing                                      | 2026-08-27      | "Sanier" (purpose clause)                                                                                 |
| 106 | ETK Projekt: Nobel Wohnen in München-Trudering            | https://www.dagobertinvest.com/crowdfunding-etk-muenchen-trudering-deikestrasse                              | 2026-04-20      | "Modernisier" (purpose clause)                                                                            |
| 107 | Bridge Finanzierung: ETK Projekt 2                        | https://www.dagobertinvest.com/crowdfunding-etk-muenchen-trudering-deikestrasse-bridge                       | 2026-03-10      | "sanier" (Das Projekt)                                                                                    |
| 116 | FX IMMO: Oberwagram St. Pölten                            | https://www.dagobertinvest.com/crowdfunding-fx-immo-hiho-sankt-poelten                                       | 2026-07-02      | "Bestand" (Das Projekt)                                                                                   |
| 128 | GS Immobilien: Jennersdorf im Dreiländereck AT            | https://www.dagobertinvest.com/crowdfunding-gs-projekt-jennersdorf                                           | 2025-12-02      | "Bestand" (Das Projekt)                                                                                   |
| 131 | Baujuwel nahe Berlin - Bestandsfinanzierung (Zero Bond)   | https://www.dagobertinvest.com/crowdfunding-haberent-poststr-luckenwalde-bestandsfinanzierung-zero-bond      | 2026-10-20      | "Bestand" (name)                                                                                          |
| 132 | Baujuwel nahe Berlin                                      | https://www.dagobertinvest.com/crowdfunding-haberent-poststrasse-luckenwalde                                 | 2025-05-12      | "denkmal" (Das Projekt)                                                                                   |
| 133 | Baujuwel nahe Berlin - Zero Bond                          | https://www.dagobertinvest.com/crowdfunding-haberent-zerobond-luckenwalde                                    | 2026-02-11      | "Revitalisier" (Vorhaben)                                                                                 |
| 143 | Bridge Finanzierung: HST 321                              | https://www.dagobertinvest.com/crowdfunding-hst-321-wien-penzing                                             | 2026-07-06      | "Sanier" (Das Projekt)                                                                                    |
| 148 | Hyperia - Minibond                                        | https://www.dagobertinvest.com/crowdfunding-hyperia-drischuetzgasse-1110-child                               | 2025-01-27      | "Bestand" (Das Projekt)                                                                                   |
| 149 | Bridge-Finanzierung: HYPERIA                              | https://www.dagobertinvest.com/crowdfunding-hyperia-drischuetzgasse-bridge                                   | 2026-03-10      | "Bestand" (Das Projekt)                                                                                   |
| 150 | Hyperia: Fenzlgasse 1150 Wien                             | https://www.dagobertinvest.com/crowdfunding-hyperia-fenzlgasse-1150-wien                                     | 2026-07-02      | "Dachgesch" (Das Projekt)                                                                                 |
| 151 | HYPERIA: Heigerleinstraße 1160 Wien                       | https://www.dagobertinvest.com/crowdfunding-hyperia-heigerleinstrasse                                        | 2026-04-29      | "Sanier" (Das Projekt)                                                                                    |
| 155 | IMMACON: Kirchstetterngasse in Wien Ottakring             | https://www.dagobertinvest.com/crowdfunding-immacon-kirchstetterngasse-ottakring                             | 2025-06-24      | "Umbau" (purpose clause)                                                                                  |
| 170 | Joe Copper's: Steiner Landstraße in Krems a. d. Donau     | https://www.dagobertinvest.com/crowdfunding-joe-coppers-stein-krems                                          | 2025-07-16      | "sanier" (Das Projekt)                                                                                    |
| 175 | KASPER IMMOBILIEN: Appartements Griesgasse, Graz          | https://www.dagobertinvest.com/crowdfunding-kasper-graz-griesgasse                                           | 2024-10-14      | "Bestand" (purpose clause)                                                                                |
| 177 | KASPER Immobilien: Bestandsoptimierung Kalvarienberg Graz | https://www.dagobertinvest.com/crowdfunding-kasper-immobilien-optimierung-kalvarienberg-graz                 | 2024-10-14      | "Bestand" (name)                                                                                          |
| 187 | Bregenz: Historische Villa in neuem Glanz                 | https://www.dagobertinvest.com/crowdfunding-leosi-roemerstrasse-bregenz                                      | 2025-11-27      | "Sanier" (Vorhaben)                                                                                       |
| 192 | ESG-Serie #Ⅰ - Ackerstraße                                | https://www.dagobertinvest.com/crowdfunding-markus-hoerning-microfunding-vogtland-ackerstrasse-zero-bond     | 2026-03-23      | page text: "Verkauf von fertig sanierten und voll vermieteten Wohnungen in historischem Mehrfamilienhaus" |
| 193 | ESG-Serie #ⅠⅠⅠ - Ackerstraße                              | https://www.dagobertinvest.com/crowdfunding-markus-hoerning-microfunding-vogtland-ackerstrasse-zero-bond-2   | 2026-09-29      | page text: "Verkauf von fertig sanierten und voll vermieteten Wohnungen in historischem Mehrfamilienhaus" |
| 194 | ESG-Serie #ⅠⅠ -Stockmannstraße                            | https://www.dagobertinvest.com/crowdfunding-markus-hoerning-microfunding-vogtland-stockmannstrasse-zero-bond | 2026-05-19      | page text: "Verkauf von fertig sanierten und voll vermieteten Wohnungen in historischem Mehrfamilienhaus" |
| 195 | Energetische Sanierung von zwei MFH                       | https://www.dagobertinvest.com/crowdfunding-markus-hoerning-revitalisierung-vogtland                         | 2026-02-16      | "Sanier" (name)                                                                                           |
| 196 | Energetische Sanierung von zwei MFH - Zero Bond           | https://www.dagobertinvest.com/crowdfunding-markus-hoerning-revitalisierung-vogtland-zero-bond               | 2026-02-24      | "Sanier" (name)                                                                                           |
| 234 | I NOCERE Immobilien: Revitalisierungen in Graz            | https://www.dagobertinvest.com/crowdfunding-nocere-revitalisierungen-graz                                    | 2026-02-19      | "Revitalisier" (name)                                                                                     |
| 235 | NOCERE Invest: Wohnungssanierungen Graz und Umgebung      | https://www.dagobertinvest.com/crowdfunding-nocere-wohnungssanierungspaket-graz                              | 2024-10-14      | "sanier" (name)                                                                                           |
| 236 | NOCERE Invest: Wohnungssanierungen Graz und Umgebung #2   | https://www.dagobertinvest.com/crowdfunding-nocere-wohnungssanierungspaket-graz-2                            | 2024-07-10      | "sanier" (name)                                                                                           |
| 237 | Revitalisierung Halle (Saale)                             | https://www.dagobertinvest.com/crowdfunding-objektgesellschaft-city-wohnen-halle-martinstra%C3%9Fe           | 2026-02-18      | "Revitalisier" (name)                                                                                     |
| 238 | Revitalisierung Halle - Zero Bond                         | https://www.dagobertinvest.com/crowdfunding-objektgesellschaft-city-wohnen-halle-martinstrasse-zero-bond     | 2026-10-01      | "Revitalisier" (name)                                                                                     |
| 242 | PALATOKA: Lizum Lodges - Axams                            | https://www.dagobertinvest.com/crowdfunding-palatoka-axams                                                   | 2025-02-18      | "Sanier" (purpose clause)                                                                                 |
| 244 | Pecado: Goldschlagstrasse 1140 Wien                       | https://www.dagobertinvest.com/crowdfunding-pecado-penzing-goldschlagstrasse                                 | 2026-07-14      | "sanier" (Das Projekt)                                                                                    |
| 248 | Reihenhäuser in Bad Vöslau bei Wien                       | https://www.dagobertinvest.com/crowdfunding-pip-badvoeslau                                                   | 2024-10-16      | "umgebaut" (Das Projekt)                                                                                  |
| 249 | Paul & Partner: Bestandsimmobilie Laa an der Thaya        | https://www.dagobertinvest.com/crowdfunding-pip-bestandsimmobilie-laa-an-der-thaya                           | 2026-04-21      | "Bestand" (name)                                                                                          |
| 276 | Bridge Finanzierung: Schwäbische Liegenschaften           | https://www.dagobertinvest.com/crowdfunding-sl-pfullingen-bridge                                             | 2026-03-10      | "Bestand" (Das Projekt)                                                                                   |
| 277 | SL: Metropolregion Stuttgart                              | https://www.dagobertinvest.com/crowdfunding-sl-reutlingen-pfullingen                                         | 2026-02-19      | "revitalisier" (Das Projekt)                                                                              |
| 278 | SL: Wirtschaftsregion Stuttgart                           | https://www.dagobertinvest.com/crowdfunding-sl-reutlingen-pfullingen2                                        | 2026-02-19      | "revitalisier" (Das Projekt)                                                                              |
| 279 | SL: Kulturdenkmal in Stuttgart-Süd                        | https://www.dagobertinvest.com/crowdfunding-sl-stuttgart-boeblinger-strasse                                  | 2026-07-20      | "denkmal" (name)                                                                                          |
| 280 | Bridge Finanzierung: Schwäbische Liegenschaften 2.0       | https://www.dagobertinvest.com/crowdfunding-sl-stuttgart-boeblingerstrasse                                   | 2025-01-22      | "sanier" (Das Projekt)                                                                                    |
| 281 | Schwäbische Liegenschaften: Stuttgart-Süd                 | https://www.dagobertinvest.com/crowdfunding-sl-stuttgart-sued                                                | 2026-02-19      | "denkmal" (Das Projekt)                                                                                   |
| 284 | Dachgeschoßausbau Sechshauser Straße                      | https://www.dagobertinvest.com/crowdfunding-sleven-sechshauserstrasse                                        | 2024-10-16      | "Dachgesch" (name)                                                                                        |
| 285 | SLEVEN: Dachgeschossausbau Heiligenstädter Straße         | https://www.dagobertinvest.com/crowdfunding-sleven-wien-heiligenstaedterstrasse                              | 2026-07-02      | "Dachgesch" (name)                                                                                        |
| 292 | Future Living - Goldenes Ottakring                        | https://www.dagobertinvest.com/crowdfunding-sthliving-herbststrasse                                          | 2025-04-08      | "Dachgesch" (Das Projekt)                                                                                 |
| 295 | SVETA GROUP: Romanogasse 1200 Wien                        | https://www.dagobertinvest.com/crowdfunding-sveta-group-1200-romanogasse                                     | 2026-05-13      | "Revitalisier" (Das Projekt)                                                                              |
| 297 | SVETA Group: Bestandsoptimierung Kleistgasse 1030 Wien    | https://www.dagobertinvest.com/crowdfunding-sveta-wien-landstrasse-kleistgasse                               | 2026-02-18      | "Bestand" (name)                                                                                          |
| 298 | SVETA Group: Castellezgasse Wien 2                        | https://www.dagobertinvest.com/crowdfunding-sveta-wien-leopoldstadt-castellezgasse                           | 2026-02-19      | "sanier" (Das Projekt)                                                                                    |
| 304 | Anlegerwohnungen in Halle, DE                             | https://www.dagobertinvest.com/crowdfunding-thalest-group-schauburg-halle                                    | 2026-06-24      | "Revitalisier" (Das Projekt)                                                                              |
| 315 | Vicit Immobilien: Wohnungssanierungen in Graz             | https://www.dagobertinvest.com/crowdfunding-vicit-immobilien-graz                                            | 2026-07-29      | "sanier" (name)                                                                                           |
| 316 | W&L: Sanierungen Rhein-Ruhr                               | https://www.dagobertinvest.com/crowdfunding-w&l-rhein-ruhr                                                   | 2026-02-19      | "Sanier" (name)                                                                                           |
| 317 | Bridge Finanzierung: W&L                                  | https://www.dagobertinvest.com/crowdfunding-w&l-rhein-ruhr-bridge                                            | 2024-12-04      | "sanier" (Das Projekt)                                                                                    |

###### Residential (renovation + new-build) (21 campaigns)

| Row | Campaign                                          | URL                                                                          | Sitemap lastmod | Evidence                                                 |
| --- | ------------------------------------------------- | ---------------------------------------------------------------------------- | --------------- | -------------------------------------------------------- |
| 8   | FX-IMMO: Gedersdorf bei Krems                     | https://www.dagobertinvest.com/crowdfunding-FXimmo-Gedersdorf                | 2026-02-19      | "bestand" (Das Projekt), "Neubau" (Das Projekt)          |
| 9   | MaxximmoM: Eislingen Metropolregion Stuttgart     | https://www.dagobertinvest.com/crowdfunding-MaxximmoM-eislingen              | 2026-03-24      | "bestand" (Das Projekt), "erricht" (Das Projekt)         |
| 19  | Ziegelofengasse 25                                | https://www.dagobertinvest.com/crowdfunding-akprojekte-ziegelofengasse       | 2024-07-10      | "Dachgesch" (purpose clause), "Erricht" (purpose clause) |
| 22  | Kaiserstraße 34                                   | https://www.dagobertinvest.com/crowdfunding-akprojektevienna-kaiserstrasse   | 2026-07-27      | "Dachgesch" (purpose clause), "Erricht" (purpose clause) |
| 25  | ALPHA CENTER - Villa zum Weinberg                 | https://www.dagobertinvest.com/crowdfunding-alc-badvoeslau                   | 2026-09-21      | "sanier" (purpose clause), "Erricht" (purpose clause)    |
| 54  | AVENTA: Dr. Karl Renner-Platz                     | https://www.dagobertinvest.com/crowdfunding-aventa-traiskirchen              | 2026-08-25      | "bestand" (Das Projekt), "erricht" (Das Projekt)         |
| 55  | Bridge Finanzierung: AVENTA                       | https://www.dagobertinvest.com/crowdfunding-aventa-traiskirchen-bridge       | 2026-06-02      | "bestand" (Das Projekt), "erricht" (Das Projekt)         |
| 101 | EFFECTUS: Elisabethallee - Wien Hietzing          | https://www.dagobertinvest.com/crowdfunding-effectus-hietzing                | 2025-06-25      | "bestand" (Das Projekt), "Bauvorhaben" (purpose clause)  |
| 105 | Leebgasse 38                                      | https://www.dagobertinvest.com/crowdfunding-erebos-leebgasse                 | 2025-04-30      | "sanier" (purpose clause), "Erricht" (purpose clause)    |
| 110 | Exakt Real: Lichtenwörth bei Wiener Neustadt      | https://www.dagobertinvest.com/crowdfunding-exakt-holding-lichtenwoerth      | 2026-07-02      | "Umbau" (Das Projekt), "Erricht" (Das Projekt)           |
| 129 | Gupympka: Leobersdorf bei Wiener Neustadt         | https://www.dagobertinvest.com/crowdfunding-gupympka-leobersdorf             | 2026-07-29      | "bestand" (Das Projekt), "erricht" (Das Projekt)         |
| 130 | Gupympka - Minibond                               | https://www.dagobertinvest.com/crowdfunding-gupympka-leobersdorf-child       | 2026-07-29      | "bestand" (Das Projekt), "erricht" (Das Projekt)         |
| 147 | Hyperia: Drischützgasse 1110 Wien                 | https://www.dagobertinvest.com/crowdfunding-hyperia-drischuetzgasse-1110     | 2026-07-02      | "Bestand" (Das Projekt), "Neubau" (Das Projekt)          |
| 179 | Bridge Finanzierung: Lehner&Trompeter             | https://www.dagobertinvest.com/crowdfunding-l&t-voesendorf-bridge            | 2026-03-10      | "bestand" (Das Projekt), "entsteh" (Das Projekt)         |
| 191 | M-Group: Kalkstein Residenzen St. Johann in Tirol | https://www.dagobertinvest.com/crowdfunding-m-group-st-johann-in-tirol       | 2026-05-08      | "Bestand" (Das Projekt), "Erricht" (Das Projekt)         |
| 221 | MUST-GROUP: Gärtnerstraße in Salzburg             | https://www.dagobertinvest.com/crowdfunding-must-salzburg-gaertnerstrasse    | 2026-10-21      | "bestand" (Das Projekt), "Erricht" (Das Projekt)         |
| 252 | Wohnhausanlage Stockerau                          | https://www.dagobertinvest.com/crowdfunding-pip-stockerau                    | 2024-10-14      | "Dachgesch" (Das Projekt), "erricht" (Das Projekt)       |
| 269 | RE-QUADR.AT: Elixhausen - Am Auwald               | https://www.dagobertinvest.com/crowdfunding-requadrat-elixhausen             | 2026-07-29      | "bestand" (Das Projekt), "erricht" (Das Projekt)         |
| 296 | SVETA GROUP: Koppstraße 1160 Wien                 | https://www.dagobertinvest.com/crowdfunding-sveta-koppstrasse-wien-ottakring | 2026-02-19      | "Sanier" (purpose clause), "Erricht" (purpose clause)    |
| 308 | TwoHands Immobilien: München Obermenzing          | https://www.dagobertinvest.com/crowdfunding-two-hands-muenchen-obermenzing   | 2025-02-17      | "sanier" (Das Projekt), "Neubau" (purpose clause)        |
| 326 | PILLERGASSE 13: Leben in Wien 15                  | https://www.dagobertinvest.com/crowdfunding-wien15-pillergasse               | 2026-07-26      | "Dachgesch" (purpose clause), "Erricht" (purpose clause) |

###### Residential (holiday apartments) (3 campaigns)

| Row | Campaign                                              | URL                                                                   | Sitemap lastmod | Evidence                                                                                           |
| --- | ----------------------------------------------------- | --------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------- |
| 203 | MGI AG: Appartements bei Chur im Schweizer Graubünden | https://www.dagobertinvest.com/crowdfunding-mgi-ag-schweiz-churwalden | 2025-07-15      | project description: "Appartementanlage mit 11 Ferienwohnungen"                                    |
| 204 | M-Group: Fulpmes nahe Innsbruck                       | https://www.dagobertinvest.com/crowdfunding-mgroup-fulpmes            | 2026-06-29      | project description: "Hotel Königsblick wird in eine Apartmentanlage mit Ferienwohnungen umgebaut" |
| 205 | M-Group - Minibond                                    | https://www.dagobertinvest.com/crowdfunding-mgroup-fulpmes-child      | 2025-07-07      | same project as crowdfunding-mgroup-fulpmes                                                        |

###### Mixed-use (residential + commercial elements) (19 campaigns)

| Row | Campaign                                             | URL                                                                                              | Sitemap lastmod | Evidence                                                                                       |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------- | ---------------------------------------------------------------------------------------------- |
| 49  | AVENTA: Wohnanlage Hartberg                          | https://www.dagobertinvest.com/crowdfunding-aventa-hartberg                                      | 2026-07-14      | "erricht" (Das Projekt); commercial: "Gewerbe" (Das Projekt)                                   |
| 50  | Aventa - Minibond                                    | https://www.dagobertinvest.com/crowdfunding-aventa-hartberg-child                                | 2026-07-14      | "erricht" (Das Projekt); commercial: "Gewerbe" (Das Projekt)                                   |
| 97  | E.A. Property: Stuttgart - Sindelfingen              | https://www.dagobertinvest.com/crowdfunding-eaproperty-sindelfingen                              | 2026-03-24      | "bestand" (Das Projekt), "Bauvorhaben" (Das Projekt); commercial: "Büro" (Das Projekt)         |
| 98  | Bridge Finanzierung: E.A. Property Investments       | https://www.dagobertinvest.com/crowdfunding-eaproperty-sindelfingen-bridge                       | 2024-07-11      | "bestand" (Das Projekt), "Bauvorhaben" (Das Projekt); commercial: "Büro" (Das Projekt)         |
| 99  | Wohnhausanlage L24                                   | https://www.dagobertinvest.com/crowdfunding-ecoliving-tulln-an-der-donau                         | 2024-11-11      | subtype not confirmed in name/project statement; commercial: "Geschäftslokal" (purpose clause) |
| 108 | EXAKT REAL: Hirschstettner Straße 79 Wien Donaustadt | https://www.dagobertinvest.com/crowdfunding-exakt-holding-hirschstettner-strasse-wien-donaustadt | 2026-07-02      | subtype not confirmed in name/project statement; commercial: "Geschäftslokal" (Das Projekt)    |
| 115 | FX IMMO: Erlaufpark Wieselburg                       | https://www.dagobertinvest.com/crowdfunding-fx-data-erlaufpark-wieselburg                        | 2026-07-02      | "entsteh" (Das Projekt); commercial: "Geschäftslokal" (Das Projekt)                            |
| 123 | GLD: Weingartenstraße Dortmund                       | https://www.dagobertinvest.com/crowdfunding-gld-dortmund-hoerde                                  | 2026-02-19      | "erricht" (Das Projekt); commercial: "Büro" (Das Projekt)                                      |
| 190 | M-Group: Apartmentanlage Fiss in Tirol AT            | https://www.dagobertinvest.com/crowdfunding-m-group-fiss                                         | 2026-08-25      | "erricht" (Das Projekt); commercial: "Restaurant" (Das Projekt)                                |
| 199 | Bridge Finanzierung: Melinz                          | https://www.dagobertinvest.com/crowdfunding-melinz-bridge                                        | 2025-01-16      | subtype not confirmed in name/project statement; commercial: "Gewerbe" (Das Projekt)           |
| 209 | ML Bau: Anton-Baumgartner-Straße 1230 Wien           | https://www.dagobertinvest.com/crowdfunding-ml-bau-anton-baumgartner-strasse-wien-1230           | 2026-06-03      | subtype not confirmed in name/project statement; commercial: "Büro" (Das Projekt)              |
| 210 | ML BAU: Anton-Baumgartner-Straße 1230 Wien           | https://www.dagobertinvest.com/crowdfunding-ml-bau-anton-baumgartner-strasse-wien-23             | 2026-06-03      | subtype not confirmed in name/project statement; commercial: "Büro" (Das Projekt)              |
| 218 | MUST-GROUP: Bad Reichenhall                          | https://www.dagobertinvest.com/crowdfunding-must-bad-reichenhall                                 | 2026-08-18      | "Neubau" (Das Projekt); commercial: "Gewerbe" (Das Projekt)                                    |
| 222 | MUST-GROUP: Wohlfühlzuhause Salzburg Maxglan         | https://www.dagobertinvest.com/crowdfunding-must-salzburg-maxglan                                | 2026-10-21      | "entsteh" (Das Projekt); commercial: "Büro" (Das Projekt)                                      |
| 243 | PECADO: Brünner Straße 1210 Wien                     | https://www.dagobertinvest.com/crowdfunding-pecado-floridsdorf-bruenner-strasse                  | 2026-03-23      | "Dachgesch" (Das Projekt), "entsteh" (Das Projekt); commercial: "Geschäftslokal" (Das Projekt) |
| 319 | WertSecure: Vöcklabruck zw. Linz und Salzburg        | https://www.dagobertinvest.com/crowdfunding-wertsecure-voecklabruck                              | 2026-08-27      | "Bestand" (Das Projekt), "entsteh" (Das Projekt); commercial: "Gewerbe" (Das Projekt)          |
| 320 | Bridge Finanzierung: WertSecure                      | https://www.dagobertinvest.com/crowdfunding-wertsecure-voecklabruck-bridge                       | 2026-03-10      | "Bestand" (Das Projekt), "entsteh" (Das Projekt); commercial: "Gewerbe" (Das Projekt)          |
| 321 | WertSecure - Minibond                                | https://www.dagobertinvest.com/crowdfunding-wertsecure-voecklabruck-child                        | 2025-07-02      | "Bestand" (Das Projekt), "entsteh" (Das Projekt); commercial: "Gewerbe" (Das Projekt)          |
| 347 | SLM - Schiefling am See 6,95%                        | https://www.dagobertinvest.com/crowdinvesting-schiefling-am-see                                  | 2024-10-16      | subtype not confirmed in name/project statement; commercial: "Gastronomie" (Das Projekt)       |

##### Hotels, hospitality and tourism (6 campaigns)

Rows 312, 345 and 346 finance the same hotel project (Haberent Hotel Vierseithof) in separate campaigns.

| Row | Campaign                              | URL                                                                                | Sitemap lastmod | Evidence                                                                                                                    |
| --- | ------------------------------------- | ---------------------------------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 72  | Hoteltransformation Zürich            | https://www.dagobertinvest.com/crowdfunding-belair-hotel-wallisellen-ch            | 2026-04-28      | "Mittelverwendung: Sanierung des Anbaus und Umbau zu 12 Serviced Apartments" (page); secured loan, borrower Hotel Belair AG |
| 258 | Puitalm: Natur Aparthotel im Pitztal  | https://www.dagobertinvest.com/crowdfunding-puitalm-pitztal                        | 2024-10-14      | loan finances part of the "Liegenschaftsankauf" (property purchase); 25-unit aparthotel new-build (page)                    |
| 312 | Hotel-Upgrade nahe Berlin             | https://www.dagobertinvest.com/crowdfunding-unternehmen-haberent-hotel-vierseithof | 2026-03-17      | Typus "Projektfinanzierung" (page); renovation and modernization of Hotel Vierseithof                                       |
| 314 | Das Kronenhaus                        | https://www.dagobertinvest.com/crowdfunding-vestwerk-mariahilfer-strasse           | 2026-08-27      | bridge loan funds "Vorbereitungsarbeiten" for conversion of the Kronenhaus into a 114-room hotel (page)                     |
| 345 | Vierseithof - Zero Bond II            | https://www.dagobertinvest.com/crowdfunding-zerobond-II-haberent-hotel-vierseithof | 2026-04-21      | Typus "Projektfinanzierung" (page); bridge financing of remaining renovation works, Hotel Vierseithof                       |
| 346 | Hotel-Upgrade nahe Berlin - Zero Bond | https://www.dagobertinvest.com/crowdfunding-zerobond-haberent-hotel-vierseithof    | 2025-09-20      | Typus "Projektfinanzierung" (page); bridge financing of remaining renovation works, Hotel Vierseithof                       |

##### Energy and utilities (1 campaign)

| Row | Campaign                                     | URL                                                              | Sitemap lastmod | Evidence                    |
| --- | -------------------------------------------- | ---------------------------------------------------------------- | --------------- | --------------------------- |
| 41  | AustriaEnergy: Windpark in Patagonien, Chile | https://www.dagobertinvest.com/crowdfunding-austria-energy-chile | 2026-10-08      | "Windpark" in campaign text |

##### Health (Healthcare), wellness and medtech (1 campaign)

Financing type is Corporate, not Property project: the bond is a participation in all current and future investments of Arcarius Solutions GmbH (page: "Typus Unternehmensfinanzierung / unternehmerische Beteiligung").

| Row | Campaign                             | URL                                                                 | Sitemap lastmod | Evidence                                                                                                    |
| --- | ------------------------------------ | ------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------- |
| 36  | Arcarius - Exklusive Vermögensanlage | https://www.dagobertinvest.com/crowdfunding-arcarius-solutions-bond | 2026-07-02      | Typus Unternehmensfinanzierung / unternehmerische Beteiligung; longevity therapies and products (page text) |

##### Unclear from available evidence (4 rows, status not industry)

No campaign page could be read for these rows, so neither industry nor financing type is assigned. The URL slugs alone are not used as evidence.

| Row | URL                                                                         | Sitemap lastmod | Page status 2026-10-30                 | Note                                                                                                                                |
| --- | --------------------------------------------------------------------------- | --------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | https://www.dagobertinvest.com/#crowdfunding-bauwerte-rosenheim             | 2024-10-14      | homepage fragment (no standalone page) | homepage fragment "#crowdfunding-bauwerte-rosenheim"; standalone page /crowdfunding-bauwerte-rosenheim returns 404 as of 2026-10-30 |
| 2   | https://www.dagobertinvest.com/#crowdfunding-ime-wiener-neudorf             | 2026-03-10      | homepage fragment (no standalone page) | homepage fragment "#crowdfunding-ime-wiener-neudorf"; standalone page /crowdfunding-ime-wiener-neudorf returns 404 as of 2026-10-30 |
| 87  | https://www.dagobertinvest.com/crowdfunding-dagobertinvest-goes-germany     | 2024-03-15      | 404 not found                          | page not found (404) as of 2026-10-30                                                                                               |
| 88  | https://www.dagobertinvest.com/crowdfunding-dagobertinvest-goes-switzerland | 2022-11-09      | 404 not found                          | page not found (404) as of 2026-10-30                                                                                               |

#### 7. Not in the counts

Row 5 (https://www.dagobertinvest.com/bautraeger-old, lastmod 2021-10-11) is the live legacy issuer/marketing page "Für Immobilien Entwickler (legacy issuer marketing page)", not a campaign. It is preserved in the input list but excluded from every count and left unclassified.
