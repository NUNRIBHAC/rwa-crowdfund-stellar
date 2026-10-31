# Full supplied campaign lists by project type - all sites (cumulative, started 2026-10-30)

This file gathers the per-site campaign classifications in one place and grows cumulatively: each new site is appended as a new numbered site section. Each site section embeds the full text of that site's standalone report (headings nested under the site heading, otherwise unchanged). The standalone per-site files in this folder stay unchanged and remain the per-site source of truth.

## Site index

| Site   | Platform                            | Standalone report                                                                          | Companion CSV                                                                                | Input entries                                                                                                       | Added      |
| ------ | ----------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------- |
| Site 1 | CONDA (conda-capital.com)           | [conda-full-list-by-project-type.md](conda-full-list-by-project-type.md)                   | [conda-full-list-by-project-type.csv](conda-full-list-by-project-type.csv)                   | 271 entries (270 numbered rows incl. row 378 without URL, plus 1 unnumbered orphan; 270 URLs), 248 unique offerings | 2026-10-30 |
| Site 2 | dagobertinvest (dagobertinvest.com) | [dagobertinvest-full-list-by-project-type.md](dagobertinvest-full-list-by-project-type.md) | [dagobertinvest-full-list-by-project-type.csv](dagobertinvest-full-list-by-project-type.csv) | 347 URL entries (342 campaigns, 4 unresolved rows, 1 legacy page)                                                   | 2026-10-30 |
| Site 3 | Invesdor (invesdor.com)             | [invesdor-full-list-by-project-type.md](invesdor-full-list-by-project-type.md)             | [invesdor-full-list-by-project-type.csv](invesdor-full-list-by-project-type.csv)             | 152 entries (11 numbered pages: 2 thematic + 9 success stories; 141 round URLs, 125 distinct issuers)               | 2026-10-31 |

## How to add a new site

1. Create the standalone report `docs/<site>-full-list-by-project-type.md` (and its `.csv` companion) from that site's supplied list.
2. Add a row to the site index above with the next site number.
3. Append a new `## Site N: <platform>` section at the end of this file. Embed the full report text with every heading shifted two levels deeper (so the report's `#` title becomes `###`), preceded by a one-line note that the section's row IDs are the site's own numbering.
4. Do not rewrite earlier site sections when adding a new one, and do not add cross-site totals (see the conventions below).

## Conventions across sites

- Shared axes: every site report uses the same classification axes - the unified instrument categories (participation 1-4; loan and bond, each with senior / subordinated / unspecified states; zero-coupon and convertible as structure overlays; junior / qualified / Mini Bond as site labels; bridge financing as a role overlay), the project/financing type, the property type inside real estate, and the industry category.
- Row IDs are per-site: each report numbers its own supplied input rows, so the same number can appear under several sites. In cross-site context cite them with the site prefix: S1-394 (CONDA), S2-41 (dagobertinvest), S3-R012 (Invesdor).
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
| 430 | tip me - Trinkgeld direkt an Näher\*innen           | tip me Global GmbH                           | -                       | page text                      |                                                                    |
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

## Site 3: Invesdor (invesdor.com)

Standalone report: [invesdor-full-list-by-project-type.md](invesdor-full-list-by-project-type.md) (unchanged). The row IDs below are Invesdor's own numbering (labels 6-15 for the numbered entries, R001-R141 for the rounds) - cite them as S3-<id> in cross-site context. The full report text follows.

### Invesdor full supplied list by project type (2026-10-31)

This file classifies the full Invesdor list the user supplied on WhatsApp on 2026-10-31 (00:35 WET). It mirrors the structure of `conda-full-list-by-project-type.md`. Companion CSV with one row per input entry and per-row evidence: `invesdor-full-list-by-project-type.csv`. The companion `invesdor-sitemap.md` holds the 50 official XML sitemap URLs plus a separate user-supplied section listing these same 141 round URLs (user-supplied, not discovered in the XML sitemap).

The instrument hierarchy, financing types, property types, the 17 industry categories plus "Unclear from available evidence", the structure overlays and the rank/label qualifiers below use the wording the user supplied in the same WhatsApp message. They are an analyst grouping made for this document. They are not Invesdor's own taxonomy; Invesdor's own product tag and "Type" field are kept in their own columns in the CSV.

#### 1. Input entries, URLs and offerings

| Item                                                                                                                |          Count |
| ------------------------------------------------------------------------------------------------------------------- | -------------: |
| Numbered entries supplied (labels 6, 7, then 7-15; the label 7 appears twice, kept as "7 (first)" and "7 (second)") |             11 |
| - of those: thematic marketing pages (`/invest-in-companies/...`)                                                   |              2 |
| - of those: success-story pages (`/success-stories/...`)                                                            |              9 |
| Unnumbered round URLs supplied (`/rounds/<uuid>`), labelled R001-R141 in supplied order                             |            141 |
| Total entries / total URLs                                                                                          |      152 / 152 |
| Distinct round URLs (no duplicates among the 141)                                                                   |            141 |
| Round pages live / round page returning a 404 error page                                                            | 140 / 1 (R139) |
| Distinct issuers across the 141 rounds (each round is a separate offering; repeat issuers counted once)             |            125 |

The supplied number 7 appears twice: `7. https://www.invesdor.com/invest-in-companies/fixedincome` and `7. https://www.invesdor.com/success-stories/neoh`. Both are kept, in supplied order, and nothing was renumbered. The 141 round URLs arrived unnumbered; R-numbers are analysis IDs assigned in supplied order, not user labels. All 152 URLs were fetched live on 2026-10-31 (00:37-00:38 WET). One round page (R139, `https://www.invesdor.com/rounds/47efa3c1-a425-41d9-91b5-9f78406f58be`) renders the site's 404 error page; see section 3.

#### 2. Entry types: thematic pages and success stories are not rounds

Eleven numbered entries are platform marketing pages, not investment offerings. They are classified here by page role, not by the instrument taxonomy. Figures below are quoted as claims printed on each page, not verified facts.

##### Thematic marketing pages (2 entries)

| Label     | URL                                                      | What the page is                                                                                                                                                                                 | Cross-references in the supplied round list                                                                        |
| --------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| 6         | https://www.invesdor.com/invest-in-companies/medtech     | "Investing in MedTech" thematic page: reasons to invest in medical technology; showcases funded MedTech companies                                                                                | Names Koite Health (round R012), Monidor (R014), Aplagon (R027) as examples of funded MedTech projects             |
| 7 (first) | https://www.invesdor.com/invest-in-companies/fixedincome | "Exclusive options for fixed income investments" thematic page: advertises "annual interest rates up to 10%", due-diligence claims, ECSP licence mention; showcases fixed-income success stories | No supplied round URL is a fixed-income (debt) round; the page links to success stories such as Evobeam (entry 15) |

##### Success-story pages (9 entries)

| Label      | URL                                                      | Subject                                         | Key claims printed on the page                                                                                                           | Instrument signal on the page                                                                        | Cross-references                                |
| ---------- | -------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 7 (second) | https://www.invesdor.com/success-stories/neoh            | NEOH (Alpha Republic GmbH), sugar-free snacking | > EUR 1,613,559 invested; 3 successful rounds; > 380 investors                                                                           | None stated on the page; the supplied NEOH rounds (R023, R026) are share offerings of NEOH Invest AG | R023, R026                                      |
| 8          | https://www.invesdor.com/success-stories/easyapotheke    | easyApotheke AG, pharmacy concept               | > EUR 750,000 invested; 21 hours to full funding; > 314 investors; 3.5% interest rate                                                    | Interest rate stated - debt funding                                                                  | none supplied                                   |
| 9          | https://www.invesdor.com/success-stories/falkensteiner   | Falkensteiner Hotels & Residences               | > EUR 27,000,000 invested; 7 rounds; > 3,100 investors; > EUR 2,250,000 interest paid                                                    | Interest paid stated - debt funding                                                                  | none supplied                                   |
| 10         | https://www.invesdor.com/success-stories/biogena         | Biogena Group, micronutrient supplements        | > EUR 12,000,000 invested; 13 successful rounds; 9 fully paid back fundings; ~ 1,500 investors                                           | "Fully paid back" stated - debt funding                                                              | none supplied                                   |
| 11         | https://www.invesdor.com/success-stories/cityvarasto     | Cityvarasto, self-storage                       | EUR 128 million market capitalization; 425% return on investment; EUR 24.4 million company valuation; "now listed on the stock exchange" | Listing / share value - equity                                                                       | R138 (supplied Cityvarasto pre-IPO share issue) |
| 12         | https://www.invesdor.com/success-stories/friendsandbrgrs | Friends & BRGRS, burger chain                   | > EUR 980,000 invested; 1 successful round; 583 investors; 22.5% return                                                                  | None stated; the supplied round R114 is a share offering                                             | R114                                            |
| 13         | https://www.invesdor.com/success-stories/heeros          | Heeros, financial-administration software       | > EUR 4,125,000 raised; 2 rounds; > 917 investors; 15% return within 12 months; "Europe's first crowd-funded IPO"                        | IPO - equity                                                                                         | R116, R131                                      |
| 14         | https://www.invesdor.com/success-stories/losteria        | L'Osteria, restaurant franchise                 | > EUR 3,071,800 raised; 3 rounds; > 1,686 investors; up to 6.25% interest rate p.a.                                                      | Interest rate stated - debt funding                                                                  | none supplied                                   |
| 15         | https://www.invesdor.com/success-stories/evobeam         | Evobeam GmbH, specialised metal parts           | EUR 1,000,000 raised; > EUR 53,000 interest paid out; > 673 investors; 1 h 37 min to raise EUR 1 million                                 | Interest paid stated - debt funding                                                                  | none supplied                                   |

Reading: five of the nine success stories describe interest-bearing (debt) fundings, and entry 7 (first) is a fixed-income marketing page. None of the 141 supplied round URLs is a debt round - the supplied round list covers share offerings only. Debt categories 5 and 6 therefore have zero rows in this dataset even though debt fundings exist on the platform.

#### 3. Instrument categories

The instrument label comes from each round page's "Type" field ("Equity offering" on 139 of 141 pages), the share fields on the page (price per share, equity offered, number of shares), and the embedded page config (`fundingType: "equity"`, `isConvertible: false`, `interestRate: 0`, `duration: 0` on every page where the config is present). It is not a verified legal form (see section 5). The labels are filed into the unified instrument categories the user supplied on WhatsApp on 2026-10-31:

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

Mapping of the instrument labels (141 round pages):

| Instrument label (from page "Type" field and share fields)                                                          | Rows    | Category | State / structure |
| ------------------------------------------------------------------------------------------------------------------- | ------- | -------- | ----------------- |
| Share ("Equity offering" on 139 pages; share fields on thin page R022; embedded config on 404 page R139, tentative) | 141     | 2 Share  | -                 |
| **Total**                                                                                                           | **141** |          |                   |

- 1. Participation right / certificate - 0 rows. The phrase "participation right" appears in the risks section of R002 (Beets & Roots) about an existing third-party participation right being restructured, and in R023 (NEOH) describing shareholders' participation rights; neither describes the offered instrument.
  - 1a. Substanzgenussrecht subtype - 0 rows
- 2. Share - 141 rows: R001-R141 (R139 tentative; its public page renders a 404 error and the label rests on the embedded page config, which identifies the round as "Amalias Limonadfabrik Ab", equity, EUR 20.00 per share)
- 3. Indirect participation - 1 row as an ownership structure, not an instrument: R034 (Nukute). The page states: "This funding round uses a holding company structure for investors which means that the investors won't hold shares directly in Nukute Oy." Investors buy shares of Invesdor Services SPV 1 Oy.
- 4. Limited partnership interest - 0 rows
- 5. Loan - 0 rows (no seniority states present)
- 6. Bond - 0 rows (no seniority states present)
- Structure overlays: zero-coupon 0 rows; convertible 0 rows. "Convertible" appears on 18 pages, always about previous or possible future convertible loans/bonds of the issuer, never as the offered instrument; the embedded config has `isConvertible: false` on every page.
- Rank/label qualifiers: "junior" 0 rows (3 pages use the word for junior sports clubs or junior stock markets, not instrument rank); "qualified" 0 rows; "Mini Bond" 0 rows.
- "Subordinated", "silent partnership", "profit participation" and "mezzanine" appear on 0 pages.
- IPO/listing note: six supplied rounds are share issues tied to a listing (R075 Enersense and R116 Heeros on Nasdaq First North, R080 Dr Sannas and R085 Seafire on NGM Nordic MTF, R136 Ahola Transport on Aktietorget, R138 Cityvarasto broadening its shareholder base before a planned First North listing; R075 also lists prospectus materials). Per the taxonomy, a listing or capital increase is an action on shares, not a separate instrument; these stay category 2 with a note.

##### New-category check (the user asked whether new categories are needed)

No new instrument category is required by the evidence: every supplied round is a share offering and files into category 2, with one indirect-participation ownership structure (R034) already covered by the taxonomy's own note on category 3. Debt categories 5/6 exist but have no supplied rows; the platform's debt business is visible only in the marketing pages (entries 7 (first), 8, 9, 10, 14, 15).

#### 4. Repeat issuers, translations and page state

Repeat issuers (13 issuers raised more than one round; every round is a separate offering with its own round ID, campaign and raised amount, and stays its own row. The 125 below counts distinct issuers, not offerings):

| Issuer              | Rows             |
| ------------------- | ---------------- |
| Beets & Roots GmbH  | R002, R008, R011 |
| Oy Slurp Ab         | R017, R025       |
| NEOH Invest AG      | R023, R026       |
| Papu Design         | R043, R140       |
| Yepzon Oy           | R068, R088       |
| Wello Oy            | R051, R079       |
| Ägräs Distillery Oy | R099, R130       |
| Helsinki Allas Oy   | R113, R132       |
| Heeros Systems Oy   | R116, R131       |
| Oceanvolt Oy        | R019, R032, R047 |
| Askel Healthcare Oy | R013, R040, R090 |
| Yeply Oy            | R042, R061       |
| WordDive Group Oy   | R024, R110       |

Translation-like pairs: R011 carries a German round title for the same Beets & Roots concept as R002/R008, and R023 a German title for NEOH (R026 English). Unlike the CONDA dataset, no page-exposed asset ID confirms same-offering translations, so all four rows stay distinct offerings.

Login-walled pages (7): R075, R080, R085, R116, R125, R134 and R136 show only the header and "content is only visible to authenticated investors" notices. They are classified on the page title plus the source named in their Basis column (the issuer's own site or press release for R075/R080/R085, a supplied sibling round for R116, the title alone for R125/R134/R136).

#### 5. Method and limits

- Each page was read live on 2026-10-31 (00:37-00:38 WET) as server-rendered HTML; the CSV `evidence` column quotes the first ~200 characters of the pitch text the classification rests on.
- `site_type_field` is Invesdor's own "Type" label; `config_funding_type`, and the zero interest/duration values, come from the page's embedded config and were used as a machine cross-check. `site_product_tag` ("Corporate Equity", shown on 18 newer pages only) and the country flag (shown on 16 pages only) are Invesdor's own labels, kept in the CSV, not used as the industry.
- The instrument label is the site's own wording, not a verified legal form. Share classes, voting rights and subscription terms were not read; documents behind login were not accessed.
- `basis` shows how solid each row is: "page text" = pitch text read; "page text (thin page)" = R022, short page but with price-per-share and equity fields; "title only (content login-walled)"; "title + external source" (external URL in Notes); "title + cross-reference" (R116, grounded on supplied sibling R131); "embedded page config only" (R139).
- Industry says what the issuer's business does. It says nothing about use of proceeds (section 6). Several rows are judgment calls (technology suppliers to a sector, platform businesses, holdings); the reasoning is in each row's Notes.
- The supplied list is not a crawl of invesdor.com: it covers only the supplied URLs.

#### 6. Project/financing type and property type

Three separate fields, as the user asked. Industry (sections 7 and 8) says what the issuer does. Project/financing type says what kind of financing the entry is. Property type applies only to real estate.

> **Provisional.** The financing type below is based on the issuer, not on a verified use of proceeds. "Corporate" does not mean the financing purpose was confirmed as corporate.

| Project/financing type (issuer-based, provisional)                         |                                                                              Rows (141 round URLs) |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------: |
| Corporate (issuer-based, provisional; use of proceeds not verified)        |                                                                                                139 |
| Property project (tentative, unverified)                                   |                                                                                     2 (R113, R132) |
| Project financing (asset-specific, energy infrastructure; not real estate) | none confirmed (energy rows are technology companies or project developers raising company equity) |
| Unclear from available evidence                                            |                                                                                                  0 |
| **Total**                                                                  |                                                                                            **141** |

R132 (Helsinki Pool) describes a confirmed building permit and the development of a floating sea-pool complex; R113 (Allas Sea Pool, same issuer) states that construction of the main building is next. Both are filed as tentative property projects because the use of proceeds was not verified against the issue terms. Energy project developers (R051/R079 Wello, R077 Seabased, R108 Greenstat, R112 Kitemill) raise company equity for technology development, not a specific asset financing, on the page text.

##### Real estate

| Property type (rows with property character)              | Rows                                                              |
| --------------------------------------------------------- | ----------------------------------------------------------------- |
| Residential (all subtypes)                                | 0                                                                 |
| Commercial/office                                         | 0                                                                 |
| Mixed-use (residential + commercial elements)             | 0                                                                 |
| Other property types - self-storage                       | 2 (R124 Mini-Holding / Minilaod, R138 Cityvarasto)                |
| Other property types - sea pool / spa complex (tentative) | 2 (R113, R132; industry filed as Hotels, hospitality and tourism) |
| Not determined                                            | 0                                                                 |

Self-storage operators are filed under Real estate as a judgment call (self-storage is property-based); both are corporate share issues of the operating/holding company, not verified property financings. R020 VALO (hotel + workspace in one building) and R120 HUONE (meeting spaces) are filed by what they operate, under Hotels, hospitality and tourism, financing type corporate.

#### 7. Counts by industry category

| Industry category                                      | Rows    | Distinct issuers |
| ------------------------------------------------------ | ------- | ---------------- |
| Food and beverage products                             | 9       | 7                |
| Information Technology, software and digital platforms | 20      | 18               |
| Energy and utilities                                   | 11      | 10               |
| Hotels, hospitality and tourism                        | 4       | 3                |
| E-bikes and light mobility                             | 3       | 2                |
| Brewery, wine and spirits                              | 4       | 3                |
| Consumer products, fashion, apparel and retail         | 16      | 15               |
| Sports, leisure and entertainment                      | 12      | 12               |
| Health (Healthcare), wellness and medtech              | 23      | 21               |
| Industrial technology and manufacturing                | 11      | 9                |
| Restaurants and gastronomy                             | 6       | 4                |
| Agriculture, environment and recycling                 | 4       | 4                |
| Building products and prefab housing                   | 1       | 1                |
| Financial services and investment vehicles             | 7       | 7                |
| Education and aviation training                        | 6       | 5                |
| Transport and logistics                                | 2       | 2                |
| Real estate                                            | 2       | 2                |
| **Total**                                              | **141** | **125**          |

The 11 numbered entries (section 2) are outside these counts; they are marketing pages, not offerings.

#### 8. Rounds by category

Every row below has financing type "Corporate (issuer-based, provisional; use of proceeds not verified)" except R113 and R132 (tentative property projects, section 6).

##### Food and beverage products (9 rows)

| IDs  | Round                                                                                                        | Issuer                   | Invested shown       | Basis                                        | Notes                                                                                                                                                |
| ---- | ------------------------------------------------------------------------------------------------------------ | ------------------------ | -------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| R017 | The game-changing coffee platform                                                                            | Oy Slurp Ab              | €176,530             | page text                                    | Coffee subscription platform. Round 1 of 2 supplied (R017, R025; identical round titles, separate pages)                                             |
| R023 | NEOH - Das neue Naschen: 100 % Geschmack ZERO sugar added                                                    | NEOH Invest AG           | €940,851             | page text                                    | Sugar-free snack brand via NEOH Invest AG; German-language title. Round 1 of 2 supplied (R023, R026)                                                 |
| R025 | The game-changing coffee platform                                                                            | Oy Slurp Ab              | EUR 584,560 (config) | page text                                    | Same issuer and round title as R017; separate page kept distinct                                                                                     |
| R026 | NEOH: The future of snacking                                                                                 | NEOH Invest AG           | EUR 944,681 (config) | page text                                    | Same issuer as R023 (English title)                                                                                                                  |
| R046 | POWAU- Empowering people                                                                                     | Pure Hero Oy (Powau)     | EUR 357,262 (config) | page text                                    | Healthy foods and lifestyle company (cafes, yoga; POWAU)                                                                                             |
| R053 | VEEN - the next phase of international growth                                                                | Third Culture Group Oy   | EUR 544,305 (config) | page text                                    | Premium arctic water brand (VEEN)                                                                                                                    |
| R055 | KomeroFood – Responsible and healthy food                                                                    | KomeroFood Oy            | EUR 480,014 (config) | page text                                    | Pre-measured meal cooking kits (KomeroFood)                                                                                                          |
| R111 | CarePacks - Makes it easier to choose healthier!                                                             | Carepacks AS             | EUR 691,360 (config) | page text                                    | Pre-composed healthy snack packages (CarePacks)                                                                                                      |
| R139 | Tule limonaaditehtaan omistajaksi Ahvenanmaalle! (Finnish: become an owner of the lemonade factory in Åland) | Amalias Limonadfabrik Ab | EUR 86,540 (config)  | embedded page config only (page returns 404) | Public page renders 404; embedded page config identifies round: Amalias Limonadfabrik Ab, equity, EUR 20.00/share, successfully financed (tentative) |

##### Information Technology, software and digital platforms (20 rows)

| IDs  | Round                                                        | Issuer                      | Invested shown         | Basis                   | Notes                                                                                                                |
| ---- | ------------------------------------------------------------ | --------------------------- | ---------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| R016 | Automate everything                                          | Sisua Digital Oy            | €1,712,393             | page text               | Robotic process automation software (Sisua Digital)                                                                  |
| R045 | Renthia - The future of renting properties                   | Renthia AB                  | EUR 1,743,720 (config) | page text               | PropTech rental platform connecting homeowners and tenants                                                           |
| R054 | Smartcart - The Retail Revolution                            | Smartcart Oy                | EUR 182,700 (config)   | page text               | Smart shopping carts (retail tech)                                                                                   |
| R056 | InsightsAtlas-Making Tomorrow’s Analytics AI Available Today | InsightsAtlas (Liilak Oy)   | EUR 114,192 (config)   | page text               | Analytics combining human intelligence and ML (InsightsAtlas)                                                        |
| R058 | InCoax – Gigabit speed at 20% of the cost of fiber           | InCoax Networks AB          | EUR 32,280 (config)    | page text               | Broadband-over-coax network equipment (InCoax); judgment: telecom tech (alt: industrial)                             |
| R068 | Yepzon™ – Winning with Industry-Leading Platform             | Yepzon Oy                   | EUR 938,721 (config)   | page text               | Positioning/IoT devices and services (Yepzon). Round 1 of 2 supplied (R068, R088)                                    |
| R070 | TREAMER - FUTURE OF STAFFING SERVICES                        | Treamer                     | EUR 350,262 (config)   | page text               | Staffing services platform (Treamer)                                                                                 |
| R071 | Melobee: Music discovery platform used in 120+ countries     | Melobee Music Revolution AB | EUR 5,458,197 (config) | page text               | Music discovery platform (Melobee); judgment: platform business (alt: entertainment)                                 |
| R072 | Tingent - A top tier partner in the gig economy              | Tingent AB                  | EUR 6,009,678 (config) | page text               | Gig-economy consultant broker platform (Tingent); judgment                                                           |
| R073 | Vere - Accelerating growth through business design           | Vere Oy                     | EUR 445,100 (config)   | page text               | Business design consultancy (Vere); judgment: no professional-services category in taxonomy, nearest fit             |
| R074 | Sharetribe – Building a better sharing economy               | Sharetribe Oy               | EUR 1,122,400 (config) | page text               | Marketplace SaaS (Sharetribe)                                                                                        |
| R088 | Yepzon™ - Going number One in locating business              | Yepzon Oy                   | EUR 1,298,272 (config) | page text               | Same issuer as R068                                                                                                  |
| R093 | Sharpfin - Fintech in growth phase                           | Sharpfin AB                 | EUR 2,756,105 (config) | page text               | Wealth-management software vendor (Sharpfin); judgment: software (alt: financial services)                           |
| R098 | Ezylet - Redefining The Rental Property Market.              | Ezylet Ltd                  | EUR 747,098 (config)   | page text               | Landlord/lettings property portal, UK (Ezylet); proptech platform                                                    |
| R100 | Transfluent - Language translation done right                | Transfluent Oy              | EUR 769,529 (config)   | page text               | Translation services company (Transfluent); judgment: language services (alt: none closer)                           |
| R103 | BlueJay Music - Social Radio                                 | BlueJay Technologies Ltd    | EUR 153,788 (config)   | page text               | Curated social radio app (BlueJay Music)                                                                             |
| R104 | Tellybean - Life-sized video calls on TV                     | Tellybean Ltd               | EUR 519,000 (config)   | page text               | Life-sized TV video-calling (Tellybean)                                                                              |
| R116 | Heeros IPO on First North                                    | Heeros Systems Oy           | EUR 3,000,000 (config) | title + cross-reference | IPO on First North; content login-walled. Same issuer as R131: cloud software for corporate financial administration |
| R127 | Cloud Insurance - Join our global journey                    | Cloud Solutions AS          | EUR 945,000 (config)   | page text               | Insurance-industry software platform (Cloud Insurance); judgment: software (alt: financial services)                 |
| R131 | Heeros Systems Oy                                            | Heeros Systems Oy           | EUR 666,149 (config)   | page text               | Cloud software for corporate financial administration (Heeros). Round 1 of 2 supplied (R131, R116)                   |

##### Energy and utilities (11 rows)

| IDs  | Round                                              | Issuer                      | Invested shown         | Basis                   | Notes                                                                                                                                       |
| ---- | -------------------------------------------------- | --------------------------- | ---------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| R001 | Full‑blade visibility for smarter wind farms.      | Fibersail Holding B.V.      | €1,488,020             | page text               | Wind-turbine blade monitoring (hardware-enabled SaaS) for wind farms; filed by sector served (judgment: technology supplier, not a utility) |
| R004 | Extending battery life through smarter charging    | Liion Power B.V.            | €879,876               | page text               | Battery longevity charging tech (hardware+software); judgment: energy/battery tech, product is consumer-facing                              |
| R051 | Wello - Clean energy from ocean waves              | Wello Oy                    | EUR 1,709,332 (config) | page text               | Wave-energy converter (Penguin). Round 1 of 2 supplied (R051, R079)                                                                         |
| R069 | Parking Energy brings Electricity to Electric Cars | Parking Energy              | EUR 1,034,712 (config) | page text               | EV charging services for real estate; judgment: energy/charging infra (alt: proptech)                                                       |
| R075 | Enersense International Oyj's IPO on First North   | Enersense International Oyj | EUR 314,623 (config)   | title + external source | IPO on Nasdaq First North; content login-walled. External: enersense.com - lifecycle partner for energy transmission/production and telecom |
| R077 | Seabased: Cost-competitive renewable wave energy   | Seabased                    | EUR 7,267,966 (config) | page text               | Wave-energy technology (Seabased)                                                                                                           |
| R079 | WELLO - THE POWER OF WAVES                         | Wello Oy                    | EUR 1,955,464 (config) | page text               | Same issuer as R051                                                                                                                         |
| R097 | Heliomotion Home Solar Power Plant                 | HelioZenit Ab               | EUR 100,800 (config)   | page text               | Home solar power plants (Heliomotion)                                                                                                       |
| R107 | ChargeSync - Plug in, reduce bills, cut emissions  | ChargeSync                  | EUR 129,740 (config)   | page text               | Home battery energy-storage systems (ChargeSync)                                                                                            |
| R108 | Greenstat - Making Green Happen                    | GreenStat AS                | EUR 1,302,941 (config) | page text               | Green-energy project developer: hydrogen and local energy projects (Greenstat); note portfolio/developer model                              |
| R112 | KITEMILL - Airborne Wind Energy                    | Kitemill as                 | EUR 6,398,385 (config) | page text               | Airborne wind energy - kite power (Kitemill)                                                                                                |

##### Hotels, hospitality and tourism (4 rows)

| IDs  | Round                                             | Issuer                     | Invested shown         | Basis     | Notes                                                                                                                                   |
| ---- | ------------------------------------------------- | -------------------------- | ---------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| R020 | VALO - "We create spaces you never want to leave" | VALO Group Oy              | €1,993,826             | page text | VALO Hotel & Work: hotel + workspace concept in one building                                                                            |
| R113 | Allas Sea Pool spa                                | Helsinki Allas Oy          | EUR 1,000,000 (config) | page text | Sea pool spa operator; page says construction of the main building is next - financing has development character (tentative)            |
| R120 | HUONE- Finnish Innovation to the world            | Söderlund International Oy | EUR 504,741 (config)   | page text | Meeting and event space concept (HUONE)                                                                                                 |
| R132 | Helsinki Pool – A floating sea spa & wellness hub | Helsinki Allas Oy          | EUR 810,800 (config)   | page text | Floating sea-pool and spa development; building permit confirmed - financing has development character (tentative). Same issuer as R113 |

##### E-bikes and light mobility (3 rows)

| IDs  | Round                                                 | Issuer   | Invested shown       | Basis     | Notes                                                       |
| ---- | ----------------------------------------------------- | -------- | -------------------- | --------- | ----------------------------------------------------------- |
| R028 | Skand – The future of light electric mobility         | Skand Oy | EUR 845,350 (config) | page text | Light electric mobility vehicles (Skand)                    |
| R042 | Yeply - Bicycle repair services scaling up in Europe  | Yeply Oy | EUR 972,750 (config) | page text | Bicycle repair services. Round 1 of 2 supplied (R042, R061) |
| R061 | Yeply- Join the revolution of bicycle repair services | Yeply Oy | EUR 300,000 (config) | page text | Same issuer as R042                                         |

##### Brewery, wine and spirits (4 rows)

| IDs  | Round                                                                      | Issuer                        | Invested shown         | Basis     | Notes                                                  |
| ---- | -------------------------------------------------------------------------- | ----------------------------- | ---------------------- | --------- | ------------------------------------------------------ |
| R021 | Read more, drink less - An award-winning distillery of bestselling authors | Authors' Distillery Oy        | €336,447               | page text | Craft distillery (Authors Distillery)                  |
| R084 | Pyynikin Brewing Company - Growth brewery                                  | Pyynikin käsityöläispanimo Oy | EUR 1,325,060 (config) | page text | Craft brewery (Pyynikin Brewing Company)               |
| R099 | Ägräs Distillery goes international                                        | Ägräs Distillery Oy           | EUR 350,000 (config)   | page text | Distillery (Agras). Round 1 of 2 supplied (R099, R130) |
| R130 | Moving Finnish spirits forward: ÄGRÄS DISTILLERY!                          | Ägräs Distillery Oy           | EUR 330,000 (config)   | page text | Same issuer as R099                                    |

##### Consumer products, fashion, apparel and retail (16 rows)

| IDs  | Round                                                 | Issuer                         | Invested shown         | Basis                 | Notes                                                                                                     |
| ---- | ----------------------------------------------------- | ------------------------------ | ---------------------- | --------------------- | --------------------------------------------------------------------------------------------------------- |
| R022 | Finland's largest fishing and hunting store           | Ruoto Invest Oy                | €4,103,638             | page text (thin page) | Fishing and hunting retail store; Type field absent, shares and equity offered stated on page             |
| R039 | Rekki - Invest in a sustainable future                | Omnichannel Retail Services Oy | EUR 253,870 (config)   | page text             | Second-hand clothing online store (Rekki)                                                                 |
| R041 | Myssyfarmi - Knitted by Grannies. How uncool is that? | Myssyfarmi                     | EUR 425,030 (config)   | page text             | Knitted beanies and accessories (Myssyfarmi)                                                              |
| R043 | PAPU – The new success story of Finnish design!       | Papu Design                    | EUR 499,001 (config)   | page text             | Childrens fashion (Papu Design). Round 1 of 2 supplied (R043, R140)                                       |
| R050 | Fuel the growth for iconic brands Nanso and Vogue     | Nanso Group Oy                 | EUR 399,080 (config)   | page text             | Clothing brands Nanso and Vogue                                                                           |
| R057 | Weecos.com – the pioneer of sustainable lifestyle     | Weecos                         | EUR 291,665 (config)   | page text             | Sustainable lifestyle and fashion marketplace (Weecos)                                                    |
| R081 | ZENZ ORGANIC: Natural and ecological beauty products  | Zenz Owner Holding A/S         | EUR 3,908,240 (config) | page text             | Natural/ecological beauty products (ZENZ Organic)                                                         |
| R094 | Plantui - It's time to grow!                          | Plantui                        | EUR 601,620 (config)   | page text             | Indoor smart gardening devices (Plantui); self-described Food Tech - filed as consumer devices (judgment) |
| R095 | Finnish lifestyle store TRE goes international        | World of TRE Oy Ltd            | EUR 255,686 (config)   | page text             | Finnish lifestyle/design store (World of TRE)                                                             |
| R106 | Turtleneck - Avoid everyday crankiness                | Turtleneck AS                  | EUR 488,531 (config)   | page text             | Fashion-tech accessories (Turtleneck)                                                                     |
| R117 | Marita Huurinainen                                    | Designium Brand                | EUR 110,350 (config)   | page text             | Fashion brand (Marita Huurinainen / Designium)                                                            |
| R119 | BiiSafe - Accelerating international growth           | BiiSafe Oy                     | EUR 343,289 (config)   | page text             | Connected safety devices (BiiSafe Buddy); judgment (alt: IT)                                              |
| R122 | BAD NORWEGIAN                                         | BAD NORWEGIAN                  | EUR 1,457,850 (config) | page text             | Mens skincare brand (BAD NORWEGIAN)                                                                       |
| R133 | Lillagunga - The wooden swing. Reinvented.            | Lillagunga                     | EUR 79,200 (config)    | page text             | Design wooden swings (Lillagunga)                                                                         |
| R140 | Papu Design Oy                                        | Papu Design Oy                 | EUR 116,960 (config)   | page text             | Same issuer as R043                                                                                       |
| R141 | VAJA Finland                                          |                                | EUR 173,300 (config)   | page text             | Ceramics design brand (VAJA Finland)                                                                      |

##### Sports, leisure and entertainment (12 rows)

| IDs  | Round                                                       | Issuer                        | Invested shown       | Basis                             | Notes                                                                                                                 |
| ---- | ----------------------------------------------------------- | ----------------------------- | -------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| R036 | Pineleaf - A game studio designed for growth                | Pineleaf AS                   | EUR 188,790 (config) | page text                         | Game studio (Pineleaf)                                                                                                |
| R037 | Xampion – Game-changing insights for football               | Progda Oy                     | EUR 191,693 (config) | page text                         | Football player-tracking sensors and analytics (Xampion)                                                              |
| R052 | OneMind Dogs - Transforming the Dog Training Business       | OneMind Dogs                  | EUR 512,363 (config) | page text                         | Dog-training platform and method (OneMind Dogs)                                                                       |
| R064 | FINNISH MUSIC HALL OF FAME - an experience like no other!   | Finnish Music Hall of Fame Oy | EUR 128,349 (config) | page text                         | Music experience venue (Finnish Music Hall of Fame)                                                                   |
| R091 | Tubecon                                                     | Tubecon                       | EUR 402,925 (config) | page text                         | YouTube-creator events and media network (Tubecon)                                                                    |
| R096 | ShowHau Center                                              | Karvakorvan kartano Oy        | EUR 247,828 (config) | page text                         | Dog training and care center (ShowHau Center); round combines public share issue with directed media-for-equity issue |
| R101 | Fitness Village - The Game: Make fitness fun again!         | Fitness Village               | EUR 187,525 (config) | page text                         | Fitness game/concept (Fitness Village)                                                                                |
| R105 | FitWood – The New Category of Design Home Fitness Equipment | FitWood Oy                    | EUR 103,350 (config) | page text                         | Design home-fitness equipment (FitWood); judgment (alt: consumer products)                                            |
| R125 | TPS football – the story of a lifetime                      | FC TPS OY                     | EUR 311,850 (config) | title only (content login-walled) | Title: TPS football - the story of a lifetime                                                                         |
| R128 | Stupid Stupid Games presents Agents of Armageddon           | Stupid Stupid Games Ltd       | EUR 33,932 (config)  | page text                         | Game studio (Stupid Stupid Games)                                                                                     |
| R134 | HPK – Finnish ice hockey                                    | HPK Liiga Oy                  | EUR 684,600 (config) | title only (content login-walled) | Title: HPK - Finnish ice hockey                                                                                       |
| R137 | Save Radio Helsinki – become an owner now!                  | Kaupunkitarinat Oy            | EUR 250,000 (config) | page text                         | Local radio station (Radio Helsinki / Kaupunkitarinat); judgment: media/entertainment (alt: IT)                       |

##### Health (Healthcare), wellness and medtech (23 rows)

| IDs  | Round                                                                            | Issuer                                     | Invested shown         | Basis                   | Notes                                                                                                                                                                |
| ---- | -------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R005 | Making prostate cancer diagnosis fast, accurate, and accessible to every patient | Angiogenesis Analytics B.V.                | €2,826,137             | page text               | AI prostate-cancer diagnostics software                                                                                                                              |
| R007 | Steady hands, independent lives.                                                 | STIL Group B.V.                            | €2,069,367             | page text               | Non-invasive device for hand tremor (Parkinson)                                                                                                                      |
| R010 | AI-driven technology that redefines organ transplantations                       | PIRCHE AG                                  | €2,090,900             | page text               | Organ-transplant compatibility diagnostics                                                                                                                           |
| R012 | The Next Revolution ​in Oral Health                                              | Koite Health Oy                            | €1,441,697             | page text               | Antibacterial dental-care device (Lumoral)                                                                                                                           |
| R013 | We keep people in motion                                                         | Askel Healthcare Oy                        | €2,668,186             | page text               | Knee cartilage implant (COPLA). Round 1 of 3 supplied (R013, R040, R090)                                                                                             |
| R014 | Better patient care with remote monitoring technology                            | Monidor Oy                                 | €490,820               | page text               | Remote infusion-monitoring software and devices                                                                                                                      |
| R018 | State-of-the-Art clinical research solutions                                     | Clinical Research Services Turku - CRST Oy | €456,350               | page text               | Clinical research services (CRST Oy)                                                                                                                                 |
| R027 | Aplagon - Keeping blood vessels open                                             | Aplagon Oy                                 | EUR 2,200,000 (config) | page text               | Pharma: prevents blood-vessel occlusions (APAC)                                                                                                                      |
| R029 | EpiHeart - Enabling new cardiac treatments                                       | EpiHeart Oy                                | EUR 607,625 (config)   | page text               | Cardiac treatment technology                                                                                                                                         |
| R030 | Aranda Pharma – a new treatment option for acne                                  | Aranda Pharma Oy                           | EUR 698,962 (config)   | page text               | Pharma: acne treatment                                                                                                                                               |
| R034 | Nukute - easier diagnostics for sleep apnea                                      | Invesdor Services SPV 1 Oy                 | EUR 453,766 (config)   | page text               | Sleep-apnea diagnostics (Nukute). Holding-company structure: investors hold shares in Invesdor Services SPV 1 Oy, not directly in Nukute Oy - indirect participation |
| R035 | Abacus Diagnostica – fast and reliable test results                              | Abacus Diagnostica Oy                      | EUR 1,458,858 (config) | page text               | Molecular diagnostics (rapid PCR tests)                                                                                                                              |
| R040 | Rebuilding Cartilage to Prevent Joint Pain                                       | Askel Healthcare Oy                        | EUR 766,042 (config)   | page text               | Same issuer as R013/R090                                                                                                                                             |
| R065 | Huoleti - Support network in your pocket                                         | Huoleti Oy                                 | EUR 193,851 (config)   | page text               | Digital peer-support network for patients and families (Huoleti)                                                                                                     |
| R076 | The MealPlanner- Personalized Nutrition Technology                               | The Mealplanner Europe Oy                  | EUR 160,000 (config)   | page text               | Personalized nutrition app (MealPlanner); judgment: wellness software (alt: IT)                                                                                      |
| R080 | Dr Sannas IPO on NGM Nordic MTF Sweden                                           | Dr Sannas AB (publ)                        | EUR 9,000 (config)     | title + external source | IPO on NGM Nordic MTF; content login-walled. External: Cision release - Dr Sannas AB (publ) renamed Scandinavian Health Innovations AB (publ), Mar 2019              |
| R082 | MoveSole Smart Insole helps with gait analysis                                   | MoveSole Oy                                | EUR 114,566 (config)   | page text               | Smart insole for gait analysis, medical device approval underway (MoveSole)                                                                                          |
| R087 | Sanoste - active ageing and a better life                                        | Sanoste Oy                                 | EUR 109,939 (config)   | page text               | Virtual services for active ageing (Sanoste)                                                                                                                         |
| R089 | My Locum Choice- Revolutionising UK healthcare                                   | My Locum Choice Ltd                        | EUR 112,590 (config)   | page text               | Locum pharmacist booking platform, UK (My Locum Choice); judgment: healthcare staffing                                                                               |
| R090 | COPLA Scaffold – rebuilding healthy joint surfaces                               | Askel Healthcare Oy                        | EUR 650,013 (config)   | page text               | Same issuer as R013/R040                                                                                                                                             |
| R102 | Medicortex – Rapid biochemical diagnostics for brain injury                      | Medicortex Finland Oy                      | EUR 136,544 (config)   | page text               | Brain-injury biochemical diagnostics (Medicortex)                                                                                                                    |
| R109 | Pieni piiri is digitalising elderly care                                         | Pieni piiri Oy                             | EUR 102,335 (config)   | page text               | Digital elderly-care services (Pieni piiri)                                                                                                                          |
| R129 | Heimo - Social media for life challenges                                         | Heimo Community                            | EUR 170,357 (config)   | page text               | Peer-support social platform for mental health (Heimo); judgment: wellness purpose (alt: IT)                                                                         |

##### Industrial technology and manufacturing (11 rows)

| IDs  | Round                                                       | Issuer                | Invested shown         | Basis     | Notes                                                                                                              |
| ---- | ----------------------------------------------------------- | --------------------- | ---------------------- | --------- | ------------------------------------------------------------------------------------------------------------------ |
| R015 | Woodly® material is a wood-based and carbon neutral plastic | Woodly Oy             | €1,511,151             | page text | Wood-based plastic-substitute material; judgment: biomaterials manufacturing (alt: environment)                    |
| R019 | Oceanvolt - Electric propulsion for today and tomorrow      | Oceanvolt Oy          | €1,464,390             | page text | Electric marine propulsion systems; judgment: not light mobility (boats). Round 1 of 3 supplied (R019, R032, R047) |
| R031 | MotoCut - The new era of pile cutting                       | Motocut Oy            | EUR 1,017,395 (config) | page text | Pile-cutting machinery (MotoCut)                                                                                   |
| R032 | Oceanvolt - The cleaner future of boating                   | Oceanvolt Oy          | EUR 2,250,360 (config) | page text | Same issuer as R019/R047                                                                                           |
| R044 | KarhiaPro - World's First Coat Stripper                     | Karhia Innovations Oy | EUR 207,318 (config)   | page text | Coating-removal tools (KarhiaPro coat stripper)                                                                    |
| R047 | Oceanvolt - Green and silent power for the seas             | Oceanvolt Oy          | EUR 2,000,000 (config) | page text | Same issuer as R019/R032                                                                                           |
| R048 | Solwers – engineering value                                 | Solwers plc           | EUR 1,462,730 (config) | page text | Engineering services group (Solwers)                                                                               |
| R060 | Valtavalo – See the light!                                  | Valtavalo Oy          | EUR 95,616 (config)    | page text | LED tube light manufacturer (Valtavalo)                                                                            |
| R067 | Mekitec for Safe Food                                       | Mekitec Oy            | EUR 2,157,256 (config) | page text | X-ray inspection systems for food industry (Mekitec)                                                               |
| R115 | Winled                                                      | Winled Oy             | EUR 630,850 (config)   | page text | LED lighting manufacturer (Winled)                                                                                 |
| R118 | Enfucell powers the Internet of Things revolution           | Sencilion Oy          | EUR 412,277 (config)   | page text | Thin flexible printed batteries (Enfucell / Sencilion); judgment: manufacturing (alt: energy)                      |

##### Restaurants and gastronomy (6 rows)

| IDs  | Round                                                     | Issuer             | Invested shown         | Basis     | Notes                                                                                                                           |
| ---- | --------------------------------------------------------- | ------------------ | ---------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| R002 | Sustainable food tech concept on course for growth        | Beets & Roots GmbH | €1,704,757             | page text | Operates 21 restaurants; self-described food-tech. Round 1 of 3 supplied for issuer (R002, R008, R011)                          |
| R008 | Sustainable food tech concept on course for growth        | Beets & Roots GmbH | €1,006,867             | page text | Same issuer as R002/R011; identical round title to R002, lower funded total shown - separate round page kept distinct           |
| R011 | Nachhaltiges Food-Tech-Konzept auf Wachstumskurs          | Beets & Roots GmbH | €1,509,808             | page text | Same issuer as R002/R008; German-language round title (Nachhaltiges Food-Tech-Konzept...) - possible translation, not confirmed |
| R063 | Fafa's - a Significant Finnish Street Food Chain          | Fafa's Plats Oy    | EUR 1,000,000 (config) | page text | Street-food restaurant chain and franchising (Fafas)                                                                            |
| R078 | Pupu - Have a tasty bite of the green revolution of food! | Saladwerk Oy       | EUR 342,500 (config)   | page text | Salad bar chain (Pupu / Saladwerk)                                                                                              |
| R114 | Join Friends & Brgrs International Expansion              | Friends & Brgrs    | EUR 980,000 (config)   | page text | Burger chain international expansion (Friends & Brgrs)                                                                          |

##### Agriculture, environment and recycling (4 rows)

| IDs  | Round                                                           | Issuer                                              | Invested shown         | Basis     | Notes                                                                                                                            |
| ---- | --------------------------------------------------------------- | --------------------------------------------------- | ---------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| R003 | Clean rivers. Recycle plastics. Protect oceans. Scaling up now. | Riverrecycle Oy                                     | €743,129               | page text | Collects river plastic and recycles it into boards; round finances production scale-up in the Philippines (equity, issuer-based) |
| R006 | Counting microorganisms faster                                  | DIAMIDEX Société anonyme à conseil d'administration | €2,882,717             | page text | Microbiological water-safety testing systems; judgment: environmental water testing, not human diagnostics                       |
| R009 | Revolutionizing Egg Farming: Better for Birds, Earth, and You   | Kipster Holding B.V.                                | €3,700,275             | page text | Animal-welfare egg production farms                                                                                              |
| R038 | Solar Water Solutions – Clean water with just sun               | Solar Water Solutions Oy                            | EUR 1,200,000 (config) | page text | Solar-powered water-purification systems; judgment: water treatment (alt: energy)                                                |

##### Building products and prefab housing (1 row)

| IDs  | Round                                     | Issuer      | Invested shown         | Basis     | Notes                                                                                      |
| ---- | ----------------------------------------- | ----------- | ---------------------- | --------- | ------------------------------------------------------------------------------------------ |
| R059 | Naava - Reconnecting humanity with nature | Naava Group | EUR 2,040,933 (config) | page text | Smart living green walls for buildings (Naava); judgment: building product (alt: consumer) |

##### Financial services and investment vehicles (7 rows)

| IDs  | Round                                                    | Issuer             | Invested shown         | Basis                   | Notes                                                                                                                               |
| ---- | -------------------------------------------------------- | ------------------ | ---------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| R033 | Solidate – Solutions to debt problems                    | Solidate Oy        | EUR 270,400 (config)   | page text               | Debt-settlement fintech (Solidate)                                                                                                  |
| R049 | PCKT Money Plc - Let your own money teach you            | PCKT Money Oyj     | EUR 218,596 (config)   | page text               | Childrens money app: spending, savings and investment pockets (PCKT Money)                                                          |
| R062 | Taikina Capital - Selected portfolio & earlier liquidity | Taikina Capital Oy | EUR 132,210 (config)   | page text               | Investment company picking shares and loans from crowdfunding platforms (Taikina Capital)                                           |
| R066 | Klever - I love paying bills                             | Klever Oy Ab       | EUR 1,463,940 (config) | page text               | Bill-payment service (Klever)                                                                                                       |
| R083 | Prasos - Making bitcoin investing mainstream             | Coinmotion Oy      | EUR 2,499,266 (config) | page text               | Bitcoin investing services (Coinmotion / Prasos)                                                                                    |
| R085 | Seafire AB IPO on NGM Nordic MTF Sweden                  | Seafire AB (publ)  | EUR 190,800 (config)   | title + external source | IPO on NGM Nordic MTF; content login-walled. External: seafireab.com - long-term owner of subsidiary companies (industrial holding) |
| R086 | LIG: Pioneer in Nordic Education Technology              | 3P Capital Oy Ab   | EUR 672,574 (config)   | page text               | Edtech business development group investing in edtech companies (LIG / 3P Capital); judgment: investment vehicle (alt: education)   |

##### Education and aviation training (6 rows)

| IDs  | Round                                                      | Issuer             | Invested shown         | Basis     | Notes                                                                         |
| ---- | ---------------------------------------------------------- | ------------------ | ---------------------- | --------- | ----------------------------------------------------------------------------- |
| R024 | WordDive Group is growing fast in North America            | WordDive Group Oy  | €2,043,030             | page text | Language-learning app (WordDive Group Oy). Round 1 of 2 supplied (R024, R110) |
| R092 | TWID: Monthly recurring revenue growth 346% in three years | TWID               | EUR 344,220 (config)   | page text | Tutoring services platform (Tutoring Finland / TWID)                          |
| R110 | WordDive - 560% growth in 3 years!                         | WordDive Group Oy  | EUR 1,200,000 (config) | page text | Same issuer as R024 (WordDive Group Oy)                                       |
| R121 | CLANED - Invest in International Growth                    | Claned Group Oy Ab | EUR 600,153 (config)   | page text | Learning analytics platform (Claned)                                          |
| R123 | Study Advisory                                             | Study Advisory     | EUR 33,180 (config)    | page text | Online university-ranking platform (Study Advisory)                           |
| R135 | Invest in Finnish edutech business with SkillzzUp!         | SkillzzUp Oy       | EUR 54,834 (config)    | page text | Edutech: assessment of individual development (SkillzzUp)                     |

##### Transport and logistics (2 rows)

| IDs  | Round                                     | Issuer                  | Invested shown         | Basis                             | Notes                                                                                          |
| ---- | ----------------------------------------- | ----------------------- | ---------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------- |
| R126 | Shared and Hourly based Electric Vehicles | EkoRent                 | EUR 170,517 (config)   | page text                         | Shared/hourly electric car service (EkoRent); judgment: mobility service (alt: light mobility) |
| R136 | Ahola Transport IPO onto Aktietorget      | Oyj Ahola Transport Abp | EUR 2,017,858 (config) | title only (content login-walled) | Title: Ahola Transport IPO onto Aktietorget                                                    |

##### Real estate (2 rows)

| IDs  | Round                                        | Issuer          | Invested shown       | Basis     | Notes                                                                                                                                                |
| ---- | -------------------------------------------- | --------------- | -------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| R124 | Mini-Holding Oy, self storage in Tallinn     | Mini-Holding Oy | EUR 79,838 (config)  | page text | Self-storage in Tallinn via 100%-owned Minilaod OU; issuer is a holding company; expansion of storage capacity (judgment: real estate, self-storage) |
| R138 | Cityvarasto – First Step towards First North | Cityvarasto Oyj | EUR 300,000 (config) | page text | Largest self-storage operator in Finland, pre-IPO share issue; judgment: real estate (self-storage operator, corporate share issue)                  |
