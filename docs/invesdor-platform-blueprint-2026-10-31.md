# Invesdor - Platform and Feature Blueprint

**Purpose:** detailed description of the Invesdor platform (invesdor.com) - pages, features, user journeys and instrument structures - as reference material for building your own crowdfunding / RWA investment platform.
**Evidence base:** your archive `Invesdor.zip` (about 895 MB): 249 files - 242 full-page screencapture PDFs of invesdor.com and its help center taken 2026-10-30/31 (773 letter pages total, image-only jsPDF captures), 5 authenticated investor-account screenshots (AVIF, German UI), and 2 document PDFs (the standard EU complaint form and a company press release). Every load-bearing statement cites its source: **[S-xxx]** = screencapture file (see the source index in section 16 and the companion `invesdor-source-index.csv`), **[D-name]** = document PDF. Page anatomy of the homepage, investment-opportunities listing, shares and SME-funding pages and the account area was verified against the rendered page images, not only extracted text.
**Review coverage, stated honestly:** all 249 files are inventoried and carry source IDs. All FAQ captures (help center, S-150..S-233), the instrument landing pages, about-us and the academy module 1 were text-extracted (OCR) and read. Homepage (S-001/002), rounds listing (S-003, first 5 of 22 pages), shares (S-011), SME funding (S-048) and the account area (S-085, S-243) were additionally verified visually. The long legal documents (S-234..S-238), the remaining scroll sections of the marketing page series, the blog/press/jobs/success-story series, listing pages 6-22, and the private-equity/crowdfunding/real-estate-crowdfunding series were inventoried and sampled but not exhaustively text-analysed at publication time; sections below mark where a claim rests on sampled evidence. Round-level classification (instruments, industries, property types) lives in [invesdor-full-list-by-project-type.md](invesdor-full-list-by-project-type.md), built from the earlier supplied round list, not from this archive - this archive contains no round detail pages.
**Labels:** [OBSERVED] = visible in the cited archive evidence. [SITE-CLAIM] = stated on the website or in a dated document; not independently re-verified. [PROPOSED] = my design recommendation for your build, not a claim about Invesdor. [UNKNOWN] = not visible in the archive.

> Use this as a specification reference, not as source text. Do not copy Invesdor's branding, texts, legal documents or campaign content.

---

## 1. What the platform is

Invesdor is a European crowdfunding and impact-investment platform for retail investment in companies - SMEs, start-ups/scale-ups, real estate and renewable-energy projects - with minimum investments from EUR 250 [OBSERVED, S-001]. It positions itself as "Europe's leading impact investing platform" and states: more than EUR 647 million invested, more than 217 thousand registered investors, 1,096 funding rounds [SITE-CLAIM, S-001]. A company-side page states "over 180,000 investors in more than 30 countries" [SITE-CLAIM, S-048] - the two figures come from different pages; preserve both as page-level claims rather than reconciling them.

Company history as stated on the About page [SITE-CLAIM, S-118]: founded 2012 in Helsinki (Finland); 2022 merger into the Invesdor Group with offices in Germany, Austria and Finland; 2023 the Dutch platform Oneplanetcrowd joined the group. Stated office footprint: Helsinki, Vienna, Amsterdam, Berlin. Named management on the page: Christopher Gratz (Group CEO; Invesdor "formerly Kapilendo" per his bio) and Ellen Hensbergen (Managing Director Benelux). The legal entity behind the site is named on the legal-notice page (S-239, captured; contents not text-analysed at publication time - verify there if the exact entity matters).

Regulatory surface: the site displays an "ECSPR - licensed under the EU ECSP regulation" badge and a "Eurocrowd platform member" badge on every captured page footer area [OBSERVED, S-001, S-011]. Which group entity holds which authorisation is not resolvable from the archive; verify against the relevant register if it matters.

A distinctive platform fact for your build: for tokenized investments, Invesdor states it represents investment rights and obligations **on the Stellar blockchain**, using smart contracts for creation and distribution, with custody through specialised crypto custodians including Tangany (BaFin-regulated), and no external wallet required for the investor [SITE-CLAIM, FAQ S-190 area: tokenization, custody and wallet articles in S-185..S-189]. Invesdor is therefore a production reference of Stellar-based tokenisation under an ECSP licence - directly relevant to your architecture.

## 2. Site map [OBSERVED, from the captured pages]

**Public site:** home `/` (S-001/002); investment-opportunities listing "Funding rounds" (S-003); investor product pages under "Invest in companies": overview (S-004), bonds (S-005..010), shares (S-011..016), profit participation rights (S-017..019), fixed income (S-020), equity investments (S-021), medtech (S-022), renewable energy (S-023), SDGs (S-024), private equity (S-025/026), Pre-IPO (S-027..034), crowdfunding (S-035), real-estate crowdfunding (S-036..045), thematic guide "how to invest in solar energy projects" (S-046). Company side under "Funding": overview (S-047), SME (S-048..057), real estate (S-058..071), start-ups and scale-ups (S-072..077), renewable energy (S-078), funding-request form page (S-079). Investor "experience" pages (S-080..082). Statistics (S-089). Owners Portal landing (S-088). Academy hub (S-090) with modules: crowdfunding (S-091..095), investment guide (S-096..108), investment management (S-109..115), why Invesdor (S-116/117). About us (S-118) and mission (S-119/120). Success stories hub (S-121) + 9 story pages (S-122..130). Blog (S-131) + 4 category pages (S-132..135). Press (S-136..138). Jobs (S-139..145). Partners (S-146). Contact (S-147). Newsletter sign-ups (S-148/149).

**Help center** ("Invesdor Help Center", S-150..S-233): eight categories, one expanded answer per capture - Profile & Account; Identity Verification; Security, Privacy & Regulation; Investing & Payments (incl. a "Taxes & Interest" entry, S-192 area); Eligibility & Risks; Portfolio & Documents; Transfers, Inheritance & Selling; Impact Investing. Category landing captures also included (e.g. S-150, S-165).

**Legal pages:** terms and conditions (S-234), data privacy (S-235..238), legal notice (S-239), complaint management (S-240, plus the standard EU complaint-form document D-complaints), conflict of interest (S-241), accessibility statement (S-242).

**Authenticated area:** registration-successful (S-083), email user-activation (S-084, filename token redacted), account home (S-085), profile (S-086), portfolio (S-087), and the five German-UI account screenshots S-243..S-247 (portfolio; investment information and documents; payouts; profile management; tax documents). The logged-in header replaces "For Companies / About us" with Portfolio and an account avatar, and adds a "SUPPORT" button and an "Invesdor empfehlen" (recommend Invesdor) entry [OBSERVED, S-085, S-243].

## 3. Persistent UI elements [OBSERVED, verified visually on S-001 and S-011]

- Header: INVESDOR logo; nav dropdowns "For Investors", "For Companies", "Knowledge", "About us"; "Sign in" button; "Sign up" link; locale switcher with chips EN / FI / NL / AT / DE (language-country locales reflecting the group footprint).
- No persistent total-loss banner at the top of public pages was observed (unlike CONDA); the statutory no-protection disclaimer appears in the body of the investor overview page (S-004, section 10).
- Footer: link columns - Invest in companies / Investment Opportunities; Statistics / Success stories; Raise funding; Invesdor blog / FAQ / Support-Center / Complaint management; About us / Our mission / Contact / Newsletter; Press / Jobs at Invesdor; Terms and conditions / Data privacy / Legal notice / Conflict of interest / Accessibility statement. Social icons (LinkedIn, Facebook, Instagram), phone +49 30 364 28 57 0, "© 2026 Invesdor".
- "Stay informed" newsletter block above the footer (email + language selector) [S-001].
- Eurocrowd member and ECSPR-licensed badges above the footer [S-001, S-011].
- Contact-person card with photo, name, role and languages on instrument pages ("Your contact person", e.g. Sebastian Kutschker, Lead Investor Relations, DE|EN) [S-011].

## 4. Homepage anatomy [OBSERVED, S-001/002, verified visually]

1. Hero: "Together we fund the future." / "Join us in investing for financial returns and a sustainable tomorrow." CTAs "Current Projects" and "How to Invest".
2. Issuer logo strip (Störtebeker Whisky, Oceanvolt, beets&roots, nextbike, NAAVA, Valori).
3. Teaser "Invest in attractive companies starting from €250." with "Learn more" / "Stay Informed" buttons.
4. Counters: +647 million invested; +217 thousand registered investors; 1,096 funding rounds.
5. "Investment Opportunities" card grid (same cards as the listing, section 5) + "Discover all companies" button.
6. "Our success stories" cards (Friends & Brgrs, Heeros, Biogena) + "More Success Stories".
7. "Trusted by Investors from over 100 countries." + "Create your free account" CTA.
8. Eurocrowd/ECSPR badges, newsletter block, footer.

## 5. Investment-opportunities listing [OBSERVED, S-003, pages 1-5 verified visually]

- Title "Investment opportunities"; subline "Invest directly in selected, successful, and sustainable companies from various sectors and regions."
- Filter chips with live counts: ALL 225 - FIXED INTEREST 65 - PARTICIPATION 160 - IMPACT 69 - CORPORATE DEBT 45 - RENEWABLE ENERGY 14 - REAL ESTATE 6 - CORPORATE EQUITY 157 - PRE-IPO 3. The chips mix instrument labels (fixed interest, participation, corporate debt, corporate equity, Pre-IPO), a sector (renewable energy, real estate) and a cross-cutting tag (impact); they are not mutually exclusive (counts sum past 225).
- **Card fields:** category chip (REAL ESTATE, CORPORATE DEBT, RENEWABLE ENERGY, CORPORATE EQUITY, PRE-IPO), status ribbon ("9 days left" / "10 days left" on live rounds, "Successful" on closed), issuer image, "Impact" tag on many cards, issuer name, one-line tagline, "Invested" amount with progress bar and "from N investors" on live rounds, then instrument-specific rows: debt cards show "Price per bond €250", "Duration N years", "Interest p.a. N.NN%"; equity cards show "Price per share", "Pre-money valuation", "Equity offered Up to N.NN%". Pre-IPO cards show "Price per bond €250" and "Return of bond: linked to entry and exit valuation". Buttons: "Invest now" (live) / "Details" (closed). One card carries a magenta "2 Updates" badge (issuer updates feature).
- Observed examples: re-nxt invest (real estate, EUR 631,000 from 325 investors, 3 years, 8.75%), Nordic Urban (corporate debt, 4 years, 8.75%), Ahertaja (1.5 years, 7.25%), AEP Obernberg (renewable energy, 7 years, 8.00%), Fibersail (corporate equity, EUR 5.89/share, pre-money EUR 9,000,000, up to 21.40%), Resonandina (corporate debt, 9.20%), HirviForest, FOX Living I and II (real estate), Fleur de Selent, Flagmore, Beets & Roots (equity, EUR 498.03/share), RiverRecycle (equity + Impact), Bluespoon, REPLOID Group AG, Those Vegan Cowboys (EUR 7,101,747.50 raised), IIN Solutions, Der Solarteur, Lion Power, BESS Wehr, PCaVision, Valorem Energies Finland, Taito Learning, Ginolis, Rainmaker, Solarpark Oberthal, Huuva, Fountain Fuel, Askel Healthcare, Pure Power, Blue Farm, Bilihome, eFlexFuel ("Price per convertible bond €250", 5 years, 10.00%), MIFCOM, Osgenic ("Price per convertible bond €250", 5 years, 10.00%), STIL, Koite Health, Resonandina Holanda, and the Pre-IPO cards Stripe and Anthropic ("Still private. Now accessible.").
- Pagination over 225 rounds via scrolling (22 captured pages).

## 6. Round detail page [UNKNOWN]

This archive contains no individual funding-round detail page. Round-level structure (documents, KIIS, invest widget, marketing separation) cannot be described from this evidence. The earlier supplied round list (141 round URLs, 125 distinct issuers, 7 login-walled rounds, 1 tentative 404 reading) is classified in [invesdor-full-list-by-project-type.md](invesdor-full-list-by-project-type.md); treat those classifications as qualified evidence, not platform-universal conclusions. Capture round pages next time if you want this section filled.

## 7. Investor journey [OBSERVED: instrument pages S-004..S-046 + help-center FAQ S-150..S-233, cited per step]

1. **Registration** (S-011 step 1, S-083/084): register with email; a "registration successful" page; an activation link email (its capture filename carries an activation token, redacted as S-084). Login persists as "My Invesdor" in the header.
2. **First investment offer, then verification** (FAQ identity articles, S-166..S-171): identity verification starts after you submit your first investment offer - open the offer in the investor account and click "Complete now". Verification runs through Onfido (digital identity verification and identity-document updates) or Deutsche Post (online or in person); re-verification is required when the stored document expires. KYC/AML is stated as a legal duty of a regulated platform.
3. **Investor self-assessment** (S-004): a "What type of investor are you?" block (profitability/security/liquidity preferences) on the investor overview page. Whether a formal ECSP entry knowledge test and loss-capacity simulation exist is [UNKNOWN] - not captured.
4. **Investing** (S-005, FAQ investing articles S-176..S-191): investment documents are on the funding-round page; subscription is digital. An investment offer stays "open" until the round has fully ended and the financing amount is paid out to the company; only then is it completed. **Oversubscription:** once the original financing amount is reached, further offers are collected up to a defined oversubscription volume; after the round and the statutory revocation period, freed places go to oversubscription investors first-come-first-served [SITE-CLAIM, FAQ oversubscription article]. A statutory revocation period is referenced; its length is not stated in the captured articles [UNKNOWN]. Funds already paid are repaid in full on revocation or cancellation, via the original payment method or stored bank account.
5. **Payment** (FAQ S-176..S-188): SEPA bank transfer is the required baseline; depending on the investor's country, online banking or instant bank transfer are available through payment service providers. One article covers a Buckaroo transfer (Dutch PSP). Payment-received confirmation by email; multiple payments per investment covered; voucher codes can be redeemed against investments (three voucher articles). The checkout screens themselves are [UNKNOWN].
6. **Custody** (S-005, FAQ S-185..S-187): tokenized investments are represented on the Stellar blockchain via smart contracts; custody via specialised custodians (Tangany, BaFin-regulated named); no own external wallet needed. Bond subscriptions are saved in the Invesdor profile or, if possible, deposited in the investor's securities account [SITE-CLAIM].
7. **Portfolio and reporting** (S-085, S-087, S-243..S-247 + FAQ portfolio articles): account home offers Portfolio management ("View portfolio", "Invest in a new project") and Profile management ("View profile") cards plus a support contact card and the open-rounds grid. The portfolio area (labeled "Portfolio Beta" in the German UI) has sections Angebote (offers) / Übersicht (overview) / Zahlungen (payments) / Investments: an open-bids table (project, invested-on date, amount, conditions - interest and term, status e.g. "Zahlungseingang bestätigt" = payment received), and an investments overview with Aktuell/Allzeit (current/all-time) tabs, instrument filter chips (Gesamt/Festzins/Beteiligungen = all/fixed-interest/participations), a tax-documents link and a "Portfolio (.zip)" download. The FAQ portfolio-export article describes a generated export with worksheets for basic investment data, interest and repayment payments, and per-project status updates. Separate captures cover per-investment information/documents, payouts, profile management and tax documents (S-244..S-247; only S-243 visually verified). Personal holdings visible in the authenticated captures are deliberately not reproduced here.
8. **Eligibility restrictions** (FAQ eligibility articles): US tax-liable persons (US citizenship, US tax identification number, Green Card, US tax residence) and certain US-connected companies cannot invest [SITE-CLAIM]. Tokenization, custody and wallet articles sit in the same category.
9. **Transfers, inheritance, selling** (FAQ S-220s): articles cover selling/gifting/transferring investments, transfer costs, death of an investor and heir documents; the archive's article texts for this category were captured but not fully text-analysed at publication time - mechanics [UNKNOWN] beyond the topic coverage.
10. **Account lifecycle** (FAQ profile articles S-151..S-164): email change self-service in "Manage profile"; sensitive changes (e.g. name) go through manual support review; repayment-account changes require proof and take up to two working days to verify; tax-residency changes require proof and review; newsletter language/settings in the profile; accounts cannot be transferred to another person (AML); account and data deletion via service email subject to statutory retention. A business-account payment article exists (company payments from a business account).
11. **Support:** FAQ answers carry per-article helpfulness voting ("Was this article helpful? Yes / No"); the contact page (S-147) and the in-account "Questions?" card route to Investor Relations; a SUPPORT button sits in the authenticated top bar (S-243).

## 7A. Authenticated account area [OBSERVED: S-085..S-087 + S-243..S-247; only S-085 and S-243 visually verified]

Described in section 7 step 7. Personal identifiers and holdings in these captures (the account belongs to you) are not reproduced. Structural notes worth copying [PROPOSED reading]: offers vs completed investments are separate lists with explicit per-offer status; the portfolio is labeled Beta with a feedback banner; tax documents live in the profile, one click from the portfolio; a one-click full-portfolio export (.zip) is always available.

## 8. Issuer journey [OBSERVED: funding pages S-047..S-079; S-048 verified visually]

1. Entry: "Start funding request" / "Contact us for funding" CTAs and a funding-request form page (S-079; form fields not text-analysed).
2. Segment pages with tailored pitches: SME (S-048..057), real estate (S-058..071), start-ups and scale-ups (S-072..077), renewable energy (S-078).
3. **SME funding-round criteria as stated** [SITE-CLAIM, S-048]: ability to service the debt; on the market for at least a few years; turnover preferably EUR 1 million; minimum funding volume EUR 500,000; realistic, comprehensible business plan; based in the European Economic Area (EEA).
4. **Stated issuer benefits** [SITE-CLAIM, S-048]: alternative to bank loans; fully digital handling of rounds and documentation, including "crypto paper custody"; visibility and customer acquisition; investor screening (AML/KYC "to ensure that your cap table is clean and safe"); an assigned project manager through the whole process; onsite experts covering DACH, Nordics and BeNeLux. "Over 10 years of experience" hosting rounds.
5. **Instrument guidance to issuers** [SITE-CLAIM, S-048]: "The Invesdor bond" - bonds recommended for SMEs, with convertible bonds as an option; tailor-made structure and repayment schedule; repayment bullet or amortizing; early repayment faster than agreed without extra fees; an exit strategy can be included as a repayment option with a predefined share of exit proceeds (lower interest rate in exchange); optional bonus interest payable only when an agreed turnover threshold is reached.
6. Post-funding issuer tooling: the Owners Portal lets companies with equity projects manage shares - maintain investor information, send information to investors, provide annual financial statements and further documents [SITE-CLAIM, FAQ owners-portal article + S-088].
7. Selection discipline claim: "We accept only the top 1% of companies that apply to be listed on our platform" [SITE-CLAIM, S-020].

## 9. Content, education and community [OBSERVED]

- **Academy** (S-090..S-117): module I "Investment knowledge" (investment strategies - short- vs long-term, investment products, further resources; S-091 text-extracted), an investment guide series (13 captures), investment management (7 captures), and "Why Invesdor" (2 captures).
- **Blog** (S-131) with four category pages: Invesdor Insights, Knowledge, Market & Companies, Sustainability (S-132..135).
- **Success stories** (S-121..130): hub plus per-company stories - Biogena, Cityvarasto, EasyApotheke, Evobeam, Falkensteiner, Friends&Brgrs, Heeros, L'Osteria, NEOH.
- **Press** (S-136..138) plus a supplied press release (D-pressrelease, 2 Oct 2025: Invesdor as "Europe's largest impact investment platform" expanding into real estate co-placements; metr PropTech round; Expo Real 2025) [SITE-CLAIM].
- **Jobs** (S-139..145), **Partners** (S-146), **Statistics** (S-089; contents not text-analysed), **Experience** pages (S-080..082; testimonial/experience content, not text-analysed), two newsletter sign-up pages (investor S-148, companies S-149), **Contact** (S-147).
- Impact positioning: FAQ impact articles state selection criteria - ESG alignment plus contribution to at least one UN Sustainable Development Goal [SITE-CLAIM, S-232/233 area]; the listing carries an "Impact" tag and an IMPACT filter (69 rounds).

## 10. Compliance surface (what exists, as pages and documents) [OBSERVED]

Which of these are mandatory for your platform depends on your jurisdiction and licence path - verify rather than copy the set:

- ECSPR-licensed badge and Eurocrowd membership on every page (S-001).
- Statutory no-protection disclaimer on the investor overview page: investments under Regulation (EU) 2020/1503 are not protected by deposit guarantee schemes (Directive 2014/49/EU) or investor compensation schemes (Directive 97/9/EC) [OBSERVED, S-004].
- Terms and conditions (S-234), data privacy in four captures (S-235..238), legal notice (S-239), complaint management (S-240) with the standard EU complaint-submission form (D-complaints: complainant personal data incl. LEI for entities, contact details, structured complaint fields), conflict of interest (S-241), accessibility statement (S-242). The long-form contents of S-234..S-238 were captured but not text-analysed at publication time.
- KYC/AML identity verification (Onfido, Deutsche Post; re-verification on document expiry) [section 7 step 2].
- Risk framing on instrument pages: "The interest rate - or the target return - reflects the risk and return of the investment" (S-020); per-instrument FAQ accordions with risk questions (e.g. "Is the risk higher with shares than with subordinated loans?", S-011).
- Qualified subordination as a stated platform rule for all brokered profit participation rights (S-017; section 11).
- US-person exclusion (section 7 step 8).
- GDPR rights article and data-processing/security articles in the help center (S-172..S-175 area).
- Per-article helpfulness voting and "Stay informed" consent-based newsletter sign-up.

## 11. Your instrument categories - observed implementations

Your unified hierarchy (as supplied 2026-10-30): participation-side parents (1-4), then Debt - 5 Loan and 6 Bond, each with seniority states (senior / subordinated / unspecified) - plus structure overlays (zero-coupon, convertible) and rank/label qualifiers kept as site wording. Invesdor's own listing taxonomy (S-003) mixes axes: FIXED INTEREST (65) and PARTICIPATION (160) vs CORPORATE DEBT (45) and CORPORATE EQUITY (157), PRE-IPO (3), plus sector chips and the IMPACT tag. Keep instrument, financing purpose, property type and industry as separate axes in your model - Invesdor's chips are marketing navigation, not a clean instrument taxonomy.

### 1. Participation right / certificate [OBSERVED]

- Profit participation rights page (S-017..019): the investor participates in the company's annual net profit with a percentage calculated from the invested amount; the subscribed capital also participates in losses up to the full amount. **All profit participation rights brokered via Invesdor carry qualified subordination** [SITE-CLAIM, S-017]: no claim to remuneration or repayment insofar and as long as the company has negative equity or payment would cause insolvency. This is your "qualified/qualifiziert" qualifier applied platform-wide to one instrument - preserve it as a qualifier, not a separate instrument.
- The listing's PARTICIPATION chip (160 rounds) is the largest instrument group.

### 2. Share [OBSERVED]

- Shares page (S-011..016, verified visually on S-011): 3 steps - registration, investment (documents on the project page), subscription closing. After investing, the investor receives the certificate of subscription and the invoice by email and becomes a shareholder after acceptance of the certificate and registration of the capital increase in the commercial register [SITE-CLAIM]. Profit via dividends, increased valuation, or a future listing/exit [SITE-CLAIM].
- Equity cards carry price per share, pre-money valuation and "equity offered up to N%" (section 5).

### 3. Indirect participation - an ownership structure [OBSERVED in spirit]

- Pre-IPO investments (S-027..034): access to late-stage private companies "through a structured investment product" from EUR 250; "You do not acquire shares in the target company directly" - the instrument provides economic exposure; returns linked to company valuation at a liquidity event (IPO, acquisition, secondary sale) [SITE-CLAIM, S-027]. The exact legal wrapper is not stated on the captured pages [UNKNOWN]; classify the wrapper, not the label. Stripe and Anthropic cards show "Price per bond €250" with "Return of bond: linked to entry and exit valuation" - site wording preserved; the bond label here does not establish a plain debt instrument.
- The private-equity page (S-025/026) and equity-investments page (S-021) exist; contents not text-analysed at publication time.

### 4. Limited partnership interest [NOT SEEN IN THIS ARCHIVE]

### 5. Loan

- No dedicated loan product page was captured. The profit-participation-rights text refers to "the term of the loan" under its subordination clause, and the help center has a receivables-management article; the SME page calls the SME bond's repayment "the repayment of the loan" (bullet or amortizing) [SITE-CLAIM, S-048]. The full supplied list classifies loan-labelled rounds separately (see the full-list report). Seniority is not stated in the captured card fields - do not promote unspecified debt to senior by inference.

### 6. Bond [OBSERVED]

- Bonds page (S-005..010): fixed percentage "coupon" paid annually over the term; digital subscription on the funding-round page; after issue, bonds are saved in the Invesdor profile or - if possible - deposited in the investor's securities account [SITE-CLAIM]. Fixed-income page (S-020): "annual interest rates up to 10%" and predictable fixed terms [SITE-CLAIM].
- Convertible overlay [OBSERVED]: eFlexFuel and Osgenic cards show "Price per convertible bond €250" (5 years, 10.00% p.a.), and the SME page offers convertible bonds to issuers (S-048). Convertible = overlay on the bond, per your hierarchy; conversion mechanics are not captured [UNKNOWN].
- Seniority of the observed bonds is not stated in the captured fields [unspecified - do not infer]. The shares-page FAQ question "Is the risk higher with shares than with subordinated loans?" shows the platform also communicates subordinated debt to investors [SITE-CLAIM, S-011].

### Structure overlays and qualifiers

- Convertible: observed (above). Zero-coupon: [NOT SEEN IN THIS ARCHIVE].
- "qualified subordination": observed as a platform-wide rule on profit participation rights (item 1) - keep it a rank qualifier, not an instrument.
- "Impact": a cross-cutting tag/filter with stated ESG + SDG criteria (section 9), independent of instrument.

### Cross-instrument mechanics worth copying structurally [OBSERVED]

- One card schema with per-instrument field subsets (debt: unit price/duration/interest; equity: share price/pre-money/equity offered; Pre-IPO: unit price + return linkage note).
- Status ribbons and live investor counts on cards; "Invest now" only on live rounds; an updates badge surfaces issuer news on the card.
- Oversubscription queue with first-come-first-served backfill after the revocation period (section 7 step 4).
- Offer vs completed-investment separation in the portfolio, with per-offer payment status.

## 11A. Project types (industry and property type)

The listing exposes only two sector chips (RENEWABLE ENERGY 14, REAL ESTATE 6) plus thematic product pages (medtech S-022, renewable energy S-023, SDGs S-024, solar guide S-046, real-estate crowdfunding S-036..045). The full per-round industry classification (16 categories across 141 round URLs) and the 11-label property-type list - including "Other property types - self-storage" and "Other property types - sea pool / spa complex (tentative)" - are maintained in [invesdor-full-list-by-project-type.md](invesdor-full-list-by-project-type.md) and the cumulative [sites-full-list-by-project-type.md](sites-full-list-by-project-type.md). Those classifications come from the earlier supplied round list with its own qualifiers (7 login-walled rounds, 1 tentative 404 reading); this archive adds no per-round evidence.

## 12. Partner and technical stack [OBSERVED / SITE-CLAIM, from help-center and page statements]

- **Identity verification:** Onfido (digital verification and document updates), Deutsche Post (online or in person) [SITE-CLAIM, FAQ security article listing providers].
- **Payments:** SEPA bank transfer baseline; specialised payment service providers per country; Buckaroo named (Dutch) [SITE-CLAIM, FAQ].
- **Tokenisation:** Stellar blockchain; smart contracts for token creation/distribution [SITE-CLAIM, FAQ tokenization article].
- **Custody:** specialised crypto custodians; Tangany (BaFin-regulated) named [SITE-CLAIM, FAQ custody article].
- **Support:** help-center platform with per-article voting; service email addresses (service@invesdor.de / .com) and Berlin phone in the footer.
- **Investor Relations:** named contact person on instrument pages (Lead Investor Relations).

[PROPOSED] For your Stellar-based design, Invesdor validates the role mapping end to end: ECSP licence + PSP rails + Stellar tokenisation + BaFin-regulated crypto custody, with the wallet abstracted away from retail investors. Which roles you need licensed partners for depends on your jurisdiction and instrument set.

## 13. What the archive does NOT show [UNKNOWN]

- Round detail pages (documents, KIIS, invest widget, marketing separation) - section 6.
- Checkout/payment-method screens; the invest-step UI beyond the FAQ descriptions.
- Formal ECSP entry knowledge test / loss-capacity simulation UI; the statutory revocation period's length and exact mechanics.
- Admin and issuer backends (campaign builder, KYC review, reconciliation); the Owners Portal interior.
- Fee schedule for investors or issuers.
- Full text of terms, privacy policy and legal notice (captured, not text-analysed at publication time); private-equity, crowdfunding and real-estate-crowdfunding page bodies; experience and statistics page bodies.
- Which specific rounds are tokenized on Stellar vs conventionally registered.

## 14. Proposed implementation specification for your platform [PROPOSED - not observed Invesdor internals]

The CONDA blueprint's section 14 model (entities, state machines, roles, validation, security, acceptance criteria, MVP split) applies unchanged as the base. Invesdor-specific adjustments derived from this archive:

- **InvestmentOrder states:** draft -> submitted (open offer) -> payment-pending -> paid ("Zahlungseingang bestätigt") -> verification-pending -> bound (revocation period running) -> completed (round ended AND payout executed). Oversubscription offers sit in a FIFO queue promoted on freed places. Cancellation paths: revoked-in-period (full repayment via original route), campaign-failed -> refunded.
- **Verification gating:** allow browsing and even a first offer before KYC; gate completion on verification (Invesdor starts KYC from the open offer). Re-verify on document expiry. Keep sensitive profile fields (name, tax residency, repayment account) behind proof + manual review with a stated SLA (observed: two working days for repayment accounts).
- **Custody abstraction:** no investor wallet; positions held with a regulated custodian and mirrored on-chain; expose "held in profile vs deposited in securities account" where the instrument allows conventional deposit.
- **Portfolio:** offers vs investments as separate sections; instrument filter chips (all / fixed-interest / participations); current vs all-time tabs; per-investment documents and payouts; always-fresh full export; tax documents in the profile. Label beta surfaces honestly and keep a feedback channel.
- **Issuer side:** segment-specific eligibility criteria as data (the SME list in section 8 is a good template); recommended-instrument guidance per segment; an Owners-Portal-style issuer area for equity rounds (investor data, updates, annual statements).
- **Listing taxonomy:** keep instrument, seniority, sector and impact as separate axes with combinable filters; do not copy Invesdor's mixed chip set.

## 15. Open decisions for you [PROPOSED]

- Licence path (own ECSP vs partnership) - decides which compliance features you own.
- Whether offers can precede KYC (conversion-friendly, observed here) vs verify-first (CONDA-style).
- Oversubscription policy: allow with FIFO backfill (observed) vs hard cap (your current all-or-nothing contract design).
- Custody model: regulated custodian with wallet abstraction (observed) vs user self-custody (Freighter in your current prototype) - and what that means for the Stellar token's legal status per instrument and jurisdiction.
- Repayment-account verification and manual-review SLAs you want to promise.
- Whether to adopt an impact/SDG tag and criteria as a first-class campaign attribute.

## 16. Source index

**S-ids** cite exact archive filenames; the companion CSV `invesdor-source-index.csv` carries the full mapping (source_id, archive_filename), one row per archive file, 249 rows. S-084's filename contains a live account-activation token in the archive; it is redacted here and in the CSV. **D-ids** cite the two document PDFs (bare `D` source_id in the CSV, as in the CONDA/Dagobert indexes).

- S-001..S-002 - homepage (verified visually)
- S-003 - investment-opportunities listing "Funding rounds" (22 pages; pages 1-5 verified visually)
- S-004..S-046 - investor product pages: overview, bonds, shares, profit participation rights, fixed income, equity investments, medtech, renewable energy, SDGs, private equity, Pre-IPO, crowdfunding, real-estate crowdfunding, solar guide
- S-047..S-079 - company/funding pages: overview, SME, real estate, start-ups and scale-ups, renewable energy, funding request
- S-080..S-082 - experience pages
- S-083..S-084 - registration-successful, user-activation (filename token redacted)
- S-085..S-087 - authenticated account home, profile, portfolio
- S-088 - Owners Portal landing
- S-089 - statistics
- S-090..S-117 - Academy hub and modules
- S-118..S-120 - about us, mission
- S-121..S-130 - success stories hub + 9 stories
- S-131..S-135 - blog + 4 categories
- S-136..S-138 - press
- S-139..S-145 - jobs
- S-146..S-149 - partners, contact, newsletters
- S-150..S-233 - help center (FAQ): category landings and one expanded answer per capture across Profile & Account, Identity Verification, Security/Privacy/Regulation, Investing & Payments, Eligibility & Risks, Portfolio & Documents, Transfers/Inheritance/Selling, Impact Investing
- S-234..S-242 - legal pages: terms, data privacy (4), legal notice, complaint management, conflict of interest, accessibility statement
- S-243..S-247 - authenticated German-UI account screenshots: portfolio (verified visually), investment information/documents, payouts, profile management, tax documents
- D-complaints = `a44b135f-af3f-4733-924a-ef78e8bc4cae_complaints_form_eng.pdf` (standard EU complaint form, text-extracted)
- D-pressrelease = `9478b6dd-2c05-48b2-8482-011640063295_Pressemitteilung-Real-Expo-2025--Engl---Englisch.pdf` (2 Oct 2025 press release, text-extracted)
