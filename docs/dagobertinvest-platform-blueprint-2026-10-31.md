# dagobertinvest - Platform and Feature Blueprint

**Purpose:** detailed description of the dagobertinvest platform (dagobertinvest.com) - pages, features, user journeys and instrument structures - as reference material for building your own crowdfunding / RWA investment platform. Companion to [conda-capital-platform-blueprint-2026-10-30.md](conda-capital-platform-blueprint-2026-10-30.md); the two documents use the same structure and labels so features can be compared section by section.
**Evidence base:** two archives supplied on 2026-10-30/31. `Dagobertinvest.zip` (431 MB, 117 files): 82 full-page screencaptures of dagobertinvest.com and its auxiliary hosts taken 2026-10-30, plus 35 platform, issuer and project PDF documents. `dagobertinvest2.zip` (6.8 MB): 5 full-page screencaptures of the authenticated investor account area taken 2026-10-30 (section 7A). Every load-bearing statement cites its source: **[S-xxx]** = screencapture file (see source index), **[D-name §n]** = PDF document + section. Campaign-page anatomy (investment overview, calculator, funding parameters, security notes) was verified against OCR of the full-page capture images, not only the marketing text.
**Labels:** [OBSERVED] = visible in the cited archive evidence. [SITE-CLAIM] = stated on the website or in a dated document; not independently re-verified against a live register. [PROPOSED] = my design recommendation for your build, not a claim about dagobertinvest. [UNKNOWN] = not visible in the archive.
**Also in this folder:** [dagobertinvest-sitemap.md](dagobertinvest-sitemap.md) (945-URL verified sitemap inventory, collected 2026-10-30) and [dagobertinvest-full-list-by-project-type.md](dagobertinvest-full-list-by-project-type.md) + CSV (347-row supplied campaign list, per-row classification). Those are verified context; this blueprint adds the page-, journey- and document-level analysis of the archive.

> Use this as a specification reference, not as source text. Do not copy dagobertinvest's branding, texts, legal documents or campaign content. Summaries of dagobertinvest's legal documents below are paraphrases for analysis.

---

## 1. What the platform is

dagobertinvest is an Austrian ECSP-licensed crowdfunding platform focused on real-estate project finance (with some corporate finance), investments from EUR 100 [OBSERVED, S-003 homepage]. Tagline: "invest smarter - secure. compliant. direct." [OBSERVED, S-003, S-084].

Entities seen in the archive (keep them distinct):

- **dagobertinvest gmbh** (Vienna, FN 444877 g, UID ATU70177426, LEI 9845005EME6D1B2E2D53, Wohllebengasse 12-14, 1040 Wien) - the platform operator named in the Impressum [OBSERVED, S-039] and in the platform T&Cs [D-AGB_DE_02_2025 header]. The Impressum states authorisation by the Austrian FMA as a European crowdfunding service provider under Art. 12 of Regulation (EU) 2020/1503, for (i) loan facilitation without individual portfolio management and (ii) placement without firm commitment of transferable securities and admitted instruments plus reception and transmission of orders; it points to the ESMA register (keyword "dagobertinvest") [SITE-CLAIM, S-039]. Footer badge: "Erste österreichische Crowdfunding-Plattform mit ECSP-Lizenz der FMA" / "ECSP-LIZENZ - FMA 2023" [SITE-CLAIM, S-003, S-033].
- **dagobertinvest service gmbh ("DIS")** - the group's own collection/security agent ("Inkassoinstitut"): exercises investor rights under the Servicevertrag, holds Grundpfand (mortgage) security rights in its own name on investors' account, and acts for investors when projects deviate from plan [OBSERVED, S-016 security note, S-028 Safeguard page, S-022 explainer]. Service fee: 0.5% p.a. of the investment [SITE-CLAIM, S-033].
- **dagobertinvest AG** - the group holding that runs its own share emissions; registration marketing consent passes name and email to the AG [OBSERVED, S-068, S-083]. Which entity owns which shares is not resolvable from the archive.

Business parameters as stated by the platform itself:

- Homepage counters: "> EUR 167 Mio. vermitteltes Kapital", "> 370 Projekte", "> 150.000" (transactions per the business portal's caption) [OBSERVED, S-003, S-002].
- Licence scope as marketed: brokerage of loans and of securities up to EUR 5.0 million per case [SITE-CLAIM, S-077]. Treat this as dagobertinvest's stated scope; your own cap depends on your licence path.
- Positioning: "keine Anlageberatung, sondern einen Marktplatz" - a marketplace, not investment advice; investors decide on their own responsibility [SITE-CLAIM, S-033]. The platform guarantees correct subscription, contractual settlement and money transfer to the issuer, "nicht jedoch den Projekterfolg selbst" [SITE-CLAIM, S-077].
- Default-rate disclosure (ECSP-mandated): 16.67% across business years 2023-2025 (2025: 3 of 6 projects in default; 2024 and 2023: 0 of 0), where default = repayment obligation overdue >90 days past the (extended) loan term [OBSERVED, S-008].
- Self-description as one of three platforms in the German-speaking area operating under an ECSP licence [SITE-CLAIM, S-022].
- Platform history: operating since 2016 (pre-ECSP under the Austrian AltFG regime), FMA-regulated under ECSP since 2023; team of 10-12 [SITE-CLAIM, S-002, S-083]. Legacy complaint flow splits projects P100-P499 ("bis Mitte 2023 über die Plattform zeichenbar") from P500+ [OBSERVED, S-010].
- The platform also runs its **own share emissions** for dagobertinvest AG (2022: 5,000 shares via partner platform INVESDOR, 460+ new shareholders; 2023: 3,000 shares; 2025: shares at EUR 50) [OBSERVED, S-083, S-007], and an issuer-facing white-label/"Eigenemission" offering (section 8).

---

## 2. Site map [OBSERVED]

The complete verified URL inventory (945 sitemap URLs: 18 core pages, 369 campaign detail pages, 39 landing/marketing pages, 23 location pages, 438 blog posts, 58 press items, plus observed auth routes) is in [dagobertinvest-sitemap.md](dagobertinvest-sitemap.md). What follows is the functional map as captured.

**Public site (German; some EN/PL marketing variants):** home `/` (S-003), campaign listing `/kampagnen` (S-041), how-it-works `/geld-anlegen-nach-dem-dagobert-prinzip` (S-033), explainer `/crowdinvesting-erklaert` (S-022), about `/ueber-dagobertinvest` (S-077), risk disclosure `/risikohinweis` (S-073), conflicts of interest `/interessenskonflikte` (S-040), FAQ `/faq` (S-031, S-032), glossary `/glossar` (S-035), blog index `/blog` (S-011, S-012), press `/presse` (S-067), contact `/kontakt` (S-042), newsletter signup `/newsletter` (S-063), ECSP disclosures: completed raises `/abgewickelte-kapitalaufnahmen` (S-005) and defaults `/ausfaelle-gemaess-ecsp-vo` (S-008), complaints `/beschwerde/übersicht` (S-010), legal: Impressum (S-039), Datenschutz (S-029), AGB (S-006).

**Campaign detail pages** `/crowdfunding-<slug>` and `/crowdinvesting-<slug>` (10 captured in full: S-013..S-020, S-023, S-026). Slug patterns per the sitemap inventory: `-child` = sub-campaign tranche, `-bridge` = bridge financing, `zero-bond` variants = zero-coupon tranches; project numbers P100-P9xx appear in titles and complaint routing.

**Auth and account:** `/register` 3-step wizard (S-068..S-072), `/login` (S-043), `/password-vergessen` (S-066); per the sitemap review: `/login/two-factor-challenge(+ /email)`, and ich.app e-ID sign-in routes `/ich.app/login` / `/ich.app/register`. The logged-in account area (S-084..S-087, S-083) is described in section 7A.

**Auxiliary hosts observed:** `business.dagobertinvest.com` - issuer-facing "Eigenemission" portal (S-002); `km.dagobertinvest.com` - CRM host, returns HTTP 403 to anonymous access (S-081, S-082; also serves campaign images per the sitemap review); a capture of the CRM vendor's own product site, 1Tool (S-001), indicating the CRM in use.

**Marketing surface:** ~25 ad landing pages (`lp-*`, `OFF-lp-*`) targeting DE/AT/CH/PL audiences and bank-customer segments, with variants for first-investment bonuses and cash bonuses (S-004, S-024, S-025, S-047..S-061, and others in the source index); platform comparison page (S-078); tipster/cooperation page `/tippgeber-kooperation` (S-075); ESG page (S-030); Safeguard program page (S-028); "Aktionär werden" investor-relations page for the AG's own shares (S-007); location content pages (`standortbeschreibung-*`, e.g. S-074).

---

## 3. Persistent UI elements [OBSERVED, verified on S-003 and campaign pages]

- Header: logo, nav "in Projekte investieren | dagobert Prinzip | So funktioniert's | Mein Konto" (public) or "Login / Registrieren" when signed out (S-068); logged-in header adds the account-area links (section 7A). Language switcher present (EN seen on account pages).
- Top risk banner (ECSP-required): "Die auf dieser Plattform angebotenen Schwarmfinanzierungsdienstleistungen sind nicht durch die gemäß Richtlinie 2014/49/EU geschaffenen Einlagensicherungssysteme geschützt. Die auf der Plattform angebotenen, übertragbaren Wertpapiere, sind nicht durch die gemäß der Richtlinie 97/9/EG geschaffenen Anlegerentschädigungssysteme geschützt." [S-041, S-028].
- Withdrawal notice on campaign pages: "Anleger haben 4 Tage Bedenkzeit, um das Angebot zu widerrufen. Verbraucher haben innerhalb von 14 Tagen nach Abschluss des Vertrages ein Rücktrittsrecht." - free cancellation via dashboard or email, no reasons required [S-015, S-018, S-019].
- Footer, two variants. Public footer: contact block (address, phone +43 720 072 821, hello@dagobertinvest.com), ECSP-Lizenz-FMA-2023 badge, links (Risikohinweis, Interessenskonflikte, FAQ's, Blog, Glossar, Ausfälle gemäß ECSP-VO, Beschwerdemanagement), social (Facebook, LinkedIn, Instagram, YouTube) [S-003]. Account-area footer adds "Kundiger Anleger" (sophisticated-investor entry) and bottom line "© dagobertinvest 2026 Impressum Datenschutzerklärung AGB" [S-084].
- "ALFinGuide" - "Ihr digitaler Guide, der Sie zu den smarten Investments begleitet" - a guide/concierge element on the homepage [S-003].

---

## 4. Homepage anatomy [OBSERVED, S-003]

1. Hero: "Smarter investieren - transparent, rechtssicher und direkt", ALFinGuide mention.
2. Three value cards: invest EUR 100 to EUR 100.000 in projects of experienced project developers; "Hohe Zinsen" - interest rate set by the issuer, starting immediately after payment, with portfolio and documents in the personal dashboard; "Unternehmensfinanzierungen".
3. Counters: > EUR 167 Mio. intermediated capital, > 370 projects, > 150.000.
4. "Aktuelle Kampagnen" teaser grid (two cards shown "Bald verfügbar" at capture time) + "Alle Kampagnen" link.
5. Newsletter signup block: first name/email, privacy checkbox, reCAPTCHA ("Ich bin kein Roboter").
6. Split CTA: "Ich möchte investieren" / "Ich suche Kapital" (issuer funnel entry), plus "Abgewickelte Kapitalaufnahmen" and "Zu den Projekten" links.
7. Footer as section 3.

## 5. Campaign listing (/kampagnen) [OBSERVED, S-041]

- Title "Aktuelle Kampagnen"; the statutory no-deposit-protection banner renders directly under the title.
- At capture time both visible cards showed "Bald verfügbar" (projects P553 and P570 as upcoming, per the sitemap review); "Alle Kampagnen" link to the full grid.
- Card fields visible at capture: project image, "Bald verfügbar" status chip; richer card anatomy (rate, term, invested amount, progress) is visible on the completed-raises page cards (S-005: project number + title, "ZINSEN / LAUFZEIT" pairs, e.g. 8,00% p.a./60 Monate, 13,00% p.a./24 Monate, Disagio 14,00%/12 Monate) and on campaign pages themselves. Filter/search controls on the live list: [UNKNOWN] in this archive.
- Closed-campaign discovery is routed through `/abgewickelte-kapitalaufnahmen` (ECSP disclosure) rather than the listing page.

---

## 6. Campaign detail page [OBSERVED on 10 full captures: S-013..S-020, S-023, S-026; anatomy verified on OCR of the page images]

**Breadcrumb and header:** "dagobertinvest > in Projekte investieren > <campaign name>"; campaign title; on secured campaigns a "SAFEGUARD PROGRAM" seal; on mortgage-secured campaigns a security note box: the Grundpfandrecht is registered not in the investor's favour but in favour of the security trustee ("DIS", engaged via Servicevertrag); DIS exercises the rights in its own name on the investor's account; the investor has a contractual claim against DIS for payout of realisation proceeds minus enforcement costs [S-016].

**INVESTITIONSÜBERSICHT (investment overview panel):** Projektstatus with progress bar (observed values: "Zurückbezahlt" at 100%, "Verspätet" (delayed)), headline rate and term ("24,00% p.a. / 5 Monate", "9,00% p.a. / 15 Monate", "Disagio 18,00% / 12 Monate"), Investiert amount, Fundingschwelle (threshold; "—" when none), Fundinglimit (cap), and **Veranlagungsform** (instrument label: "Mini Bond - nachrangige Anleihe", "Zero Bond", "Senior Loan", "Qualifiziertes Nachrangdarlehen"). Some pages show the issuer's track record in-line ("7 Fundingkampagnen zurückbezahlt") and a "Projekt-Kennnummer" (project ID, e.g. 9845005EME6D1B2E2D5300000550 - the platform LEI plus a project suffix) [S-015, S-016, S-018, S-013, S-023].

**"EINFACH VERDIENT" calculator:** amount input ("Meine Investitionssumme"), computed expected repayment ("Mein voraussichtlicher Rückzahlungsbetrag"), rate display, note "Die Verzinsung Ihrer Investition beginnt unmittelbar nach Ihrer Einzahlung" [S-015, S-013]. Zero Bond pages instead explain the discount mechanics with a worked example: EUR 10.000 nominal bought at EUR 8.200 (18% Disagio), redeemable at EUR 10.000 after 12 months - "82% of the nominal value / Output value (actual payment) / Nominal value (redemption price)" [S-016].

**Content sections in order (variant by campaign age/type):** PROJEKTTRÄGER (issuer profile incl. legal name, history, track record, managing director with name and photo), IHR PARTNER (partner company), DAS PROJEKT (the property: units, areas, location), DAS INVESTMENT-ANGEBOT / DIE FUNDINGPARAMETER (structured terms list), embedded Google Map, MAKROSTANDORT / MIKROSTANDORT (location marketing text), DOKUMENTE (per-campaign PDF library: Geschäftsplan, Informationsblatt für Anleger, Firmenbuchauszug, Grundbuch, Jahresabschlüsse, Anlagebasisinformationsblatt - the archive's 35 documents originate here), ZUSAMMENFASSUNG (summary key-value grid) [S-013..S-020, S-023].

**Structured terms observed across campaigns** (field names verbatim; values are per-campaign, not platform constants):

- Vertragsform (contract form): "Bridgefinanzierung", "Qualifizierte Anleihe", "qualifiziert nachrangige Anleihe", "Zero Bond" [S-015, S-019, S-018, S-016].
- Funding-Schwelle and Funding-Limit (e.g. EUR 50.000/750.000 on AVENTA bridge; EUR 350.000/400.000 on HST 321; none/100.000 on the HABERENT Zero Bond), Stückelung (unit size, e.g. EUR 50.000), Mindestinvestment (EUR 1.000 on the Zero Bond), Zeichnungsfrist (subscription deadline).
- Laufzeit with a contractually agreed one-time extension option equal to the base term ("5 Monate, mit vertraglich vereinbarter Verlängerungsoption von bis zu 5 Monate"); the explainer page generalises extensions to a maximum of 6 months [S-015, S-018, S-022].
- Verzinsung: short bridge loans quote **monthly** standard interest ("2% p.m." displayed as 24,00% p.a.; "3% p.m." as 36,00% p.a.); longer campaigns quote p.a. rates (7,25-13% p.a.); Zero Bonds quote a Disagio (14-18%) instead of interest [S-019, S-015, S-023, S-016, S-005].
- Zins- und Kapitalrückzahlung: "Endfällige Zins- und Kapitalrückzahlung" (bullet at maturity) on all observed campaigns.
- Security fields: "Security Scoring: AA" (HABERENT), Safeguard seal, Grundpfand/security-trustee note [S-016].
- Typus (financing purpose): "Projektfinanzierung", "Ankaufsfinanzierung", "Unternehmensfinanzierung", "Bestandsfinanzierung" [S-016, S-018, S-019].
- ZUSAMMENFASSUNG property fields: Adresse, Grundstücksfläche, Nutzfläche, Projektvolumen, Bauart (Neubau/Revitalisierung), Objekt, Verwertungsstatus, Aktueller Status, Baugenehmigung, Finanzierung; issuer fields: Emittent, Gesellschaftsform, Gründungsjahr, Firmensitz, Gesellschafter/Wirtschaftlicher Eigentümer, Geschäftsführer, Branchenerfahrung [S-015, S-018].

**Marketing/content separation:** unlike CONDA's explicit MARKETING-CONTENT divider, no such divider is visible on these captures; issuer marketing text and platform data fields interleave [OBSERVED; compare CONDA blueprint section 6]. [PROPOSED: keep the divider in your own design.]

---

## 7. Investor journey [OBSERVED: captures S-068..S-072, S-043, S-066, S-084..S-087 + documents cited per step]

1. **Registration** (S-068..S-072): 3-step wizard "Account anlegen -> Account bestätigen -> Willkommen" with client-side validation (Parsley). Fields: Geschlecht, Vor-/Nachname, E-Mail, Telefon, address (Straße/Hausnummer, PLZ, Ort, Land), Geburtsdatum, password (min 8 chars, one uppercase, one number or symbol), Kommunikationssprache (language for newsletters/info). Consents: optional project-info opt-in; required AGB consent including name+email sharing with dagobertinvest AG for marketing, revocable (T&Cs provide the revocation) [S-068, D-AGB_DE_02_2025]. reCAPTCHA. Alternative: register/sign in with the Austrian e-ID app ("Mit der ich.app registrieren"). T&Cs require registration under the true full name (Klarname) [D-AGB_DE_02_2025 §registration].
2. **Tiered access after signup** (S-072 welcome screen): immediately invest "bis zu EUR 1.000"; above EUR 1.000 requires additional data ("Aus rechtlichen Gründen brauchen wir zusätzliche Daten von Ihnen, wenn Sie über EUR 1.000 investieren möchten" - "Zusätzliche Daten eingeben"). The welcome screen links the Investitionsleitfaden (guide PDF, D-Investitionsleitfaden) and notes the page is re-readable under "mein konto -> Erste Schritte". The profile checklist mirrors this gating (section 7A).
3. **Suitability/appropriateness data** (S-087 profile sections): "Kenntnisse & Erfahrungen" (knowledge/experience), "Simulation möglicher Verluste" (loss-bearing simulation), "Mittelherkunft" (source of funds) - the ECSP Art. 21 entry-knowledge test and loss simulation pattern, here as profile sections rather than a separate flow. "Kundiger Anleger" (sophisticated investor) appears as a distinct footer entry in the account area [S-084]. Which answers unlock which limits is [UNKNOWN].
4. **Investing**: campaign page -> amount -> binding offer. The ABIB (ECSP key investment information sheet, D-ABIB) presents the risk warnings and the reflection-period notice before investment: non-sophisticated investors may revoke their offer within four calendar days from the offer, without reason or penalty [D-ABIB "Vorvertragliche Bedenkzeit"]. The campaign pages repeat this plus a 14-day consumer withdrawal right, both exercisable in the dashboard or by email [S-015]. The invest/checkout screens themselves (payment method selection, confirmation) are [UNKNOWN] - not captured.
5. **Payment**: the T&Cs state that all platform payments to the user go only to a reference account held in the user's own name, and allow the operator to involve payment service providers, collection agencies and banks in settlement [D-AGB_DE_02_2025 §4.3, §5]. The legacy VermAnlG-era document set shows the older mechanics: investor funds land on the issuer's "Funding-Konto" and the loan is concluded within three bank working days of receipt, with payout conditions (funding end + 15 days without the minimum being undercut by withdrawals) [D-VIB_P281 §4]. Current payment rails/providers: [UNKNOWN].
6. **During the term**: issuer progress reports via the campaign News area; the explainer promises regular project reporting and DIS intervention on schedule deviations [S-022]; the dashboard's Nachrichten area carries the updates (section 7A). Extension decisions are announced on the platform per the loan terms [D-VIB_P281 §4].
7. **Repayment**: bullet repayment of interest and principal at the (possibly extended) end of term ("Endfällige Zins- und Kapitalrückzahlung" on all observed campaigns); the explainer describes the unconditional repayment claim and DIS support in enforcement [S-022]. Yearly tax statements ("Aufstellungen") are downloadable from the dashboard, with a note that issuer-provided statements for reclaiming withheld tax may be found under "Alle Investitionen -> Details -> Dokumente" [S-084].
8. **Account lifecycle**: account deletion self-service under "Mein Konto -> Profildaten -> Sicherheit -> Konto löschen" [D-AGB_DE_02_2025 §4]; password reset via `/password-vergessen` (email field) [S-066]; 2FA via email code routes exist (sitemap review).

## 7A. Investor account area - authenticated dashboard [OBSERVED: supplied logged-in captures S-083..S-087, taken 2026-10-30]

Five captures, supplied separately (`dagobertinvest2.zip`), show the logged-in investor area on an account with no investments yet. UI wording below is quoted verbatim; personal identifiers visible in the captures are not reproduced.

**Navigation** [S-084]: account-area header links DASHBOARD | NACHRICHTEN | REFERRAL PROGRAM | PROFILDATEN | DAGOBERTINVEST AG; greeting "WILLKOMMEN, HERR <NAME>"; the public header/footer frame stays around the account pages.

**Dashboard** [S-084]: "AKTUELLE INVESTITIONSMÖGLICHKEITEN" (empty state: "Keine neuen Investitionsmöglichkeiten."), "LETZTE INVESTITIONEN" (empty: "Noch keine Investitionen."), "AUFSTELLUNGEN" (yearly statement downloads, with the tax-reclaim note), and "ALLE INVESTITIONEN" - a table with columns Projekte | Status | Vertragsart | Investitionen | Vertragsende | bisher zurückbezahlt (contract type and repaid-to-date are first-class columns).

**Profildaten** [S-087]: left menu sections Persönliche Daten / Dokumente / Kenntnisse & Erfahrungen / Simulation möglicher Verluste / Mittelherkunft / Sicherheit / Einstellungen. A three-state checklist on the side: "Alles erledigt!" / "Hier fehlen noch Daten, die zur Rückzahlung Ihres Investments benötigt werden" / "Hier fehlen noch Daten, um Ihnen Investments über EUR 1.000 zu ermöglichen" - data-driven gating of the >EUR 1.000 tier and of payouts. Personal-data form: Benutzer type (Privatperson), Geschlecht, Titel (vor-/nachgestellt), Vor-/Nachname, address fields, Wohnsitzland, Steuerlicher Wohnsitz, Kommunikationssprache, Geburtsdatum, Telefon, E-Mail, with a "Bearbeiten" action.

**Nachrichten** [S-086]: filterable message center. Categories: Projektstarts; Auszahlungen with sub-filters Rückzahlung / Zinszahlung / Teilrückzahlung; dagobert-News (Content, Aktionen); Projekt-News. This is the platform's investor-notification surface for starts, payouts and project news.

**Referral program** [S-085]: "MIT DEM REFERRAL PROGRAM ZU IHREM BONUS" - share a personal referrer link; EUR 75 commission when the referred contact invests at least EUR 250; copy-link widget plus social-share icons; link to program FAQs.

**dagobertinvest AG** [S-083]: an in-account news/offer page for the group's own share emissions ("WIE WERDE ICH AKTIONÄR?"), with dated posts (podcast episode on the current funding round, AI-efficiency posts, 2025 capital-increase offer at EUR 50/share with subscription deadline, 2023/2022 emission recaps) - effectively an IR channel inside the investor area.

## 8. Issuer journey and issuer-facing offering [OBSERVED, with gaps]

- Entry: homepage "Ich suche Kapital" card (S-003) -> business portal `business.dagobertinvest.com` (S-002).
- The business portal sells **"Eigenemission"** (own emission): the issuer promotes its own campaign link to its own customers; no public listing on the platform; dagobertinvest provides the legal vehicle, technical setup and campaign infrastructure, template contracts, ABIB creation, payment processing and security management under its ECSP licence; "bis zu EUR 5 Mio. bankenunabhängig", repeatable and scalable. Process: Kapitalstruktur festlegen -> dagobertinvest übernimmt (setup) -> issuer promotes the link -> Kapital erhalten. CTA "Projekt-Checkup starten". Target segments named: hotels, Fix&Flip developers, Bürgerbeteiligung (municipal/citizen participation) [S-002].
- The sitemap review also shows issuer-side content: 23 location pages and hundreds of blog/press items used for issuer marketing. The actual issuer onboarding flow, campaign-builder backend, KYC-on-issuers and payout execution are [UNKNOWN] - `km.dagobertinvest.com` (CRM, 403 to anonymous) is the likely ops surface [S-081].
- Referral/cooperation: a tipster program page ("Tippgeber-Kooperation", S-075) and the investor referral program (section 7A) cover acquisition partnerships.

---

## 9. Documents and legal architecture [OBSERVED, with document dates]

The 35 PDFs fall into distinct generations and roles; dates and scopes matter - do not generalise one campaign's terms into platform rules:

**Platform-level documents:**

- **AGB_DE_02_2025** (platform T&Cs, version 02/2025): operator is dagobertinvest gmbh ("Erbringung von Schwarmfinanzierungsdienstleistungen"); Klarnamen duty at registration; marketing data sharing with dagobertinvest AG, revocable; payouts only to the user's own reference account; settlement may involve PSPs, collection agencies, banks; self-service account deletion path [D-AGB_DE_02_2025].
- **Datenschutzerklärung_DIV.11.2025** (privacy policy, version 11/2025) [D-Datenschutz].
- Statutory site disclosures captured as pages: Risikohinweis (S-073), Interessenskonflikte (S-040), Ausfälle gemäß ECSP-VO (S-008), Beschwerdemanagement (S-010), Abgewickelte Kapitalaufnahmen (S-005), Impressum (S-039).

**Per-campaign investor documents** (three regulatory generations visible):

1. **Vermögensanlagen-Informationsblatt (VIB)** - German/Austrian VermAnlG-era information sheet (observed version dated 19.03.2021): defines the instrument as an unsecuritised subordinated loan with qualified subordination ("unverbrieftes Nachrangdarlehen mit qualifiziertem Rangrücktritt", § 1 Abs. 2 Nr. 4 VermAnlG), names issuer and platform, earmarks proceeds to the project, and sets the funding mechanics: funding-end conditions, 15-day post-funding withdrawal window protecting the funding minimum (EUR 250.000 on that campaign), no ordinary termination during the term, issuer's right to repay early, issuer withdrawal rights (conditions unmet / AML data missing / payment not received), Funding-Konto at the issuer, loan conclusion within 3 bank working days of receipt [D-VIB_P281 §§1-4].
2. **Informationsblatt für Anleger (IDB)** - AltFG-era Austrian investor sheet (observed IDB-P281): standard risk box (no FMA approval, total-loss risk, no deposit/investor protection, "nicht mehr als 10% Ihres Nettovermögens", liquidity warning), issuer data, offer parameters (funding min/max, subscription period, extension up to 60 days), and the qualified-subordination consequence: repayment claims only enforceable if they do not trigger an insolvency ground [D-IDB_P281].
3. **Anlagebasisinformationsblatt (ABIB)** - ECSP-era key investment information sheet (observed ABIB_DEU_P520): standard ECSP risk box plus the pre-contractual reflection-period notice for non-sophisticated investors (4 calendar days from the offer) [D-ABIB].
- **Investitionsleitfaden** (marketing guide PDF): the platform's own onboarding brochure; markets "8-12% p.a. Zinsen, einen unbedingten Rückzahlungsanspruch und bankübliche Sicherheiten" and explains the crowdloan model [D-Investitionsleitfaden]. [SITE-CLAIM - marketing, not terms.]

**Issuer/project due-diligence documents** (from campaign Dokumente sections, issuer-specific): Geschäftsplan x3, Firmenbuchauszug x5, Jahresabschlüsse (101 pp.), Bilanz x2, Grundbuchauszug x2, Lageexposé x2, Projektzusammenfassung x2, Investorenbrief x4. These establish the document types the platform publishes per campaign (corporate registry extract, land register, financial statements, business plan, location exposé, project summary, investor letter) [D-*; cited per type in the source index].

**Regulatory-generation note** [PROPOSED-relevant, OBSERVED basis]: the archive shows the platform's instrument evolution - AltFG/VermAnlG qualified subordinated loans (P100-P499 era) -> ECSP-era products ("FAQs zu den neuen Produkten": "Warum gibt es kein qualifiziertes Nachrangdarlehen mehr?", "Was ist eine qualifiziert nachrangige Anleihe (Mini Bond)?", "Warum ist mein Investment jetzt nicht mehr kostenlos?" - the service-fee introduction) [S-031]. Keep per-campaign document generation (VIB vs IDB vs ABIB) as data on the campaign, not as a platform-wide assumption.

---

## 10. Your instrument categories - observed implementations

Your unified hierarchy (as supplied on 2026-10-30): participation-side parents 1-4 (participation right/certificate incl. the Substanzgenussrecht subtype 1a, share, indirect participation as an ownership structure, limited partnership interest), then **Debt** - two generic parents, 5 Loan and 6 Bond, with three seniority states each (senior / subordinated / unspecified) - plus two **structure overlays** (zero-coupon, convertible), **rank and label qualifiers** kept as site wording (junior, qualified/qualifiziert, Mini Bond), and **bridge financing as a role overlay**, not an instrument. The numbering below follows that hierarchy.

dagobertinvest's own site vocabulary is the "Veranlagungsform"/"Vertragsform" labels: "Mini Bond - nachrangige Anleihe", "Zero Bond", "Senior Loan", "Qualifiziertes Nachrangdarlehen", "Bridgefinanzierung", "Qualifizierte Anleihe", "qualifiziert nachrangige Anleihe" [OBSERVED, S-013..S-020, S-023]. Across the full supplied 342-campaign list the distribution is: 261 qualified subordinated loans, 27 bridge financings, 21 junior loans, 17 Mini Bonds (subordinated bonds), 12 Zero Bonds, 2 qualified subordinated bonds, 1 senior loan, 1 qualified bond [dagobertinvest-full-list-by-project-type.md section 2]. Which instruments a single ECSP licence may cover is a legal question for your own structure - do not assume dagobertinvest's set transfers. [PROPOSED: verify per instrument and jurisdiction before scoping.]

### 1-4. Participation side [NOT SEEN IN THIS ARCHIVE]

- No campaign in this archive (and none in the 342-campaign supplied list) maps to participation right/certificate, Substanzgenussrecht, share (as issuer instrument), indirect participation, or limited partnership interest. The platform's own dagobertinvest AG share emissions exist (section 7A) but are corporate fundraising by the group itself, mostly via the partner platform INVESDOR, not investor-facing campaigns of the platform's product catalogue [S-083, S-007].

### 5. Loan

- **senior** [OBSERVED, single campaign]: AOC Dessau "Meisterhausblick" - "Veranlagungsform: Senior Loan", 9,00% p.a., 15 months, invested EUR 290.070 vs threshold EUR 100.000 and limit EUR 800.000, status "Verspätet"; documents: Anlagebasisinformationsblatt [S-013]. This is 1 of 342 campaigns in the full list.
- **subordinated (qualified)** [OBSERVED, the dominant legacy form]: MUST-GROUP Heuberg Salzburg - "Veranlagungsform: Qualifiziertes Nachrangdarlehen", 7,75% p.a., 24 months, invested EUR 500.000, threshold 250.000, limit 500.000, status "Verspätet" [S-020, S-026]. Legal anatomy from that campaign's documents: unsecuritised, qualified subordination, enforcement barred while it would trigger insolvency grounds, bullet repayment, one-time extension by issuer decision [D-VIB_P281, D-IDB_P281]. 261 of 342 campaigns in the full list carry this form.
- **subordinated (junior label)**: 21 "Junior loan" campaigns exist in the full list; none is in this archive, so their contractual terms are [UNKNOWN] here; per your hierarchy, "junior" is a rank label indicating subordinated ranking without establishing contractual qualified subordination by itself.
- **unspecified** - no example in the archive.

### 6. Bond

- **senior (non-subordinated)** - no example; the archive's one "Senior Loan" is a loan (5), not a bond.
- **subordinated** [OBSERVED, the current main form]:
  - "Mini Bond - nachrangige Anleihe": AVENTA Traiskirchen bridge - threshold EUR 50.000, limit EUR 750.000 (fully invested), 24,00% p.a. (quoted 2% p.m.), 5 months + 5-month extension option, bullet, status "Zurückbezahlt" [S-015]. HST 321 Wien-Penzing - "Vertragsform: qualifiziert nachrangige Anleihe", threshold EUR 350.000, limit EUR 400.000, 24,00% p.a., 6 months + 6-month option, status "Zurückbezahlt" [S-018]. Löwentor Großhöflein bridge - "Vertragsform: Qualifizierte Anleihe" on a 36,00% p.a. (3% p.m.), 3-month bridge, threshold 50.000, limit 450.000, "Zurückbezahlt" - the label here does not itself say subordinated; per your hierarchy the "qualified" wording alone is not read as qualified subordination [S-019].
  - P-numbered Mini Bond heritage: the HABERENT Zero Bond page notes the issuer's earlier "Mini Bond" of ~EUR 400.000 (P538) for the same project [S-016].
- **unspecified** - no example in the archive.

### Structure overlays

- **Zero-coupon (Zero Bond)** [OBSERVED]: HABERENT Poststr. Luckenwalde "Bestandsfinanzierung (Zero Bond)" - sold at an 18% Disagio (pay EUR 8.200 per EUR 10.000 nominal), 12 months, bullet at nominal, minimum investment EUR 1.000, no funding threshold, limit EUR 100.000, "Security Scoring: AA", Safeguard seal with the DIS security-trustee note, status "Verspätet" [S-016]. The page itself glosses "Nullkuponanleihe, auch bekannt als Zero Bond". Seniority state is not stated on the captured page; the mortgage security is structural, not a seniority statement. 12 Zero Bond campaigns in the full list (incl. ESG-Serie VII/VIII at 14% Disagio, S-005).
- **Convertible** [NOT SEEN IN THIS ARCHIVE] - no campaign carries a conversion feature.

### Rank and label qualifiers (site wording, preserved as-is)

- **"qualifiziert"** appears on both loans and bonds ("Qualifiziertes Nachrangdarlehen", "Qualifizierte Anleihe", "qualifiziert nachrangige Anleihe"); per your hierarchy it is kept as label wording and only read as qualified subordination where the term itself says subordinated (Nachrang).
- **"Mini Bond"** = the platform's small-denomination bond label, always observed here in the combination "Mini Bond - nachrangige Anleihe".
- **"junior"** = Junior loan campaigns in the full list; no captured example.

### Role overlays and platform-specific mechanics worth copying structurally [OBSERVED]

- **Bridge financing** as a financing role: short terms (3-6 months), monthly-quoted high rates, purpose "Ankauf der Liegenschaft", repayment "durch Anschlussfinanzierung" [S-015, S-019]. Keep it a role/purpose field, not an instrument.
- **Extension options** as standard terms: one-time extension equal to base term (up to 6 months per the explainer), announced on the platform [S-022, D-VIB_P281].
- **Security layer per campaign**: Safeguard program = grundbücherliche Sicherstellung via a security trustee (DIS) holding the Grundpfand in its own name on investors' account, plus "Security Scoring" grades and a quality seal [S-028, S-016]. Optional per campaign, not universal.
- **Service-fee model**: 0.5% p.a. of the investment funds DIS's monitoring/enforcement role [S-033, S-031].
- **Project identity**: P-numbers (P281, P538, P553...) plus an LEI-derived project ID; complaint routing splits by P-number era [S-010, S-016].
- **Instrument-aware rate display**: p.a. interest, p.m. interest normalised to p.a., or Disagio with a worked example - the overview panel switches by instrument [S-015, S-016].
- Closed campaigns stay public with final status ("Zurückbezahlt", "Verspätet") and full documents [S-015, S-016].

---

## 10A. Observed campaigns by project type (industry and property axes)

> Scope: this section covers the 10 campaigns captured in the archive. The full supplied list (347 rows, 342 readable campaign pages) is classified on both axes - industry and financing/property type - in [dagobertinvest-full-list-by-project-type.md](dagobertinvest-full-list-by-project-type.md); it is overwhelmingly residential real-estate development, which mirrors the platform's positioning ("erste deutschsprachige auf Immobilien spezialisierte Crowdfunding-Plattform" [D-Investitionsleitfaden]).

All 10 captured campaigns are real-estate projects in Austria or Germany; they differ on the financing-purpose axis (Typus) and the property axis:

- **Bridge / acquisition financing (Ankaufsfinanzierung, bridge role)**: AVENTA Traiskirchen - demolition+new build, 17 units + pharmacy, Graz-based listed developer (S-015); Löwentor Großhöflein - land acquisition, 6 units + 4 houses (S-019); HST 321 Wien-Penzing - Gründerzeit-house purchase for refurbishment/extension (S-018).
- **Existing-property refinancing (Bestandsfinanzierung)**: HABERENT Luckenwalde - revitalised former post building, 23 rented units, 100% let (S-016).
- **Project development / construction (Projektfinanzierung)**: MUST-GROUP Heuberg/Salzburg - 4-unit multi-family new build, 2 of 4 units already sold (S-020); Herakles Hietzing 2 (+ child tranche) - villa new build in Vienna's 13th district, 7,25% p.a., 26 months, invested EUR 600.000 vs limit 825.000 (S-023, S-017); AP Management Curiestraße Magdeburg and AOC Dessau Meisterhausblick - German residential developments (S-014, S-013).
- **Platform-design notes** [PROPOSED]: keep industry, financing purpose (Typus) and property subtype as three independent data fields - dagobertinvest's pages already present purpose and property descriptors separately from the instrument label, and your full-list classification uses the same separation. Add per-status lifecycle (funding -> delayed -> repaid) distinct from funding success, because "Verspätet" is a first-class public status here [S-016, S-013].

---

## 11. Partner and technical stack [OBSERVED, with document dates]

- **Collection/security agent:** dagobertinvest service gmbh (DIS) - in-house Inkassoinstitut and Sicherheitentreuhänder, engaged per Servicevertrag; funded by the 0.5% p.a. service fee [S-016, S-028, S-033].
- **Identity:** ich.app (Austrian e-ID) as alternative registration/login route (S-068; routes per sitemap review); email-based 2FA routes observed; reCAPTCHA on registration and newsletter forms.
- **CRM:** 1Tool (Austrian CRM suite) - the archive holds a capture of the vendor's product site and of km.dagobertinvest.com (403 wall), the platform's CRM host that also serves campaign media [S-001, S-081, S-082].
- **Maps:** Google Maps embeds on campaign pages [S-015].
- **Own-share emissions:** partner platform INVESDOR used for the 2022/2023 AG share issues [S-083].
- **Validation:** Parsley client-side form validation on registration [S-068].
- Payments provider, KYC document vendor, hosting: [UNKNOWN] in this archive.

[PROPOSED] For your Stellar-based design the role mapping differs from CONDA's in one interesting way: dagobertinvest's differentiator is not tokenisation but the **security/enforcement wrapper** (trustee-held mortgage security, collection agent, per-campaign scoring). If your platform wants comparable investor protection, model a SecurityAgent role and per-campaign security package as first-class entities; whether a token can carry or mirror that security interest is per-jurisdiction legal work.

---

## 12. What the archive does NOT show [UNKNOWN]

- Invest/checkout flow: amount-entry detail, payment-method selection, payment confirmation, any on-ramp; the "Simulation möglicher Verluste" and "Kenntnisse & Erfahrungen" question UIs; KYC document upload (the "Dokumente" profile section is visible, its flow is not).
- Current payment rails/providers and whether funds still go to issuer Funding-Konten (legacy document mechanics) or to escrow/PSP accounts.
- Issuer backend and admin: campaign builder, issuer onboarding/KYC, payment reconciliation, news posting (km.dagobertinvest.com is a 403 wall).
- Investor-to-investor transfer/secondary market: nothing observed either way.
- The referral-program FAQ details and payout mechanics; the "Kundiger Anleger" (sophisticated investor) application flow behind the footer entry.
- Mobile app: the welcome screen mentions "unsere dagobertinvest App" [S-072]; no app screens captured.
- Fee schedule for issuers (setup/success fees) beyond the Eigenemission marketing; full AGB section texts beyond what is quoted.

---

## 13. Proposed implementation specification for your platform [PROPOSED - not observed dagobertinvest internals]

Everything in sections 13 and 14 is a proposed design derived from the observed surface. It is not a description of dagobertinvest's backend, which is [UNKNOWN]. Where the CONDA blueprint (section 14 there) already specifies shared machinery (Additional-Info schema, payment allocation, reflection-period handling, admin roles, acceptance criteria), this section adds only what dagobertinvest's evidence changes or sharpens.

### 13.1 Data-model additions/differences vs the CONDA-derived model

- **Campaign**: add financing_purpose (Typus: acquisition/bridge, project development, existing-property refinancing, corporate), extension_option (length, count, announcement channel), security_package_id (nullable), track_record display fields (issuer's prior campaigns raised/repaid counts), p_number (public project number) and internal project_id.
- **SecurityPackage** (new entity): type (mortgage via security trustee, guarantee declaration, bank-standard security, none), trustee entity, rank/resolution reference (Rangordnungsbeschluss), scoring grade (e.g. AA), seal flag for listing/detail UI, per-campaign security note text. FAQ shows the platform explains each security type to investors (grundbücherliche Sicherstellung, Garantieerklärung, Rangordnungsbeschluss, bankübliche Sicherheiten) [S-031].
- **Instrument**: support Disagio pricing as an alternative to interest rate fields (issue discount %, nominal, redemption at par); support monthly-quoted rates normalised to p.a. for display; keep Vertragsform/Veranlagungsform site labels as data, preserving era (legacy qualified subordinated loan vs ECSP-era Mini Bond).
- **InvestmentOrder**: two withdrawal paths with different clocks - the 4-day ECSP reflection period for non-sophisticated investors and the 14-day consumer withdrawal - both cancellable from the dashboard [S-015, D-ABIB]; payout-eligibility flag driven by profile completeness (the "zur Rückzahlung benötigt" checklist) [S-087].
- **User/profile**: tiered investing limits by data completeness (observed: unrestricted registration -> invest up to EUR 1.000 -> additional data unlocks above EUR 1.000); suitability sections (knowledge/experience, loss simulation, source of funds) as profile data with completion state [S-072, S-087].
- **MessageCenter**: categories (project starts, payouts with repayment/interest/partial-repayment subtypes, platform news, project news) with per-category filters [S-086].
- **Referral**: per-user referrer link, reward rule (EUR 75 at >= EUR 250 referred investment), tracking and FAQ content [S-085]; tipster-cooperation applications [S-075].
- **Statement** (new entity): yearly tax statement downloads per account; per-investment document attachments for tax reclaim [S-084].
- **Eigenemission/white-label**: campaigns need a visibility flag (public listing vs link-only own emission) and an issuer-promoted distribution mode [S-002].

### 13.2 State machines (additions)

- **Campaign lifecycle**: add post-funding statuses as first-class and public: funded -> in term -> (on schedule | "Verspätet"/delayed) -> repaid ("Zurückbezahlt") | default (feeding the ECSP default-rate disclosure, S-008). Delayed is a distinct communicable status, not a hidden flag.
- **Loan term clock**: base term + optional issuer-invoked extension (length per campaign terms; announcement duty) -> repayment due -> default after contractually defined grace (observed disclosure threshold: >90 days overdue counts as default) [S-008, D-VIB_P281].

### 13.3 Validation and edge cases

- Enforce per-campaign min investment, unit size (Stückelung), threshold/limit, subscription window with extension rules; threshold-protecting withdrawal windows after funding end (legacy terms: 15 days) where the applicable terms require them [D-VIB_P281].
- Instrument-aware rendering: Disagio campaigns must show issue price vs nominal with a worked example; monthly rates must display their p.a. normalisation; every rate display states when interest starts (observed: immediately after payment) [S-015, S-016].
- Security claims are per-campaign: only show trustee/seal/scoring UI when a SecurityPackage exists; the trustee note must make clear the mortgage is not registered in the investor's own name and describe the contractual claim against the trustee [S-016].
- Interest-start promise ("unmittelbar nach Ihrer Einzahlung") requires payment-date tracking per order and accrual from receipt, not from subscription [S-003].
- Payout gating: block repayments until the "zur Rückzahlung benötigt" profile data (incl. tax residence) is complete; reference-account-only payouts (own-name account) [S-087, D-AGB_DE_02_2025 §4.3].

### 13.4 MVP vs follow-ons [PROPOSED]

- **MVP additions vs the CONDA-derived MVP:** the debt-parent campaign page must already support the dagobertinvest-style overview panel (status, threshold/limit, invested, instrument label), the repayment calculator, and bullet repayment with extension option; delayed/repaid public statuses; per-campaign document library (registry extract, land register, financials, business plan, KIIS/ABIB); the two-clock withdrawal handling; profile-completeness gating for limits and payouts; yearly statement downloads.
- **Follow-ons:** SecurityPackage with trustee workflows and scoring, referral program, message center categories, Eigenemission/link-only campaigns, own-share-emission IR pages, e-ID (ich.app-style) sign-in, app.

---

## 14. Open decisions for you [PROPOSED]

- Whether to adopt a dagobertinvest-style security/enforcement wrapper (own collection entity, trustee-held security, per-campaign scoring) and, if so, which entity plays that role in your structure and jurisdiction.
- Tiered investment limits by data completeness (observed EUR 1.000 gate) vs full KYC before any investment - a compliance-path decision.
- Rate-display policy: monthly-quoted rates (observed up to 36% p.a. on 3-month bridges) are legal in that market but read aggressively; decide your display and usury/fairness review per jurisdiction.
- Legacy/era handling: if you ever migrate instruments between legal regimes, keep per-campaign document generation and contract-form labels as data (dagobertinvest's P100-P499 vs P500+ split shows the pain of not doing so) [S-010].
- Whether your marketplace allows issuer-promoted link-only emissions (Eigenemission) alongside listed campaigns - a product and licence-scope decision.

---

## 15. Comparison deltas vs CONDA Capital (both archives, same-day captures) [OBSERVED]

- Focus: dagobertinvest is real-estate project finance (debt only in the observed set); CONDA is multi-industry SME finance incl. equity-side instruments.
- Investor protection story: dagobertinvest = security wrapper (trustee-held Grundpfand, scoring, DIS enforcement, service fee); CONDA = instrument diversity + tokenised register/custody partners (Smart Registry, HADC) and a support-portal KB.
- Rates: dagobertinvest bridge loans quote monthly (24-36% p.a. normalised); CONDA campaigns quote 4-10% p.a. on multi-year terms.
- Account area: CONDA exposes verification, bank details, depot and digital locker as separate sections; dagobertinvest exposes suitability sections, payout-gating checklist, message center, referral and an IR page for its own shares.
- Disclosure posture: both show ECSP default-rate and completed-raises pages; dagobertinvest additionally publishes per-campaign registry/land-register/financial documents publicly in the campaign Dokumente section.

---

## 16. Source index

**S-ids** cite exact screencapture filenames in the two archives (S-001..S-082 from `Dagobertinvest.zip`, S-083..S-087 from `dagobertinvest2.zip`). **D-ids** cite document PDFs. Some archive filenames contain URL-escaped characters (e.g. `#U00fc` = u-umlaut, `#U00e4` = ä, `#U00f6` = ö) exactly as zipped. The authenticated-area captures (S-083..S-087) show a supplied logged-in account; personal identifiers visible in them are not reproduced and no account-ownership assertion is made beyond the supplied captures themselves.

### Screencaptures
S-001 = `screencapture-1tool-2026-10-30-21_45_05.pdf`
S-002 = `screencapture-business-dagobertinvest-2026-10-30-21_45_55.pdf`
S-003 = `screencapture-dagobertinvest-2026-10-30-17_28_47.pdf`
S-004 = `screencapture-dagobertinvest-OFF-lp-hohe-zinsen-ohne-kosten-und-gebuehren-fuer-autobankkunden-2026-10-30-20_43_33.pdf`
S-005 = `screencapture-dagobertinvest-abgewickelte-kapitalaufnahmen-2026-10-30-17_46_47.pdf`
S-006 = `screencapture-dagobertinvest-agb-2026-10-30-17_45_48.pdf`
S-007 = `screencapture-dagobertinvest-aktionaer-werden-2026-10-30-20_43_52.pdf`
S-008 = `screencapture-dagobertinvest-ausfaelle-gemaess-ecsp-vo-2026-10-30-17_47_12.pdf`
S-009 = `screencapture-dagobertinvest-bellevue-leser-dagobertinvest-2026-10-30-20_44_16.pdf`
S-010 = `screencapture-dagobertinvest-beschwerde-ubersicht-2026-10-30-17_47_38.pdf`
S-011 = `screencapture-dagobertinvest-blog-2026-10-30-17_43_49.pdf`
S-012 = `screencapture-dagobertinvest-blog-2026-10-30-21_39_00.pdf`
S-013 = `screencapture-dagobertinvest-crowdfunding-aoc-dessau-meisterhausblick-2026-10-30-20_08_34.pdf`
S-014 = `screencapture-dagobertinvest-crowdfunding-ap-management-curiestrasse-magdeburg-2026-10-30-20_00_11.pdf`
S-015 = `screencapture-dagobertinvest-crowdfunding-aventa-traiskirchen-bridge-2026-10-30-19_59_12.pdf`
S-016 = `screencapture-dagobertinvest-crowdfunding-haberent-poststr-luckenwalde-bestandsfinanzierung-zero-bond-2026-10-30-20_06_07.pdf`
S-017 = `screencapture-dagobertinvest-crowdfunding-herakles-hietzing2-child-2026-10-30-20_01_03.pdf`
S-018 = `screencapture-dagobertinvest-crowdfunding-hst-321-wien-penzing-2026-10-30-20_08_13.pdf`
S-019 = `screencapture-dagobertinvest-crowdfunding-loewentor-grosshoeflein-bridge-2026-10-30-20_07_20.pdf`
S-020 = `screencapture-dagobertinvest-crowdfunding-must-heuberg-salzburg-2026-10-30-18_46_32.pdf`
S-021 = `screencapture-dagobertinvest-crowdfunding-oesterreich-2026-10-30-20_44_31.pdf`
S-022 = `screencapture-dagobertinvest-crowdinvesting-erklaert-2026-10-30-17_29_56.pdf`
S-023 = `screencapture-dagobertinvest-crowdinvesting-herakles-hietzing2-2026-10-30-20_01_31.pdf`
S-024 = `screencapture-dagobertinvest-crowdinvesting-mit-cash-bonus-2026-10-30-20_44_48.pdf`
S-025 = `screencapture-dagobertinvest-crowdinvesting-mit-cash-bonus-alt-2026-10-30-20_45_20.pdf`
S-026 = `screencapture-dagobertinvest-crowdinvesting-must-heuberg-salzburg-2026-10-30-18_47_34.pdf`
S-027 = `screencapture-dagobertinvest-crowdinvesting-und-weiter-2026-10-30-20_45_41.pdf`
S-028 = `screencapture-dagobertinvest-dagobertinvest-safeguard-program-2026-10-30-20_45_58.pdf`
S-029 = `screencapture-dagobertinvest-datenschutz-2026-10-30-17_45_01.pdf`
S-030 = `screencapture-dagobertinvest-esg-impact-investments-bei-dagobertinvest-2026-10-30-20_46_13.pdf`
S-031 = `screencapture-dagobertinvest-faq-2026-10-30-17_32_09.pdf`
S-032 = `screencapture-dagobertinvest-faq-2026-10-30-17_43_01.pdf`
S-033 = `screencapture-dagobertinvest-geld-anlegen-nach-dem-dagobert-prinzip-2026-10-30-17_29_27.pdf`
S-034 = `screencapture-dagobertinvest-gewinn-messe-2022-2026-10-30-20_46_31.pdf`
S-035 = `screencapture-dagobertinvest-glossar-2026-10-30-17_44_13.pdf`
S-036 = `screencapture-dagobertinvest-hohe-Zinsen-entdecken-2022-2026-10-30-20_46_46.pdf`
S-037 = `screencapture-dagobertinvest-hohe-Zinsen-entdecken-wipplingerstrasse-2026-10-30-20_47_35.pdf`
S-038 = `screencapture-dagobertinvest-immobilien-crowdfunding-erweitert-ihr-produktangebot-2026-10-30-20_47_53.pdf`
S-039 = `screencapture-dagobertinvest-impressum-2026-10-30-17_44_40.pdf`
S-040 = `screencapture-dagobertinvest-interessenskonflikte-2026-10-30-17_31_16.pdf`
S-041 = `screencapture-dagobertinvest-kampagnen-2026-10-30-17_29_12.pdf`
S-042 = `screencapture-dagobertinvest-kontakt-2026-10-30-17_46_13.pdf`
S-043 = `screencapture-dagobertinvest-login-2026-10-30-21_46_23.pdf`
S-044 = `screencapture-dagobertinvest-lp-anlageprofi-erstinvestition-2026-10-30-21_26_05.pdf`
S-045 = `screencapture-dagobertinvest-lp-bei-dagobertinvest-ab-eur-100-in-immobilien-investieren-at-2026-10-30-21_26_25.pdf`
S-046 = `screencapture-dagobertinvest-lp-bonus-fuer-erstinvestments-2026-10-30-21_26_44.pdf`
S-047 = `screencapture-dagobertinvest-lp-crowdfunding-schweiz-2026-10-30-21_27_02.pdf`
S-048 = `screencapture-dagobertinvest-lp-geld-anlegen-2026-10-30-21_27_23.pdf`
S-049 = `screencapture-dagobertinvest-lp-hohe-zinsen-mit-immobilien-crowdinvesting-veranlagen-2026-10-30-21_27_42.pdf`
S-050 = `screencapture-dagobertinvest-lp-hohe-zinsen-ohne-gebuehren-de-2026-10-30-21_28_00.pdf`
S-051 = `screencapture-dagobertinvest-lp-hohe-zinsen-ohne-kosten-und-gebuehren-2026-10-30-21_28_16.pdf`
S-052 = `screencapture-dagobertinvest-lp-hohe-zinsen-ohne-kosten-und-gebuehren-alt-2026-10-30-21_28_32.pdf`
S-053 = `screencapture-dagobertinvest-lp-in-immobilien-crowdinvesting-anlegen-hohe-Zinsen-verdienen-2026-10-30-21_28_50.pdf`
S-054 = `screencapture-dagobertinvest-lp-investieren-in-bewegten-zeiten-2026-10-30-21_29_08.pdf`
S-055 = `screencapture-dagobertinvest-lp-mehr-zinsen-mit-immobilien-crowdinvesting-2026-10-30-21_29_26.pdf`
S-056 = `screencapture-dagobertinvest-lp-nullzinsen-fuer-ihr-sparguthaben-2026-10-30-21_29_46.pdf`
S-057 = `screencapture-dagobertinvest-lp-rendite-fuer-ihr-sparguthaben-2026-10-30-21_30_02.pdf`
S-058 = `screencapture-dagobertinvest-lp-sparbuch-war-gestern-som-2026-10-30-21_30_30.pdf`
S-059 = `screencapture-dagobertinvest-lp-sparbuch-war-gestern-some-2026-10-30-21_30_38.pdf`
S-060 = `screencapture-dagobertinvest-lp-unternehmerisch-in-immobilien-investieren-2026-10-30-21_30_54.pdf`
S-061 = `screencapture-dagobertinvest-mit-dagobertinvest-hohe-zinsen-verdienen-oe24-2026-10-30-21_31_09.pdf`
S-062 = `screencapture-dagobertinvest-neue-aera-crowdfunding-2026-10-30-21_31_26.pdf`
S-063 = `screencapture-dagobertinvest-newsletter-2026-10-30-17_46_31.pdf`
S-064 = `screencapture-dagobertinvest-nowa-era-inwestowania-w-nieruchomosci-z-dagobertinvest-2026-10-30-21_31_43.pdf`
S-065 = `screencapture-dagobertinvest-osmium-partner-dagobertinvest-2026-10-30-21_31_58.pdf`
S-066 = `screencapture-dagobertinvest-password-vergessen-2026-10-30-21_47_05.pdf`
S-067 = `screencapture-dagobertinvest-presse-2026-10-30-21_42_23.pdf`
S-068 = `screencapture-dagobertinvest-register-2026-10-30-17_27_28.pdf`
S-069 = `screencapture-dagobertinvest-register-2026-10-30-21_46_41.pdf`
S-070 = `screencapture-dagobertinvest-register-2026-10-30-21_46_50.pdf`
S-071 = `screencapture-dagobertinvest-register-activation-2026-10-30-17_27_42.pdf`
S-072 = `screencapture-dagobertinvest-register-confirmation-2026-10-30-17_28_32.pdf`
S-073 = `screencapture-dagobertinvest-risikohinweis-2026-10-30-17_30_48.pdf`
S-074 = `screencapture-dagobertinvest-standortbeschreibung-baden-2026-10-30-21_34_25.pdf`
S-075 = `screencapture-dagobertinvest-tippgeber-kooperation-2026-10-30-21_32_15.pdf`
S-076 = `screencapture-dagobertinvest-twoj-krok-do-wiekszych-mozliwosci-inwestycyjnych-2026-10-30-21_32_30.pdf`
S-077 = `screencapture-dagobertinvest-ueber-dagobertinvest-2026-10-30-17_30_28.pdf`
S-078 = `screencapture-dagobertinvest-vergleich-plattformen-crowdfunding-2026-10-30-21_32_50.pdf`
S-079 = `screencapture-dagobertinvest-weihnachten-benda-gruppe-2022-2026-10-30-21_33_10.pdf`
S-080 = `screencapture-dagobertinvest-zainwestuj-od-100-euro-w-realne-projekty-2026-10-30-21_33_26.pdf`
S-081 = `screencapture-km-dagobertinvest-2026-10-30-21_44_01.pdf`
S-082 = `screencapture-km-dagobertinvest-crm-2026-10-30-21_44_22.pdf`
S-083 = `screencapture-dagobertinvest-backend-dag-2026-10-30-23_09_20.pdf`
S-084 = `screencapture-dagobertinvest-backend-dashboard-2026-10-30-23_08_10.pdf`
S-085 = `screencapture-dagobertinvest-backend-freundschaftswerbung-2026-10-30-23_08_44.pdf`
S-086 = `screencapture-dagobertinvest-backend-nachrichten-2026-10-30-23_08_33.pdf`
S-087 = `screencapture-dagobertinvest-backend-profildaten-persoenliche-daten-2026-10-30-23_09_04.pdf`

### Documents

The 35 document PDFs in `Dagobertinvest.zip` (literal archive filenames). D-aliases used in the body resolve as: D-AGB_DE_02_2025 = `AGB_DE_02_2025.pdf`; D-Datenschutz = `Datenschutzerkl#U00e4rung_DIV.11.2025.pdf`; D-Investitionsleitfaden = `Investitionsleitfaden.pdf`; D-ABIB = `Anlagebasisinformationsblatt.pdf` (ABIB_DEU_P520); D-IDB_P281 = `Informationsblatt f#U00fcr Anleger.pdf` (IDB-P281; files (1)-(4) are further investor sheets of the same type); D-VIB_P281 = `Verm#U00f6gensanlagen-Informationsblatt.pdf` (stand 19.03.2021; files (1) and (2) are further VIBs).

- `AGB_DE_02_2025.pdf`
- `Anlagebasisinformationsblatt.pdf`
- `Bilanz zum 31.01.2025.pdf`
- `Bilanz zum 31.12.2023.pdf`
- `Datenschutzerkl#U00e4rung_DIV.11.2025.pdf`
- `Firmenbuchauszug (1).pdf`
- `Firmenbuchauszug (2).pdf`
- `Firmenbuchauszug (3).pdf`
- `Firmenbuchauszug (4).pdf`
- `Firmenbuchauszug.pdf`
- `Gesch#U00e4ftsplan (1).pdf`
- `Gesch#U00e4ftsplan (2).pdf`
- `Gesch#U00e4ftsplan.pdf`
- `Grundbuch_03.12.2024.pdf`
- `Grundbuchauszug.pdf`
- `Informationsblatt f#U00fcr Anleger (1).pdf`
- `Informationsblatt f#U00fcr Anleger (2).pdf`
- `Informationsblatt f#U00fcr Anleger (3).pdf`
- `Informationsblatt f#U00fcr Anleger (4).pdf`
- `Informationsblatt f#U00fcr Anleger.pdf`
- `Investitionsleitfaden.pdf`
- `Investorenbrief (1).pdf`
- `Investorenbrief (2).pdf`
- `Investorenbrief (3).pdf`
- `Investorenbrief.pdf`
- `Jahresabschl#U00fcsse (1).pdf`
- `Jahresabschl#U00fcsse (2).pdf`
- `Jahresabschl#U00fcsse.pdf`
- `Lageexpos#U00e9 (1).pdf`
- `Lageexpos#U00e9.pdf`
- `Projektzusammenfassung (1).pdf`
- `Projektzusammenfassung.pdf`
- `Verm#U00f6gensanlagen-Informationsblatt (1).pdf`
- `Verm#U00f6gensanlagen-Informationsblatt (2).pdf`
- `Verm#U00f6gensanlagen-Informationsblatt.pdf`
