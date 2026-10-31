# Invesdor full supplied list by project type (2026-10-31)

This file classifies the full Invesdor list the user supplied on WhatsApp on 2026-10-31 (00:35 WET). It mirrors the structure of `conda-full-list-by-project-type.md`. Companion CSV with one row per input entry and per-row evidence: `invesdor-full-list-by-project-type.csv`. The companion `invesdor-sitemap.md` holds the 50 official XML sitemap URLs plus a separate user-supplied section listing these same 141 round URLs (user-supplied, not discovered in the XML sitemap).

The instrument hierarchy, financing types, property types, the 17 industry categories plus "Unclear from available evidence", the structure overlays and the rank/label qualifiers below use the wording the user supplied in the same WhatsApp message. They are an analyst grouping made for this document. They are not Invesdor's own taxonomy; Invesdor's own product tag and "Type" field are kept in their own columns in the CSV.

## 1. Input entries, URLs and offerings

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

## 2. Entry types: thematic pages and success stories are not rounds

Eleven numbered entries are platform marketing pages, not investment offerings. They are classified here by page role, not by the instrument taxonomy. Figures below are quoted as claims printed on each page, not verified facts.

### Thematic marketing pages (2 entries)

| Label     | URL                                                      | What the page is                                                                                                                                                                                 | Cross-references in the supplied round list                                                                        |
| --------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| 6         | https://www.invesdor.com/invest-in-companies/medtech     | "Investing in MedTech" thematic page: reasons to invest in medical technology; showcases funded MedTech companies                                                                                | Names Koite Health (round R012), Monidor (R014), Aplagon (R027) as examples of funded MedTech projects             |
| 7 (first) | https://www.invesdor.com/invest-in-companies/fixedincome | "Exclusive options for fixed income investments" thematic page: advertises "annual interest rates up to 10%", due-diligence claims, ECSP licence mention; showcases fixed-income success stories | No supplied round URL is a fixed-income (debt) round; the page links to success stories such as Evobeam (entry 15) |

### Success-story pages (9 entries)

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

## 3. Instrument categories

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

### New-category check (the user asked whether new categories are needed)

No new instrument category is required by the evidence: every supplied round is a share offering and files into category 2, with one indirect-participation ownership structure (R034) already covered by the taxonomy's own note on category 3. Debt categories 5/6 exist but have no supplied rows; the platform's debt business is visible only in the marketing pages (entries 7 (first), 8, 9, 10, 14, 15).

## 4. Repeat issuers, translations and page state

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

## 5. Method and limits

- Each page was read live on 2026-10-31 (00:37-00:38 WET) as server-rendered HTML; the CSV `evidence` column quotes the first ~200 characters of the pitch text the classification rests on.
- `site_type_field` is Invesdor's own "Type" label; `config_funding_type`, and the zero interest/duration values, come from the page's embedded config and were used as a machine cross-check. `site_product_tag` ("Corporate Equity", shown on 18 newer pages only) and the country flag (shown on 16 pages only) are Invesdor's own labels, kept in the CSV, not used as the industry.
- The instrument label is the site's own wording, not a verified legal form. Share classes, voting rights and subscription terms were not read; documents behind login were not accessed.
- `basis` shows how solid each row is: "page text" = pitch text read; "page text (thin page)" = R022, short page but with price-per-share and equity fields; "title only (content login-walled)"; "title + external source" (external URL in Notes); "title + cross-reference" (R116, grounded on supplied sibling R131); "embedded page config only" (R139).
- Industry says what the issuer's business does. It says nothing about use of proceeds (section 6). Several rows are judgment calls (technology suppliers to a sector, platform businesses, holdings); the reasoning is in each row's Notes.
- The supplied list is not a crawl of invesdor.com: it covers only the supplied URLs.

## 6. Project/financing type and property type

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

### Real estate

Property-type labels follow the user's updated unified list supplied on WhatsApp on 2026-10-31 (01:07 WET), which adds the "Other property types - ..." categories this site's data surfaced.

| Property type inside real estate                          | Rows                                                              |
| --------------------------------------------------------- | ----------------------------------------------------------------- |
| Residential (new-build development)                       | 0                                                                 |
| Residential (subtype detail unconfirmed)                  | 0                                                                 |
| Residential (renovation/revitalization)                   | 0                                                                 |
| Residential (renovation + new-build)                      | 0                                                                 |
| Mixed-use (residential + commercial elements)             | 0                                                                 |
| Residential (holiday apartments, incl. hotel conversions) | 0                                                                 |
| Commercial/office                                         | 0                                                                 |
| other property types                                      | 0                                                                 |
| Other property types - self-storage                       | 2 (R124 Mini-Holding / Minilaod, R138 Cityvarasto)                |
| Other property types - sea pool / spa complex (tentative) | 2 (R113, R132; industry filed as Hotels, hospitality and tourism) |
| Not determined                                            | 0                                                                 |

Self-storage operators are filed under Real estate as a judgment call (self-storage is property-based); both are corporate share issues of the operating/holding company, not verified property financings. R020 VALO (hotel + workspace in one building) and R120 HUONE (meeting spaces) are filed by what they operate, under Hotels, hospitality and tourism, financing type corporate.

## 7. Counts by industry category

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

## 8. Rounds by category

Every row below has financing type "Corporate (issuer-based, provisional; use of proceeds not verified)" except R113 and R132 (tentative property projects, section 6).

### Food and beverage products (9 rows)

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

### Information Technology, software and digital platforms (20 rows)

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

### Energy and utilities (11 rows)

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

### Hotels, hospitality and tourism (4 rows)

| IDs  | Round                                             | Issuer                     | Invested shown         | Basis     | Notes                                                                                                                                   |
| ---- | ------------------------------------------------- | -------------------------- | ---------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| R020 | VALO - "We create spaces you never want to leave" | VALO Group Oy              | €1,993,826             | page text | VALO Hotel & Work: hotel + workspace concept in one building                                                                            |
| R113 | Allas Sea Pool spa                                | Helsinki Allas Oy          | EUR 1,000,000 (config) | page text | Sea pool spa operator; page says construction of the main building is next - financing has development character (tentative)            |
| R120 | HUONE- Finnish Innovation to the world            | Söderlund International Oy | EUR 504,741 (config)   | page text | Meeting and event space concept (HUONE)                                                                                                 |
| R132 | Helsinki Pool – A floating sea spa & wellness hub | Helsinki Allas Oy          | EUR 810,800 (config)   | page text | Floating sea-pool and spa development; building permit confirmed - financing has development character (tentative). Same issuer as R113 |

### E-bikes and light mobility (3 rows)

| IDs  | Round                                                 | Issuer   | Invested shown       | Basis     | Notes                                                       |
| ---- | ----------------------------------------------------- | -------- | -------------------- | --------- | ----------------------------------------------------------- |
| R028 | Skand – The future of light electric mobility         | Skand Oy | EUR 845,350 (config) | page text | Light electric mobility vehicles (Skand)                    |
| R042 | Yeply - Bicycle repair services scaling up in Europe  | Yeply Oy | EUR 972,750 (config) | page text | Bicycle repair services. Round 1 of 2 supplied (R042, R061) |
| R061 | Yeply- Join the revolution of bicycle repair services | Yeply Oy | EUR 300,000 (config) | page text | Same issuer as R042                                         |

### Brewery, wine and spirits (4 rows)

| IDs  | Round                                                                      | Issuer                        | Invested shown         | Basis     | Notes                                                  |
| ---- | -------------------------------------------------------------------------- | ----------------------------- | ---------------------- | --------- | ------------------------------------------------------ |
| R021 | Read more, drink less - An award-winning distillery of bestselling authors | Authors' Distillery Oy        | €336,447               | page text | Craft distillery (Authors Distillery)                  |
| R084 | Pyynikin Brewing Company - Growth brewery                                  | Pyynikin käsityöläispanimo Oy | EUR 1,325,060 (config) | page text | Craft brewery (Pyynikin Brewing Company)               |
| R099 | Ägräs Distillery goes international                                        | Ägräs Distillery Oy           | EUR 350,000 (config)   | page text | Distillery (Agras). Round 1 of 2 supplied (R099, R130) |
| R130 | Moving Finnish spirits forward: ÄGRÄS DISTILLERY!                          | Ägräs Distillery Oy           | EUR 330,000 (config)   | page text | Same issuer as R099                                    |

### Consumer products, fashion, apparel and retail (16 rows)

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

### Sports, leisure and entertainment (12 rows)

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

### Health (Healthcare), wellness and medtech (23 rows)

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

### Industrial technology and manufacturing (11 rows)

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

### Restaurants and gastronomy (6 rows)

| IDs  | Round                                                     | Issuer             | Invested shown         | Basis     | Notes                                                                                                                           |
| ---- | --------------------------------------------------------- | ------------------ | ---------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| R002 | Sustainable food tech concept on course for growth        | Beets & Roots GmbH | €1,704,757             | page text | Operates 21 restaurants; self-described food-tech. Round 1 of 3 supplied for issuer (R002, R008, R011)                          |
| R008 | Sustainable food tech concept on course for growth        | Beets & Roots GmbH | €1,006,867             | page text | Same issuer as R002/R011; identical round title to R002, lower funded total shown - separate round page kept distinct           |
| R011 | Nachhaltiges Food-Tech-Konzept auf Wachstumskurs          | Beets & Roots GmbH | €1,509,808             | page text | Same issuer as R002/R008; German-language round title (Nachhaltiges Food-Tech-Konzept...) - possible translation, not confirmed |
| R063 | Fafa's - a Significant Finnish Street Food Chain          | Fafa's Plats Oy    | EUR 1,000,000 (config) | page text | Street-food restaurant chain and franchising (Fafas)                                                                            |
| R078 | Pupu - Have a tasty bite of the green revolution of food! | Saladwerk Oy       | EUR 342,500 (config)   | page text | Salad bar chain (Pupu / Saladwerk)                                                                                              |
| R114 | Join Friends & Brgrs International Expansion              | Friends & Brgrs    | EUR 980,000 (config)   | page text | Burger chain international expansion (Friends & Brgrs)                                                                          |

### Agriculture, environment and recycling (4 rows)

| IDs  | Round                                                           | Issuer                                              | Invested shown         | Basis     | Notes                                                                                                                            |
| ---- | --------------------------------------------------------------- | --------------------------------------------------- | ---------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| R003 | Clean rivers. Recycle plastics. Protect oceans. Scaling up now. | Riverrecycle Oy                                     | €743,129               | page text | Collects river plastic and recycles it into boards; round finances production scale-up in the Philippines (equity, issuer-based) |
| R006 | Counting microorganisms faster                                  | DIAMIDEX Société anonyme à conseil d'administration | €2,882,717             | page text | Microbiological water-safety testing systems; judgment: environmental water testing, not human diagnostics                       |
| R009 | Revolutionizing Egg Farming: Better for Birds, Earth, and You   | Kipster Holding B.V.                                | €3,700,275             | page text | Animal-welfare egg production farms                                                                                              |
| R038 | Solar Water Solutions – Clean water with just sun               | Solar Water Solutions Oy                            | EUR 1,200,000 (config) | page text | Solar-powered water-purification systems; judgment: water treatment (alt: energy)                                                |

### Building products and prefab housing (1 row)

| IDs  | Round                                     | Issuer      | Invested shown         | Basis     | Notes                                                                                      |
| ---- | ----------------------------------------- | ----------- | ---------------------- | --------- | ------------------------------------------------------------------------------------------ |
| R059 | Naava - Reconnecting humanity with nature | Naava Group | EUR 2,040,933 (config) | page text | Smart living green walls for buildings (Naava); judgment: building product (alt: consumer) |

### Financial services and investment vehicles (7 rows)

| IDs  | Round                                                    | Issuer             | Invested shown         | Basis                   | Notes                                                                                                                               |
| ---- | -------------------------------------------------------- | ------------------ | ---------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| R033 | Solidate – Solutions to debt problems                    | Solidate Oy        | EUR 270,400 (config)   | page text               | Debt-settlement fintech (Solidate)                                                                                                  |
| R049 | PCKT Money Plc - Let your own money teach you            | PCKT Money Oyj     | EUR 218,596 (config)   | page text               | Childrens money app: spending, savings and investment pockets (PCKT Money)                                                          |
| R062 | Taikina Capital - Selected portfolio & earlier liquidity | Taikina Capital Oy | EUR 132,210 (config)   | page text               | Investment company picking shares and loans from crowdfunding platforms (Taikina Capital)                                           |
| R066 | Klever - I love paying bills                             | Klever Oy Ab       | EUR 1,463,940 (config) | page text               | Bill-payment service (Klever)                                                                                                       |
| R083 | Prasos - Making bitcoin investing mainstream             | Coinmotion Oy      | EUR 2,499,266 (config) | page text               | Bitcoin investing services (Coinmotion / Prasos)                                                                                    |
| R085 | Seafire AB IPO on NGM Nordic MTF Sweden                  | Seafire AB (publ)  | EUR 190,800 (config)   | title + external source | IPO on NGM Nordic MTF; content login-walled. External: seafireab.com - long-term owner of subsidiary companies (industrial holding) |
| R086 | LIG: Pioneer in Nordic Education Technology              | 3P Capital Oy Ab   | EUR 672,574 (config)   | page text               | Edtech business development group investing in edtech companies (LIG / 3P Capital); judgment: investment vehicle (alt: education)   |

### Education and aviation training (6 rows)

| IDs  | Round                                                      | Issuer             | Invested shown         | Basis     | Notes                                                                         |
| ---- | ---------------------------------------------------------- | ------------------ | ---------------------- | --------- | ----------------------------------------------------------------------------- |
| R024 | WordDive Group is growing fast in North America            | WordDive Group Oy  | €2,043,030             | page text | Language-learning app (WordDive Group Oy). Round 1 of 2 supplied (R024, R110) |
| R092 | TWID: Monthly recurring revenue growth 346% in three years | TWID               | EUR 344,220 (config)   | page text | Tutoring services platform (Tutoring Finland / TWID)                          |
| R110 | WordDive - 560% growth in 3 years!                         | WordDive Group Oy  | EUR 1,200,000 (config) | page text | Same issuer as R024 (WordDive Group Oy)                                       |
| R121 | CLANED - Invest in International Growth                    | Claned Group Oy Ab | EUR 600,153 (config)   | page text | Learning analytics platform (Claned)                                          |
| R123 | Study Advisory                                             | Study Advisory     | EUR 33,180 (config)    | page text | Online university-ranking platform (Study Advisory)                           |
| R135 | Invest in Finnish edutech business with SkillzzUp!         | SkillzzUp Oy       | EUR 54,834 (config)    | page text | Edutech: assessment of individual development (SkillzzUp)                     |

### Transport and logistics (2 rows)

| IDs  | Round                                     | Issuer                  | Invested shown         | Basis                             | Notes                                                                                          |
| ---- | ----------------------------------------- | ----------------------- | ---------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------- |
| R126 | Shared and Hourly based Electric Vehicles | EkoRent                 | EUR 170,517 (config)   | page text                         | Shared/hourly electric car service (EkoRent); judgment: mobility service (alt: light mobility) |
| R136 | Ahola Transport IPO onto Aktietorget      | Oyj Ahola Transport Abp | EUR 2,017,858 (config) | title only (content login-walled) | Title: Ahola Transport IPO onto Aktietorget                                                    |

### Real estate (2 rows)

| IDs  | Round                                        | Issuer          | Invested shown       | Basis     | Notes                                                                                                                                                |
| ---- | -------------------------------------------- | --------------- | -------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| R124 | Mini-Holding Oy, self storage in Tallinn     | Mini-Holding Oy | EUR 79,838 (config)  | page text | Self-storage in Tallinn via 100%-owned Minilaod OU; issuer is a holding company; expansion of storage capacity (judgment: real estate, self-storage) |
| R138 | Cityvarasto – First Step towards First North | Cityvarasto Oyj | EUR 300,000 (config) | page text | Largest self-storage operator in Finland, pre-IPO share issue; judgment: real estate (self-storage operator, corporate share issue)                  |
