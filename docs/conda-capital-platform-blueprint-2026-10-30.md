# CONDA Capital Market - Platform and Feature Blueprint

**Purpose:** detailed description of the CONDA Capital Market platform (conda-capital.com) - pages, features, user journeys and instrument structures - as reference material for building your own crowdfunding / RWA investment platform.
**Evidence base:** your archive `conda-capital.zip` (323.5 MB): 150 full-page screencaptures of conda.capital and its support portal taken 2026-10-30, plus 50 issuer and platform PDF documents. Every load-bearing statement cites its source: **[S-xxx]** = screencapture file (see source index), **[D-name §n]** = PDF document + section. Anatomy of the homepage, investments list, campaign page and knowledge hub was verified against the rendered page images, not only extracted text.
**Labels:** [OBSERVED] = visible in the cited archive evidence. [SITE-CLAIM] = stated on the website or in a dated document; not independently re-verified against a live register. [PROPOSED] = my design recommendation for your build, not a claim about CONDA. [UNKNOWN] = not visible in the archive.

> Use this as a specification reference, not as source text. Do not copy CONDA's branding, texts, legal documents or campaign content. Summaries of CONDA's legal documents below are paraphrases for analysis.

---

## 1. What the platform is

CONDA Capital Market is an EU crowdfunding platform for retail and institutional investment in SMEs, mainly Austria and Germany, with minimum investments typically from EUR 250 [OBSERVED, S-001].

Entities seen in the archive (keep them distinct):

- **Conda Capital Market GmbH** (Vienna) - named in the site footer as the site operator [OBSERVED, S-001 footer].
- **CONDA Capital GmbH** - named as "Intermediary" on every campaign's Additional Info panel [OBSERVED, S-022, S-012].
- The investor T&Cs (document version dated 12 October 2026) describe "CONDA CAPITAL" as a crowdfunding service provider with authorisation under Art. 12 of Regulation (EU) 2020/1503 [SITE-CLAIM, D-AGB_Anleger_CONDA_2026-10-12 preamble]. The About page displays an "ECSP Licensed" badge and the FAQ states supervision by the Austrian FMA [SITE-CLAIM, S-003, S-058]. Which of the two entities holds which authorisation today is not resolvable from the archive; verify against the FMA register if it matters.

Business parameters as stated by CONDA itself [SITE-CLAIM, S-070..077 FAQ "For companies"]:

- Funding cap communicated to issuers: EUR 5 million per issuer per year, which CONDA attributes to the ECSP Regulation. Treat this as CONDA's stated scope, not a universal rule for your platform; the cap and its conditions depend on your own licence path.
- Issuer eligibility as CONDA states it: EU-registered corporation (GmbH or AG), EU registered office, market potential, growth prospects, standard accounting, ideally third financial year or later. Again CONDA's own criteria.
- Costs: free for investors; issuers pay a fixed setup fee plus a success commission (amounts only in a personal meeting).
- Group figures on the homepage (capital invested, 380+ projects, 70,000+ investors) explicitly include white-label and partner platforms [OBSERVED, S-001 note under counters].

CONDA also runs a white-label arm ("CONDA Business Solutions", S-005) selling the platform to partners, and migrated users from earlier platform generations (conda.at / conda.de; KB article on migration login issues, S-146 sidebar).

---

## 2. Site map [OBSERVED]

**Public site:** home `/en` (S-001/002), investments list `/en/investments` (S-079), campaign pages `/en/campaigns/<slug>` and German `/kampagnen/<slug>` (S-006..128), issuer landing `/en/financing` (S-078), white-label `/en/business-solutions` (S-005), Learn hub `/en/knowledge` (S-080..082), risk warnings `/en/risk-warnings` (S-089), FAQ `/en/faqs` (S-058..077, two tabs: For investors / For companies), events page + "Let them Pitch" (S-084, S-130/131), blog (S-004), podcast (S-086), press (S-087), about us (S-003), jobs (S-090 area), legal pages: Terms & Conditions, Legal Notice, Privacy Policy, Conflicts of Interest, Complaints Management, Business Continuity in Times of Crisis (footer links on every page, e.g. S-001; complaints page S-056).

**Authenticated area:** registration and login are hosted on a separate auth subdomain running Keycloak, realm "condaCM" (S-136 URL), with password rules (min. length 10, cannot match username) and a captcha. The investor T&Cs state that only registered customers can invest, use the user account and view the password-protected document area [D-AGB_Anleger_CONDA_2026-10-12 §2.1].

**Support portal** (support subdomain, S-138..148): search, popular articles, ticket submission ("Meine Tickets"), KB categories Registration / Verification / Account / Investment, per-article helpfulness voting and "updated" dates.

**Auxiliary services observed:** events subdomain listing Live (2) / Past (43) events with city/category/type filters (S-130/131); drive.conda.online file share serving a press kit (S-129); forms subdomain hosting a complaint form; an external newsletter double-opt-in tool (S-137).

---

## 3. Persistent UI elements [OBSERVED, verified visually on S-001 and S-022]

- Risk banner across the top of every page: "Investing carries a total loss risk".
- Header: logo, nav (Invest / Financing / Learn / Events / About Us), Login + Register buttons, language switcher (EN/DE).
- Right edge: a vertical "Feedback" tab on all pages.
- Footer: Legal column (Terms & Conditions, Legal Notice, Privacy Policy, Conflicts of Interest, Complaints Management, Business Continuity in Times of Crisis), Communication column (Newsletter, Jobs, Press, FAQs), partner logos (secupay, NYALA, signteq), B-Corp mark, social icons.
- Guided product "tour" on campaign pages with a "Repeat tour" link (S-022).

---

## 4. Homepage anatomy [OBSERVED, S-001/002, verified visually]

1. Hero: "Your direct access to Private Markets", two CTAs ("Discover investments", "How it works"), risk line.
2. Latest Investments: campaign cards (section 5), with a grid/list view toggle.
3. "4 steps to your investment": Register -> Discover -> Invest (from EUR 250, "secure payment processing via established payment providers") -> Sit back (dashboard).
4. Achievement counters with the group-scope note.
5. Asset Classes teaser: Bond, Share, Participation Certificate, Convertible Bond, Indirect Participation, Hybrid Investment Products, each with a one-line definition, linking to the Learn hub.
6. "Beyond ESG" (ESG in due diligence), "Why CONDA" (EU-regulated, returns, fast/digital, transparent/fee-free, from EUR 250, Europe-wide), testimonials, final CTA.

---

## 5. Investments listing [OBSERVED, S-079, verified visually]

- Title "All investments"; filter chips: All + 10 industries (Construction, Education and research, Energy and utilities, Finance and insurance, Healthcare, Hospitality and tourism, Industry, Information Technology, Trade and retail, Transportation and logistics).
- Toolbar: grid/list toggle, Search field, Filters button (filter panel content not captured - [UNKNOWN]).
- Sections: Active investments, then Completed investments; "Load more" pagination.
- **Card fields:** issuer image with instrument chip ("Bond") and "ECSPR" badge, country chip, remaining days ("41 days"), issuer legal name, campaign title, 2-3 line teaser, metric chips (interest rate, duration or "Open-ended"), "Already invested" amount with progress bar, investor count, "View details" button.
- Closed cards carry status: "Successfully financed" or "Unsuccessful" (beetsroots, S-006; Venture Space, S-125).

---

## 6. Campaign detail page [OBSERVED, S-022 (closed) and S-012 (live), verified visually]

**Header block:** category chip ("Energy and utilities", "Hospitality and tourism"), issuer hero image with ECSPR badge, issuer legal name + campaign title, country, status badge (Successfully financed) or remaining days (32 days).

**Metric cards:** Asset class, Interest rate p.a., Term, Minimum investment. Below them an **instrument explainer banner** (e.g. what a subordinated bond is, in plain language) [S-012].

**Sidebar - two variants:**

- Live campaign (S-012): "Invest now" widget with funding progress % and bar, invested amount vs goal, investor count, **investment amount stepper input showing per-investor Min/Max (min EUR 500, max EUR 300,000 on that campaign)**, "Invest now" button, and a risk-warning box.
- Closed campaign (S-022): "Investment overview" widget (progress, invested vs goal, investors) without the input; unsuccessful/closed pages also show "Letzte Investoren" - latest anonymized investments with amounts (S-125).

**"Additional Info" panel** - the core structured data block, a two-column field grid. Fields observed across campaigns (subset per instrument) [S-022, S-012, S-091, S-114, S-047, S-029, S-039]:

- Investment product (instrument label); ISIN/WKN - one line per interest variant (devolo S-091 and COOEE S-012 each show two ISINs: cash interest vs interest in kind)
- Nominal amount per unit; minimum subscription ("one unit"); funding threshold (EUR or "None") - a distinct concept from the per-investor minimum
- Issue/placement volume, with notes for cross-platform volume (Eternal Power: of EUR 2.0M issue, EUR 1,885,450 raised on the WIWIN platform, included in the displayed amount, S-022) and pre-subscriptions (innolytics, S-039)
- Equity-only fields: price per share, issue price, pre-money valuation (innolytics EUR 18,203,304), company value (ewia EUR 12,330,750), subscription period (oekostrom 1 Oct - 6 Nov 2026)
- Term (end date; ewia: "Unlimited (waiver of termination until 31 December 2035)")
- Interest rate(s), bonus interest (Eternal Power +1.00% p.a. "see key investment information sheet"), calculation method (act/act, 30E/360)
- Interest payment dates (annual; half-yearly "31 May and 30 November, starting 31 May 2027" on COOEE), repayment mode (at maturity / annually)
- Discount window (COOEE: 4% of nominal, EUR 20 per unit, until 30 September 2026)
- Interest-in-kind variant with a mandatory risk notice (higher rate only via the voucher variant; both subject to issuer performance; not guaranteed)
- Lead investors with amounts (ewia)
- Offered-in countries ("AT, DE" on all observed), Intermediary ("CONDA Capital GmbH (authorised service provider under Regulation (EU) 2020/1503; the authorisation does not constitute a state guarantee)" - S-012), contact person for investors with email

**MARKETING CONTENT divider** between platform facts and issuer-provided content, with an issuer-content/total-loss/past-performance disclaimer [S-012, S-022]. This deliberate separation is worth copying structurally.

**Tabs:** Overview / Details / Documents / News. Sub-section chips within tabs: Company presentation, Team (per-person bios), Company data (address, email, phone, website); Business model, Market & market potential, Financials & projections (cost tables), Milestones, Rewards, Podcast. Issuer video embeds appear in the marketing area (S-012 bottom).

**Documents tab:** per-campaign PDF library - emission conditions, KIIS, Anlagebasisinformationsblatt, pitch decks, annual statements (the archive's 50 documents originate here).

**Rewards feature** (beetsroots, S-008): tiered in-kind rewards on top of interest - "25% discount from EUR 500 (2 units)", 35% from EUR 1,000 (4 units), 50% from EUR 1,500 (6 units) - claimable only after successful campaign completion.

---

## 7. Investor journey [OBSERVED: KB articles S-138..148 + investor T&Cs D-AGB_Anleger_CONDA_2026-10-12 (version 12.10.2026), cited per step]

1. **Registration** (S-142, S-136): full name exactly as on ID + email, T&C consent, email confirmation link, password setup, complete profile. T&Cs: 18+, EU domicile unless otherwise permitted (§2.2), truthful-data duty (§2.5).
2. **KYC** (S-143): account menu > "Verification" > "Start KYC process"; enter mobile number, SMS code, QR code to a secure page, photograph passport/ID card, selfie, SMS TAN to finish. Must be done personally. Failure modes listed: name mismatch with ID, unreadable photos, expired/wrong documents, interrupted process. T&Cs §2.7: AML data may include beneficial owner and source of funds; third-party providers may be engaged.
3. **Investor categorisation** (T&Cs §5): non-sophisticated by default; before first unrestricted use, an entry knowledge test and a loss-bearing-capacity simulation (T&Cs cite Art. 21 ECSP), with an extra risk warning above statutory thresholds.
4. **Investing** (S-012 widget + T&Cs §6.2): documents and risk warnings presented before the offer; review/correct before submitting; the click is a binding **offer to invest** addressed to the issuer (T&Cs §6.3: the contract is between investor and project owner; CONDA acts as intermediary/placement agent without firm commitment).
5. **Reflection period** (T&Cs §6.3/§9.1, citing Art. 22 ECSP): non-sophisticated investors can revoke within 4 calendar days, free, via cancellation button or email; afterwards bound until end of the offer period. Sophisticated investors are bound immediately.
6. **Payment** (S-148, S-145): processed by a licensed payment service provider (secupay; secupay AGB in archive), not by CONDA (T&Cs §1.7, §3.4). Bank transfer uses a per-investment payment reference; a missing/wrong reference parks money in a temporary PSP account until manually allocated (S-148). Joint-account payments are held for manual review (S-145). Credit card exists (KB article "Why isn't my credit card payment working?" seen in S-144 sidebar). Exact checkout screens and the full payment-method list: [UNKNOWN].
7. **Wallet/funds:** T&Cs §3.4 describe a wallet/user account provided by the payment service provider; CONDA states it provides no payment services and acquires no rights to client funds or instruments (§8.4/8.5). No deposit-guarantee or investor-compensation coverage (§3.4(b)).
8. **Dashboard** (S-147): "My Investments" with per-investment status messages, status updates and documents; KB covers interest payout conditions and timelines, refunds, and payout-prerequisite forms (Gebrueder Stitch form in archive, D-abfrageformular).
9. **Transfers/exit** (S-065 FAQ + T&Cs §7): securities generally transferable; recipient must be registered and verified; "the transfer of the tokens takes place directly between the wallets"; no own secondary market at FAQ time. T&Cs §7 additionally describe a "CONDA Marketplace" bulletin board for publishing buy/sell interests with bilateral closing, CONDA as technical operator only, optional seller fee. No marketplace UI in the archive [UNKNOWN].
10. **Company accounts** (S-141): individual registers and passes KYC first, then applies for a company account (company register extract <3 months old, IDs of all >25% owners, shareholder list for German companies); manual review by Investor Relations; switcher between personal and company contexts; investments execute in the currently selected account.
11. **Account lifecycle** (S-139, S-140, S-146): personal data locked after verification (changes via Investor Relations with proof documents); deletion via support request with identity details; password reset by email; accounts are platform-specific across CONDA's separate platforms/white-labels.

---

## 8. Issuer journey [OBSERVED: S-078 financing page + FAQ S-070..077]

1. Application via contact form -> expert review -> personal meeting -> tailored financing offer.
2. Joint planning of the digital financing round.
3. Timeline: stated 4-8 weeks from complete documents to publication; funding speed then depends on investor interest.
4. Eligibility (CONDA-stated, section 1).
5. Costs: fixed setup fee + success commission.
6. Marketing: platform, newsletter, social media, targeted ads; "Let them Pitch" live events; pre-subscription phase possible (a testimonial cites >50% of a EUR 3M preliminary limit pre-launch).
7. Live campaign: public campaign page with comments (KB sidebar: "Who responds to public comments on the campaign page?"), investor enquiries handled by Investor Relations, News tab for updates.
8. Post-close: access to raised capital; ongoing document uploads (annual statements, quarterly reports observed in campaign document sets); failed campaigns remain visible with "Unsuccessful" status.

Issuer insolvency is a separate, later lifecycle stage: the nixe Brau documents (D-18a-konkursverfahren, D-insolvenzreport) show a campaign that had funded (2014, via the trustee structure) and later entered insolvency proceedings. Model "funding outcome" and "post-funding issuer status" as different state dimensions, not one.

---

## 9. Content, education and community [OBSERVED]

- **Learn hub** (S-080..082, verified visually): three top categories with instrument chips - _Interest-bearing investments_ (Bonds), _Company participations_ (Share, "GmbH share via SPV", Participation Certificate), _Mezzanine investments_ (Participation Certificate, Subordinated bond, Convertible Bond) - then per-instrument detail cards with Opportunities / Risks / "Who is it suitable for" sections; searchable glossary (S-081); video section (empty state observed, S-082).
- **Risk warnings page** (S-089): numbered risk blocks (total loss; illiquidity; diversification guidance of max 10% of freely available funds), supervision statement, no-advice disclaimer, gating to registered members.
- **FAQ** (S-058..077): investor and company tabs, accordion Q&A (content reflected in sections 7-8).
- **Support portal** (S-138..148): KB + tickets.
- **Events** (S-084, S-130/131): "Let them Pitch" live pitch evenings (5-minute issuer pitches to 100+ investors, free for community members, also an issuer marketing product), Investors Lounges in several cities, webinars.
- Blog, Podcast, Press + press kit on the drive share (S-129); newsletter via external double opt-in (S-137).
- Ethical exclusion list on About Us (no tobacco, gambling, weapons, fossil fuels, mining, nuclear, prisons, GMOs, conflict-mineral-linked industries, etc.) [OBSERVED, S-003] - a product-level policy page worth having on your own terms.

---

## 10. Compliance surface (what exists, as pages and documents) [OBSERVED]

These exist on the CONDA site; which of them are legally mandatory for _your_ platform depends on your jurisdiction and licence - verify against current regulation rather than copying the set:

- Persistent total-loss banner; per-campaign risk warning; marketing-content separation (S-012/022).
- Per-campaign KIIS (Key Investment Information Sheet; D-KIIS-oekostrom, D-devolo-KIIS) and German AIB/VIB documents (D-Profem_Anlagebasisinformationsblatt, D-aiyp_vibuwdr).
- Knowledge test + loss-bearing simulation and investor categorisation (T&Cs §5).
- 4-day reflection period mechanics (T&Cs §6.3/§9.1).
- No-deposit-protection disclosure (T&Cs §3.4(b)); selling restrictions excluding US persons and US/CA/AU/JP distribution (T&Cs §4).
- Complaints management page + complaint form; Conflicts of Interest page; Business Continuity page; Privacy Policy; distance-selling information documents per campaign (D-Fernabsatz) and withdrawal instructions (D-Widerrufsbelehrung).
- AML/KYC data collection incl. beneficial owners and source of funds (T&Cs §2.7); corporate KYC with >25% owner identification (S-141).

---

## 11. Your instrument categories - observed implementations

Your unified hierarchy (as supplied on 2026-10-30): four participation-side parents (1-4), then **Debt** - two generic parents, 5 Loan and 6 Bond, with three seniority states each (senior / subordinated / unspecified) - plus two **structure overlays** that combine with 5 or 6 and never stand alone (zero-coupon, convertible), and **rank and label qualifiers** kept as site wording (junior, qualified/qualifiziert, Mini Bond). Substanzgenussrecht is a subtype of participation rights (1a); a capital increase is the action that creates new shares, not a separate instrument; indirect participation is an ownership structure, not a distinct instrument. The numbering below follows that hierarchy. Observed CONDA evidence covers only part of this model; categories without archive evidence are marked as such, not presented as platform-supported. The full supplied campaign list (270 numbered rows) is classified under the same hierarchy in [conda-full-list-by-project-type.md](conda-full-list-by-project-type.md) (which also treats "Bridge financing" as a financing-role overlay, not an instrument).

CONDA's site taxonomy (S-080): Bonds; Share, GmbH share via SPV, Participation Certificate; Participation Certificate, Subordinated bond, Convertible Bond; homepage additionally lists Indirect Participation and Hybrid Investment Products (S-001). Which of these, and which of your categories, may be offered under a single ECSP licence is a legal question for your own structure - do not assume CONDA's set transfers. [PROPOSED: verify per instrument and jurisdiction before scoping.] Mapped to your hierarchy: the site's "Bonds" and "Subordinated bond" are 6 (Bond) in different seniority states, "Convertible Bond" is 6 with the convertible overlay, "Share" is 2, "GmbH share via SPV" is 2 held through the indirect-participation structure (3), "Participation Certificate" is 1, "Indirect Participation" is the structure 3 itself, and "Hybrid Investment Products" has no home in the hierarchy - the archive does not show which instruments that label covers.

### 1. Participation right / certificate (Genussschein) [OBSERVED]

- Example: beets&roots profit participation certificate (Germany; campaign ended "Unsuccessful", page stays online) [S-006..008].
- Site definition: "Securitised right to a profit share and repayment of the nominal value from the company" (S-001).
- Feature surroundings: minimum EUR 250; tiered in-kind rewards (S-008).

### 1a. Substanzgenussrecht (subtype of participation rights) [OBSERVED, legacy 2014 structure]

- Documents: D-treuhand_und_substanzgenussrechtsvertrag_nixe (29.09.2014), D-fernabsatz_kundeninformation_nixe.
- Structure in that contract: CONDA Unternehmensberatungs GmbH acts as **trustee (Treuhander)** - it subscribes and holds the Substanzgenussrechte (the contract cites sec. 174(3) AktG for the instrument) **in its own name but on account of the crowd investors**; investors participate in EUR 100 units (nominal plus agio), then-min/max EUR 100 / EUR 3,000; funding threshold EUR 50,000 (preamble, §1).
- Note: the archive does not show whether this trustee model is still used; current campaigns use direct securities with ISINs instead. Do not derive the legal nature or issuer-eligibility of Substanzgenussrechte from this contract alone - issuer forms vary by jurisdiction and statute.

### 2. Share [OBSERVED]

- A capital increase is the corporate action that creates new shares, not a separate instrument; the oekostrom campaign below is titled "capital increase 2026" because it is one [S-047].
- oekostrom AG (S-047): price EUR 32/share, minimum 8 shares, up to EUR 14M total of which max EUR 4,999,936 (156,248 registered no-par shares) via CONDA, subscription period 1 Oct - 6 Nov 2026, ISIN with note "share not tradable on any exchange". Backed by an approved prospectus dated 31 Aug 2026 (D-oekostrom-Prospekt: offer of 450,198 registered no-par shares from authorised capital, full dividend entitlement; stated dividend policy: currently no distributions to strengthen the capital base).
- innolytics AG (S-039): issue price EUR 322, pre-money valuation EUR 18,203,304, funding threshold EUR 300,000, pre-subscriptions by existing investors (ordinary + preference shares) counted into displayed progress.

### 3. Indirect participation - an ownership structure [OBSERVED]

- ewia 3.0 (S-029): placement volume EUR 2.0M, funding threshold EUR 200,000, unlimited term with waiver of termination until 31 Dec 2035, annual profit distribution, participation in company value = yes, targeted average return 37.93% p.a., company value disclosed, three named lead investors with amounts.
- Site definition: "Access to SME investments with simplified processing and typical participation risks" (S-001).
- Classification note: CONDA presents "Indirect Participation" as an asset-class label (S-001); in your hierarchy it is an ownership structure, not a distinct instrument. Which underlying participation the ewia 3.0 structure wraps is not resolvable from the archive captures, so the page's own label is preserved here. The Learn hub's "GmbH share via SPV" (S-080) is the same structural idea wrapped around a Share.

### 4. Limited partnership interest (KG-Anteil) [NOT SEEN IN THIS ARCHIVE]

- No campaign in this archive shows the instrument terms of a limited-partnership offering. A previous page review in our earlier work noted a Venture Space offering labelled in that direction; this archive's Venture Space captures (S-125..128) show only the closed page shell (status "Nicht erfolgreich", min EUR 100) without its Additional Info panel. Treat instrument mechanics as unverified until a live page or term sheet is captured.

### 5. Loan

Generic debt parent with three seniority states; the state is a property of the loan, not a separate instrument.

- **senior** - no example in this archive. [NOT SEEN IN THIS ARCHIVE]
- **subordinated** [OBSERVED, legacy 2017] - aiyp / "ants in your pants GmbH" (D-aiyp_darlehensvertrag): bilingual profit-participating subordinated loan agreement ("partiarisches Nachrangdarlehen"), base rate 5.5% or 4.5% p.a. (act/360) depending on offer date, maturity 30.04.2024, annual interest 30.06. This comes from CONDA's earlier platform generation; the archive does not show how CONDA structures subordinated loans today, and you should not assume the current "subordinated bond" label is legally the same instrument.
- **unspecified (seniority unspecified)** - no example in this archive; the full supplied campaign list holds 64 "Darlehen" rows whose fetched fields state no seniority (see [conda-full-list-by-project-type.md](conda-full-list-by-project-type.md)). [NOT SEEN IN THIS ARCHIVE]

### 6. Bond

Generic debt parent with three seniority states; the subordinated state includes explicitly subordinated qualified bonds and subordinated Mini Bonds.

- **senior (non-subordinated)** [OBSERVED] - devolo solutions GmbH (S-091, German page): headline 10% = 7% cash / 10% in-kind vouchers, EUR 250 units, funding threshold EUR 400,000, volume EUR 2.0M, term to 30.11.2029, annual interest 30.11. from 2027, bullet repayment, two ISINs.
- Emission conditions (D-devolo-Emissionsbedingungen §2.2): the securities are **direct, non-subordinated, unsecured** obligations ranking pari passu. The site explainer (S-080/091): bondholders rank ahead of subordinated capital and equity in insolvency; no participation in growth.
- **subordinated** [OBSERVED] - Eternal Power (S-022): 9.00% p.a. + 1.00% bonus p.a., term to 31.12.2028, EUR 250 units, no funding threshold, annual repayment, act/act, ISIN DE000A4DFN13.
- COOEE alpin / You Will Like It Hotels (S-012): cash interest 7% p.a. vs interest in kind 9% p.a. (vouchers), two ISINs, half-yearly payments 31 May / 30 Nov from 2027, 30E/360, funding threshold EUR 250,000, volume EUR 2.5M, repayment at maturity, 4% early discount until 30.09.2026.
- Explainer banner on the campaign page (S-012): mezzanine character, paid after non-subordinated creditors in insolvency, no participation in company growth.
- **unspecified** - no example in this archive; the full supplied list holds 19 "Bond" rows with no seniority stated in the fetched fields, plus 125 rows with a "nachrangig" hint that the fetched fields cannot resolve between Loan (5) and Bond (6) (see [conda-full-list-by-project-type.md](conda-full-list-by-project-type.md)). [NOT SEEN IN THIS ARCHIVE]

### Structure overlays (combine with 5 or 6, never standalone)

- **Convertible** [OBSERVED] - a conversion feature on a bond, not a standalone instrument: ProFem "Going Public Wandelanleihe" (S-114, German page; successfully financed): 8% p.a., EUR 500 units, funding threshold EUR 100,000, max EUR 2.5M, term to 30.12.2028, interest annually 30.12. (first 2026), repayment at maturity if not converted, ISIN AT0000A3QA28. The bond's seniority state is not established by the cited evidence.
- Conversion mechanics (D-20260109-Emissionsbedingungen-Profem §7): the conversion right arises when the issuer announces its planned IPO; exercisable on any business day within a one-month window after the announcement; whole bonds only; conversion price determined within the fixed price range; interest stops on the conversion day (§7.1, §7.2 and interest provisions).
- **Zero-coupon (Zero Bond)** [NOT SEEN IN THIS ARCHIVE] - a coupon structure, not a seniority. No campaign in this archive carries it.

### Rank and label qualifiers (site wording, preserved as-is)

- **"junior"** - a lower-rank label; indicates subordinated ranking but does not by itself establish contractual qualified subordination. Not recorded on any campaign in this archive's captured evidence.
- **"qualified / qualifiziert"** - the site's own wording on loans and bonds; on bonds it is not read as qualified subordination unless the term says subordinated. Not recorded on any campaign in this archive's captured evidence.
- **"Mini Bond"** - a small-denomination bond label. Not recorded on any campaign in this archive's captured evidence.

### Cross-instrument mechanics worth copying structurally [OBSERVED]

- One "Additional Info" schema with per-instrument field subsets (section 6).
- Separate ISINs per interest variant; explicit risk notice when in-kind interest carries the higher rate.
- Funding threshold (issue-level closing condition) shown separately from the per-investor minimum; per-investor min/max enforced in the invest widget (S-012).
- Progress accounting that consolidates pre-subscriptions and cross-platform volume with explanatory notes (S-022, S-039).
- Interest calculation method, payment calendar, repayment mode, discount windows, bonus rates, reward tiers as data fields, not prose.
- Closed campaigns stay public with final funding status; post-funding issuer events (incl. insolvency) are separate records (section 8).

---

## 11A. Observed campaigns by project type (industry)

> Scope: this section covers only the 12 campaigns in the ZIP archive, not the full CONDA list. The full supplied list (270 numbered rows, IDs 325-594) is classified by project type, with per-row evidence, in [conda-full-list-by-project-type.md](conda-full-list-by-project-type.md) and [conda-full-list-by-project-type.csv](conda-full-list-by-project-type.csv).

Section 11 groups the archive's campaigns by financial instrument; this section groups the same campaigns by what the funded company or project actually does. CONDA assigns each campaign one industry chip from a fixed taxonomy of ten industries (the listing filters in section 5) [OBSERVED, S-079; chips rendered on campaign headers, e.g. S-022, S-012]. Where a campaign's chip is visible in the archive or on the live page it is cited as the classification; where no chip was captured, the project type is derived from the campaign's own About text or issuer documents and marked as descriptive. Live-page checks were made on 2026-10-30, the same day as the archive captures. None of the campaigns in this archive is real-estate development - the set is operating-company financing, unlike real-estate crowdlending platforms such as dagobertinvest, where almost all campaigns in the reviewed 347-entry supplied list fund residential property projects.

### Energy and utilities [site chip observed]

- **oekostrom AG energy group - capital increase 2026 (share)** [OBSERVED, S-047..055; chip "Energy and utilities" on the live page]: Austrian renewable-electricity supplier, 100% renewable since 1999, about 130 MW plant portfolio, more than 106,000 customers (About text, live page).
- **Eternal Power Wasserstoff Invest (subordinated bond)** [OBSERVED, S-022..028; chip "Energy and utilities" verified visually on S-022 and on the live page]: green-hydrogen project developer based in Hamburg, sites in northern Germany and Sweden (About text, live page).
- **EWIA 3.0 (indirect participation)** [OBSERVED, S-029..038; chip "Energy and utilities" on the live page]: solar project developer and financier electrifying Africa, with operating subsidiaries in Ghana, Nigeria and Cameroon (About text, live page).

### Hospitality and tourism [site chip observed]

- **COOEE alpin - subordinated bond (You Will Like It Hotels GmbH)** [OBSERVED, S-012..021; chip "Hospitality and tourism" verified visually on S-012 and on the live page]: active hotels in the Austrian Alps (Bad Kleinkirchheim, Gosau am Dachstein, St. Johann in Tirol); issue proceeds for the conversion in Kaprun/Zell am See and the development of the Bad Goisern/Hallstatt site (About text, live page).
- **beets&roots - profit participation certificate** [OBSERVED, S-006..011; chip "Hospitality and tourism" on the live page]: healthy fast-food stores (bowls, salads, wraps) plus delivery and business catering in German cities, per the issuer's own website (beetsandroots.de, external source). Campaign ended "Unsuccessful".

### Information Technology [site chip observed]

- **Innolytics AG (share)** [OBSERVED, S-039..046; chip "Information Technology" on the live page]: AI software that automates complex corporate documentation (About text, live page).
- **devolo solutions GmbH (senior bond)** [OBSERVED, S-091..101; chip "Informationstechnologie" on the live German page]: home-networking hardware and software (Powerline adapters, WLAN mesh systems, repeaters, routers), based in Aachen (About text, live German page).

### Healthcare [descriptive - no chip captured]

- **ProFem - Going Public Wandelanleihe (convertible bond)** [OBSERVED, S-114..124]: pharmaceutical research company focused on women's health (Vienna); first product Candiplus near market launch after 13 years and more than EUR 15 million of research spending (About text, live German page). No industry chip was recorded in the archive analysis or visible in the extracted live page text; the description maps to the platform's "Healthcare" taxonomy entry.

### Fashion and apparel (consumer goods) [descriptive - no chip captured]

- **Gebrueder Stitch** [OBSERVED, S-102..107]: organic fair-trade jeans, made to measure and off the rack, produced in Vienna. The live campaign page names the issuer "ants in your pants GmbH" (live German page, 2026-10-30); the brand and its 2016 acquisition by ants in your pants GmbH are corroborated by textilzeitung.at (24 November 2016) and Wikipedia (external sources). No industry chip visible on the live page.
- **aiyp / ants in your pants GmbH (2017 subordinated loan)** [D-aiyp_darlehensvertrag; documents only, no campaign page in this archive]: same issuer legal entity as the Gebrueder Stitch campaign (live page observation above), hence the same project type.

### Food and beverage (brewery) [descriptive - no chip captured]

- **NIXE Bier 2** [OBSERVED, S-108..113]: beer brand - the live German page names issuer NIXE Bier GmbH; CONDA's legacy platform page for the earlier campaign generation describes "NIXE - Deutschlands Low-Carb Bier" by Nixe Deutschland GmbH, Hamburg (conda.at/startup/nixe-deutschland-gmbh, external source). The archive's insolvency documents concern nixe Brau GmbH, the brewery entity of the 2014 campaign generation (D-18a-konkursverfahren, D-insolvenzreport). No industry chip visible on the live page.

### Investment vehicle (multi-sector) [descriptive]

- **Venture Space** [OBSERVED, S-125..128, closed page shell]: not a single-sector operating company - the legacy campaign page describes a vehicle to "invest together in innovative companies" with a 2016-2018 tranche structure and a trustee service, Austria only (conda-capital.com/campaign/venture-space, external source). No industry chip; instrument terms remain unverified as noted in section 11 item 4.

### Platform-design notes [PROPOSED]

- Keep project type (industry) as a controlled-vocabulary field on Campaign (already in the data model, 14.1) with your own taxonomy. CONDA's ten industries are SME-oriented and include no real-estate development category, so if your platform will list property projects - compare the reviewed dagobertinvest supplied list, which is overwhelmingly residential development - add those types explicitly instead of forcing them into "Construction".
- Render the industry chip on listing cards and campaign headers and expose it as a listing filter, as CONDA does (S-079), and keep it data-driven so per-industry risk text or documents can be attached later.

### Live and external sources used in this section (all retrieved 2026-10-30)

- Live campaign pages: conda-capital.com/en/campaigns/beetsroots-profit-participation-certificate, /cooee-alpin-subordinated-bond-issued-by-you-will-like-it-hotels-gmbh, /eternal-power-wasserstoff-invest, /ewia-30-indirect-participation, /innolytics-ag-share, /oekostrom-ag-energy-group-capital-increase-2026-stock; German pages conda-capital.com/kampagnen/devolo-solutions-gmbh-anleihe, /gebrueder-stitch, /nixe-bier-2, /profem-going-public-wandelanleihe-4, /venture-space.
- https://www.beetsandroots.de/ (issuer's own site: healthy fast-food stores and catering)
- https://www.textilzeitung.at/business/news/gebrueder-stitch-sind-zurueck--3785 and https://en.wikipedia.org/wiki/Gebr%C3%BCder_Stitch (Gebrueder Stitch brand and ants in your pants GmbH)
- https://www.conda.at/startup/nixe-deutschland-gmbh/ (legacy CONDA page: NIXE low-carb beer)
- https://conda-capital.com/campaign/venture-space/ (legacy campaign page: Venture Space investment vehicle)

---

## 12. Partner and technical stack [OBSERVED, with document dates]

The archive's documents describe the following roles. Document dates are given because permissions and providers can change; treat them as "as of" statements, and verify current counterparts for your own build:

- **Payments:** secupay AG as payment service provider (secupay AGB versions 2020 and 2026 in archive; T&Cs §1.7/§3.4 assign all payment services to a licensed PSP).
- **Securities register / tokenisation:** Smart Registry GmbH - its GTC (dated 27 March 2025, D-20250509_Smart_Registry_AGB) describe it as registrar keeping an electronic securities register under sec. 4(3) eWpG "on a public blockchain protocol", with provisional permission under sec. 65(2) KWG; key custody expressly out of its scope.
- **Custody:** Hauck Aufhaeuser Digital Custody GmbH (HADC) - custody conditions (D-AGB_Kryptoverwahrung_HADC, 2023 versions) describe a BaFin-licensed (sec. 32 KWG) crypto-custody wallet for digital assets acquired via CONDA's platform.
- **E-signing:** signteq (footer partner, S-001).
- **Auth:** Keycloak SSO (S-136), captcha, SMS TAN inside KYC.
- Transfers of tokenised positions execute wallet-to-wallet between verified users [SITE-CLAIM, S-065 FAQ].

[PROPOSED] For your Stellar-based design, map roles rather than components: a payment rail (PSP escrow or on-chain settlement), a legally recognised register for each instrument class, a custody/key-management layer, and e-signing. Where a jurisdiction requires a licensed registrar/custodian for the token to be the legal security, your chain integration must operate inside that requirement; where it does not, a token may still only mirror a conventional register. The legal scope is per-instrument and per-jurisdiction and needs verification before architecture decisions.

---

## 13. What the archive does NOT show [UNKNOWN]

- Authenticated invest/checkout screens beyond the sidebar widget (amount entry detail, knowledge-test UI, payment-method selection, wallet UI).
- Admin/issuer backend: campaign builder, KYC review queue, payment reconciliation, comment moderation, payout execution.
- CONDA Marketplace UI (T&Cs §7 only).
- Email/notification templates, fee amounts, API, data model.
- Which current issues are actually tokenised vs conventionally registered.

---

## 14. Proposed implementation specification for your platform [PROPOSED - not observed CONDA internals]

Everything in sections 14 and 15 is a proposed design derived from the observed surface. (Section 16 is the evidence source index.) It is not a description of CONDA's backend, which is [UNKNOWN].

### 14.1 Core data entities and relationships

- **User** (id, role: investor/admin/issuer-contact; status: registered -> profile-complete -> kyc-verified; locale; created_at)
- **IdentityVerification** (user_id, provider, level: basic/full, document type, verified_at, expires_at, failure_reason) - 1:1 current + history
- **CompanyAccount** (id, legal_name, register_id, country, owners[]>25%, status) linked N:1 to a primary User; **AccountMembership** lets one user act in personal or company context
- **Issuer** (company data, onboarding status, eligibility checklist, assigned campaign manager)
- **Campaign** (issuer_id, slug, title, category, country, status, funding_threshold, issue_volume, goal, subscription_window, offered_in_countries[], risk texts, marketing content blocks, video, rewards tiers[])
- **Instrument** (campaign_id, parent: participation_right | share | limited_partnership_interest | loan | bond, subtype (e.g. substanzgenussrecht under participation_right), seniority: senior | subordinated | unspecified (loan/bond only), overlays[] (zero_coupon | convertible; only on loan/bond, never standalone), structure (e.g. indirect_participation - an ownership-structure attribute, not a parent), site_labels[] (verbatim rank/label qualifiers such as "junior", "qualified/qualifiziert", "Mini Bond"), isin_per_variant[], unit_nominal, min_subscription_units, currency, term_start/end, interest variants[] {cash_rate, in_kind_rate, calc_method, payment_schedule[], repayment_mode}, bonus_rules[], discount_windows[], conversion_terms{trigger, window, pricing}, valuation fields for equity)
- **Document** (campaign_id, type: KIIS/AIB/emission-conditions/prospectus/pitch/financials, file, version, visibility: public/registered)
- **InvestmentOrder** (investor account_id, campaign_id, variant, units, amount, status, reflection_period_ends_at, offer_timestamp, cancel_timestamp)
- **Payment** (order_id, method, reference, amount, status: expected/received/unallocated/allocated/refunded, psp_ids)
- **Position** (account_id, instrument_id, units, register_ref/token_ref, status: issued/held/transferred/redeemed/converted/impaired)
- **Transfer** (position_id, from_account, to_account, status, bilateral_agreement_ref)
- **CorporateAction** (instrument_id, type: interest/redemption/conversion/insolvency-notice, due_date, amount, prerequisite_form, status)
- **Content**: NewsPost, Comment (moderated), Event, FAQEntry, KBArticle, SupportTicket
- **AuditLog** (actor, action, entity, before/after, timestamp) - append-only

### 14.2 State machines

**Campaign:** draft -> issuer-docs-review -> approved -> pre-subscription -> live -> (threshold met | closed) -> successful -> settling -> settled; live -> closed-unsuccessful -> refunded. Independent issuer-lifecycle dimension after settlement: performing -> watch -> default -> insolvency (drives communications and corporate actions; never overwrite the funding outcome).

**InvestmentOrder:** draft -> submitted (offer) -> [optional branch: reflection-period, cancellable - applicability and length governed by investor class, the applicable legal regime and the configured campaign terms; observed on CONDA: 4 calendar days for non-sophisticated investors] -> bound -> payment-pending -> paid -> settled (position issued). Cancellation paths: revoked-in-reflection where applicable (free), other statutory or contractual withdrawal rights where they exist, expired-offer, campaign-failed -> refunded. Payment sub-states: allocated automatically by reference; unallocated -> manual review queue.

**Position:** issued -> held -> (transfer-pending -> transferred) | (redeemed at schedule) | (converted on conversion event) | (written-down on insolvency).

### 14.3 Roles and admin operations

- **Investor Relations:** KYC review and re-requests, company account approval, verified-data change requests (with proof documents), manual payment allocation (unallocated queue, joint accounts), inheritance transfers, account deletion workflow.
- **Campaign manager (issuer ops):** issuer onboarding checklist, campaign builder (all Additional Info fields, documents, rewards), pre-subscription and cross-platform volume entries with audit note, publish/close actions, news posts.
- **Compliance:** KIIS/AIB approval, risk-warning and marketing-content separation enforcement, knowledge-test and loss-simulation configuration, reflection-period monitoring, complaints register, conflicts and continuity page maintenance.
- **Finance:** PSP reconciliation, payout to issuers after threshold + reflection expiry, refund runs, corporate-action execution (interest/redemption), prerequisite-form tracking.
- **Support:** KB editing, ticket queue, comment moderation.
- Every state-changing admin action writes to AuditLog with actor and reason.

### 14.4 Validation and edge cases

- Enforce unit multiples, per-investor min and max, per-campaign caps, offered-country eligibility and investor categorisation at order submission.
- Gate investing on KYC and, for the investor classes the applicable regime requires (observed: non-sophisticated investors), the knowledge test and loss-bearing simulation; sophisticated-classified investors follow the regime's lighter path. Re-prompt when verification expires.
- Reflection-period clock where the applicable regime requires it (observed: 4 calendar days for non-sophisticated investors under the ECSP terms cited in section 7): start at offer submission; cancellation must be as easy as the invest action; block settlement of the affected funds until expiry. Preserve any additional statutory or contractual withdrawal, termination and refund rights per instrument and jurisdiction - the reflection period is a floor for the covered class of investors, not the only exit right.
- Payment allocation: exact match on reference + amount + account; everything else to the manual queue with investor notification; joint-account rule (single-person accounts: hold + review).
- Funding-threshold logic: define all-or-nothing vs no-threshold campaigns; on failure, refund run with status visibility in the dashboard.
- Interest in kind vs cash: separate variants, separate ISINs, explicit risk acknowledgement for the in-kind option.
- Conversion events: trigger type, exercise window length, whole-unit vs partial conversion, price determination and interest stop date must all be configurable per instrument terms (the ProFem terms - IPO-announcement trigger, one-month window, whole bonds only - are one campaign's settings, not universal rules).
- Cross-platform/pre-subscription volume: editable only with audit note; progress widget must show the note.
- Insolvency lifecycle: status page per issuer, document uploads (court filings), investor notifications; keep the funded campaign page public.
- White-label separation: accounts, sessions and credentials strictly per instance.

### 14.5 Security, privacy, accessibility, mobile

- SSO with MFA; SMS TAN only as a KYC step, not as sole auth; rate-limit auth endpoints; captcha on registration.
- Encrypt KYC documents at rest; restricted, logged access; retention and deletion per GDPR; verified personal data locked from self-service edits.
- Role-based admin access with least privilege; append-only audit log; PSP and custody secrets in a managed vault.
- WCAG 2.2 AA targets: contrast, focus states, accordion/tab keyboard navigation (FAQ, campaign tabs), alt text for campaign media.
- Mobile-first responsive layouts: card grids collapse to single column; the invest widget sticks; tables (Additional Info) become stacked key-value rows.
- Internationalisation architecture from day one with configurable locales; the archive observed EN and DE, but your launch locales are your own decision.

### 14.6 Acceptance criteria (examples)

- A non-verified user cannot reach the order-confirmation step on any campaign (test: direct URL + UI).
- Where the reflection-period regime applies to the investor class, an order submitted at T0 is revocable with one click until T0+4 days; revoked orders never settle funds. Other statutory or contractual withdrawal and refund rights still apply where they exist.
- A transfer with a wrong payment reference appears in the manual-allocation queue within one PSP sync cycle and never auto-allocates.
- The campaign page renders every Additional Info field from data (no free-text terms), and hides non-applicable fields per instrument class.
- A failed campaign triggers a refund run and the page switches to "Unsuccessful" without losing documents.
- Every admin mutation appears in AuditLog with actor, timestamp, reason.

### 14.7 MVP vs follow-ons [PROPOSED]

- **MVP:** public site + campaign pages (one debt parent first - Bond in a senior or subordinated state, simplest data model), registration + KYC, knowledge test, invest flow with reflection period, PSP payments with manual-allocation queue, dashboard, documents, FAQ/support KB, compliance pages, admin: KYC review + campaign builder + payment reconciliation.
- **Follow-ons:** further parents, subtypes and overlays (Share with the prospectus flow, convertible overlay with conversion events, indirect-participation structures, participation certificates incl. the Substanzgenussrecht subtype, limited partnership interest if needed), company accounts, rewards, comments/news, events, marketplace bulletin board, white-label, tokenised register/custody integration per jurisdiction.

---

## 15. Open decisions for you [PROPOSED]

- Licence path (own ECSP vs partnering a licensed provider) - decides which compliance features you own.
- Register model per instrument/jurisdiction: where a token can be the legal security, where it mirrors a conventional register.
- Payment rails: PSP escrow vs on-chain settlement; fiat-only vs stablecoin funding.
- Launch instrument sequence (section 14.7).
- Whether to build the white-label dimension into the data model from day one (account isolation is hard to retrofit).

---

## 16. Source index

**S-ids** cite exact screencapture filenames in the archive (the companion CSV `conda-capital-source-index.csv` carries the same mapping, one row per id). **D-ids** cite document PDFs: the D- prefix and short alias are citation markers in this document. Each alias used in the body resolves to a literal archive filename in the alias table below; the full literal filename list follows. Some archive filenames contain URL-escaped characters (e.g. `#U00fc` = u-umlaut) exactly as zipped.

### Site structure, home, listing, legal

- S-000 = `screencapture-conda-capital-en-faqs-2026-10-30-15_02_47.png`
- S-001 = `screencapture-conda-capital-en-2026-10-30-14_46_23.pdf`
- S-002 = `screencapture-conda-capital-en-2026-10-30-14_46_42.pdf`
- S-003 = `screencapture-conda-capital-en-about-us-2026-10-30-15_09_27.pdf`
- S-004 = `screencapture-conda-capital-en-blog-2026-10-30-15_00_20.pdf`
- S-005 = `screencapture-conda-capital-en-business-solutions-2026-10-30-14_48_23.pdf`
- S-056 = `screencapture-conda-capital-en-complaints-management-2026-10-30-15_55_10.pdf`
- S-078 = `screencapture-conda-capital-en-financing-2026-10-30-14_48_12.pdf`
- S-079 = `screencapture-conda-capital-en-investments-2026-10-30-14_47_02.pdf`
- S-080 = `screencapture-conda-capital-en-knowledge-2026-10-30-14_48_45.pdf`
- S-081 = `screencapture-conda-capital-en-knowledge-2026-10-30-14_48_56.pdf`
- S-082 = `screencapture-conda-capital-en-knowledge-2026-10-30-14_50_39.pdf`
- S-084 = `screencapture-conda-capital-en-let-them-pitch-2026-10-30-15_09_11.pdf`
- S-086 = `screencapture-conda-capital-en-podcast-2026-10-30-15_00_37.pdf`
- S-087 = `screencapture-conda-capital-en-press-2026-10-30-15_10_05.pdf`
- S-089 = `screencapture-conda-capital-en-risk-warnings-2026-10-30-14_47_54.pdf`
- S-090 = `screencapture-conda-capital-en-terms-and-conditions-2026-10-30-15_52_42.pdf`

### FAQ page captures (one expanded answer per capture)

- S-058 = `screencapture-conda-capital-en-faqs-2026-10-30-15_00_57.pdf`
- S-059 = `screencapture-conda-capital-en-faqs-2026-10-30-15_01_09.pdf`
- S-060 = `screencapture-conda-capital-en-faqs-2026-10-30-15_01_20.pdf`
- S-061 = `screencapture-conda-capital-en-faqs-2026-10-30-15_01_30.pdf`
- S-062 = `screencapture-conda-capital-en-faqs-2026-10-30-15_01_39.pdf`
- S-063 = `screencapture-conda-capital-en-faqs-2026-10-30-15_01_48.pdf`
- S-064 = `screencapture-conda-capital-en-faqs-2026-10-30-15_01_57.pdf`
- S-065 = `screencapture-conda-capital-en-faqs-2026-10-30-15_02_06.pdf`
- S-066 = `screencapture-conda-capital-en-faqs-2026-10-30-15_02_16.pdf`
- S-067 = `screencapture-conda-capital-en-faqs-2026-10-30-15_02_28.pdf`
- S-068 = `screencapture-conda-capital-en-faqs-2026-10-30-15_02_37.pdf`
- S-069 = `screencapture-conda-capital-en-faqs-2026-10-30-15_02_59.pdf`
- S-070 = `screencapture-conda-capital-en-faqs-2026-10-30-15_03_07.pdf`
- S-071 = `screencapture-conda-capital-en-faqs-2026-10-30-15_03_15.pdf`
- S-072 = `screencapture-conda-capital-en-faqs-2026-10-30-15_03_26.pdf`
- S-073 = `screencapture-conda-capital-en-faqs-2026-10-30-15_03_35.pdf`
- S-074 = `screencapture-conda-capital-en-faqs-2026-10-30-15_03_59.pdf`
- S-075 = `screencapture-conda-capital-en-faqs-2026-10-30-15_04_09.pdf`
- S-076 = `screencapture-conda-capital-en-faqs-2026-10-30-15_04_18.pdf`
- S-077 = `screencapture-conda-capital-en-faqs-2026-10-30-15_04_40.pdf`

### beetsroots (participation certificate)

- S-006 = `screencapture-conda-capital-en-campaigns-beetsroots-profit-participation-certificate-2026-10-30-15_15_40.pdf`
- S-007 = `screencapture-conda-capital-en-campaigns-beetsroots-profit-participation-certificate-2026-10-30-15_16_05.pdf`
- S-008 = `screencapture-conda-capital-en-campaigns-beetsroots-profit-participation-certificate-2026-10-30-15_16_16.pdf`
- S-009 = `screencapture-conda-capital-en-campaigns-beetsroots-profit-participation-certificate-2026-10-30-15_19_24.pdf`
- S-010 = `screencapture-conda-capital-en-campaigns-beetsroots-profit-participation-certificate-2026-10-30-15_19_38.pdf`
- S-011 = `screencapture-conda-capital-en-campaigns-beetsroots-profit-participation-certificate-2026-10-30-15_19_48.pdf`

### COOEE alpin subordinated bond (You Will Like It Hotels)

- S-012 = `screencapture-conda-capital-en-campaigns-cooee-alpin-subordinated-bond-issued-by-you-will-like-it-hotels-gmbh-2026-10-30-15_20_37.pdf`
- S-013 = `screencapture-conda-capital-en-campaigns-cooee-alpin-subordinated-bond-issued-by-you-will-like-it-hotels-gmbh-2026-10-30-15_21_06.pdf`
- S-014 = `screencapture-conda-capital-en-campaigns-cooee-alpin-subordinated-bond-issued-by-you-will-like-it-hotels-gmbh-2026-10-30-15_21_21.pdf`
- S-015 = `screencapture-conda-capital-en-campaigns-cooee-alpin-subordinated-bond-issued-by-you-will-like-it-hotels-gmbh-2026-10-30-15_21_35.pdf`
- S-016 = `screencapture-conda-capital-en-campaigns-cooee-alpin-subordinated-bond-issued-by-you-will-like-it-hotels-gmbh-2026-10-30-15_21_57.pdf`
- S-017 = `screencapture-conda-capital-en-campaigns-cooee-alpin-subordinated-bond-issued-by-you-will-like-it-hotels-gmbh-2026-10-30-15_22_15.pdf`
- S-018 = `screencapture-conda-capital-en-campaigns-cooee-alpin-subordinated-bond-issued-by-you-will-like-it-hotels-gmbh-2026-10-30-15_22_33.pdf`
- S-019 = `screencapture-conda-capital-en-campaigns-cooee-alpin-subordinated-bond-issued-by-you-will-like-it-hotels-gmbh-2026-10-30-15_22_43.pdf`
- S-020 = `screencapture-conda-capital-en-campaigns-cooee-alpin-subordinated-bond-issued-by-you-will-like-it-hotels-gmbh-2026-10-30-15_22_55.pdf`
- S-021 = `screencapture-conda-capital-en-campaigns-cooee-alpin-subordinated-bond-issued-by-you-will-like-it-hotels-gmbh-2026-10-30-15_24_51.pdf`

### Eternal Power Wasserstoff Invest (subordinated bond)

- S-022 = `screencapture-conda-capital-en-campaigns-eternal-power-wasserstoff-invest-2026-10-30-15_46_04.pdf`
- S-023 = `screencapture-conda-capital-en-campaigns-eternal-power-wasserstoff-invest-2026-10-30-15_46_14.pdf`
- S-024 = `screencapture-conda-capital-en-campaigns-eternal-power-wasserstoff-invest-2026-10-30-15_46_25.pdf`
- S-025 = `screencapture-conda-capital-en-campaigns-eternal-power-wasserstoff-invest-2026-10-30-15_46_35.pdf`
- S-026 = `screencapture-conda-capital-en-campaigns-eternal-power-wasserstoff-invest-2026-10-30-15_46_45.pdf`
- S-027 = `screencapture-conda-capital-en-campaigns-eternal-power-wasserstoff-invest-2026-10-30-15_46_58.pdf`
- S-028 = `screencapture-conda-capital-en-campaigns-eternal-power-wasserstoff-invest-2026-10-30-15_47_07.pdf`

### ewia 3.0 (indirect participation)

- S-029 = `screencapture-conda-capital-en-campaigns-ewia-30-indirect-participation-2026-10-30-15_40_24.pdf`
- S-030 = `screencapture-conda-capital-en-campaigns-ewia-30-indirect-participation-2026-10-30-15_40_38.pdf`
- S-031 = `screencapture-conda-capital-en-campaigns-ewia-30-indirect-participation-2026-10-30-15_40_50.pdf`
- S-032 = `screencapture-conda-capital-en-campaigns-ewia-30-indirect-participation-2026-10-30-15_41_21.pdf`
- S-033 = `screencapture-conda-capital-en-campaigns-ewia-30-indirect-participation-2026-10-30-15_41_33.pdf`
- S-034 = `screencapture-conda-capital-en-campaigns-ewia-30-indirect-participation-2026-10-30-15_41_44.pdf`
- S-035 = `screencapture-conda-capital-en-campaigns-ewia-30-indirect-participation-2026-10-30-15_41_54.pdf`
- S-036 = `screencapture-conda-capital-en-campaigns-ewia-30-indirect-participation-2026-10-30-15_42_04.pdf`
- S-037 = `screencapture-conda-capital-en-campaigns-ewia-30-indirect-participation-2026-10-30-15_42_18.pdf`
- S-038 = `screencapture-conda-capital-en-campaigns-ewia-30-indirect-participation-2026-10-30-15_42_28.pdf`

### innolytics AG (share)

- S-039 = `screencapture-conda-capital-en-campaigns-innolytics-ag-share-2026-10-30-15_43_16.pdf`
- S-040 = `screencapture-conda-capital-en-campaigns-innolytics-ag-share-2026-10-30-15_43_29.pdf`
- S-041 = `screencapture-conda-capital-en-campaigns-innolytics-ag-share-2026-10-30-15_43_39.pdf`
- S-042 = `screencapture-conda-capital-en-campaigns-innolytics-ag-share-2026-10-30-15_43_47.pdf`
- S-043 = `screencapture-conda-capital-en-campaigns-innolytics-ag-share-2026-10-30-15_43_56.pdf`
- S-044 = `screencapture-conda-capital-en-campaigns-innolytics-ag-share-2026-10-30-15_44_05.pdf`
- S-045 = `screencapture-conda-capital-en-campaigns-innolytics-ag-share-2026-10-30-15_44_17.pdf`
- S-046 = `screencapture-conda-capital-en-campaigns-innolytics-ag-share-2026-10-30-15_44_29.pdf`

### oekostrom AG (share - capital increase campaign)

- S-047 = `screencapture-conda-capital-en-campaigns-oekostrom-ag-energy-group-capital-increase-2026-stock-2026-10-30-15_35_55.pdf`
- S-048 = `screencapture-conda-capital-en-campaigns-oekostrom-ag-energy-group-capital-increase-2026-stock-2026-10-30-15_36_14.pdf`
- S-049 = `screencapture-conda-capital-en-campaigns-oekostrom-ag-energy-group-capital-increase-2026-stock-2026-10-30-15_36_26.pdf`
- S-050 = `screencapture-conda-capital-en-campaigns-oekostrom-ag-energy-group-capital-increase-2026-stock-2026-10-30-15_36_39.pdf`
- S-051 = `screencapture-conda-capital-en-campaigns-oekostrom-ag-energy-group-capital-increase-2026-stock-2026-10-30-15_36_51.pdf`
- S-052 = `screencapture-conda-capital-en-campaigns-oekostrom-ag-energy-group-capital-increase-2026-stock-2026-10-30-15_37_03.pdf`
- S-053 = `screencapture-conda-capital-en-campaigns-oekostrom-ag-energy-group-capital-increase-2026-stock-2026-10-30-15_37_13.pdf`
- S-054 = `screencapture-conda-capital-en-campaigns-oekostrom-ag-energy-group-capital-increase-2026-stock-2026-10-30-15_37_31.pdf`
- S-055 = `screencapture-conda-capital-en-campaigns-oekostrom-ag-energy-group-capital-increase-2026-stock-2026-10-30-15_39_16.pdf`

### devolo solutions (senior bond, German pages)

- S-091 = `screencapture-conda-capital-kampagnen-devolo-solutions-gmbh-anleihe-2026-10-30-16_08_34.pdf`
- S-092 = `screencapture-conda-capital-kampagnen-devolo-solutions-gmbh-anleihe-2026-10-30-16_08_57.pdf`
- S-093 = `screencapture-conda-capital-kampagnen-devolo-solutions-gmbh-anleihe-2026-10-30-16_09_07.pdf`
- S-094 = `screencapture-conda-capital-kampagnen-devolo-solutions-gmbh-anleihe-2026-10-30-16_09_18.pdf`
- S-095 = `screencapture-conda-capital-kampagnen-devolo-solutions-gmbh-anleihe-2026-10-30-16_09_35.pdf`
- S-096 = `screencapture-conda-capital-kampagnen-devolo-solutions-gmbh-anleihe-2026-10-30-16_09_51.pdf`
- S-097 = `screencapture-conda-capital-kampagnen-devolo-solutions-gmbh-anleihe-2026-10-30-16_10_02.pdf`
- S-098 = `screencapture-conda-capital-kampagnen-devolo-solutions-gmbh-anleihe-2026-10-30-16_10_17.pdf`
- S-099 = `screencapture-conda-capital-kampagnen-devolo-solutions-gmbh-anleihe-2026-10-30-16_10_36.pdf`
- S-100 = `screencapture-conda-capital-kampagnen-devolo-solutions-gmbh-anleihe-2026-10-30-16_10_49.pdf`
- S-101 = `screencapture-conda-capital-kampagnen-devolo-solutions-gmbh-anleihe-2026-10-30-16_12_48.pdf`

### Gebrueder Stitch (German pages)

- S-102 = `screencapture-conda-capital-kampagnen-gebrueder-stitch-2026-10-30-16_05_34.pdf`
- S-103 = `screencapture-conda-capital-kampagnen-gebrueder-stitch-2026-10-30-16_05_46.pdf`
- S-104 = `screencapture-conda-capital-kampagnen-gebrueder-stitch-2026-10-30-16_05_56.pdf`
- S-105 = `screencapture-conda-capital-kampagnen-gebrueder-stitch-2026-10-30-16_06_07.pdf`
- S-106 = `screencapture-conda-capital-kampagnen-gebrueder-stitch-2026-10-30-16_06_15.pdf`
- S-107 = `screencapture-conda-capital-kampagnen-gebrueder-stitch-2026-10-30-16_07_22.pdf`

### nixe Bier 2 (German pages)

- S-108 = `screencapture-conda-capital-kampagnen-nixe-bier-2-2026-10-30-16_29_48.pdf`
- S-109 = `screencapture-conda-capital-kampagnen-nixe-bier-2-2026-10-30-16_30_02.pdf`
- S-110 = `screencapture-conda-capital-kampagnen-nixe-bier-2-2026-10-30-16_30_13.pdf`
- S-111 = `screencapture-conda-capital-kampagnen-nixe-bier-2-2026-10-30-16_30_21.pdf`
- S-112 = `screencapture-conda-capital-kampagnen-nixe-bier-2-2026-10-30-16_31_05.pdf`
- S-113 = `screencapture-conda-capital-kampagnen-nixe-bier-2-2026-10-30-16_39_05.pdf`

### ProFem convertible bond (German pages)

- S-114 = `screencapture-conda-capital-kampagnen-profem-going-public-wandelanleihe-4-2026-10-30-16_14_00.pdf`
- S-115 = `screencapture-conda-capital-kampagnen-profem-going-public-wandelanleihe-4-2026-10-30-16_14_10.pdf`
- S-116 = `screencapture-conda-capital-kampagnen-profem-going-public-wandelanleihe-4-2026-10-30-16_14_21.pdf`
- S-117 = `screencapture-conda-capital-kampagnen-profem-going-public-wandelanleihe-4-2026-10-30-16_14_34.pdf`
- S-118 = `screencapture-conda-capital-kampagnen-profem-going-public-wandelanleihe-4-2026-10-30-16_14_45.pdf`
- S-119 = `screencapture-conda-capital-kampagnen-profem-going-public-wandelanleihe-4-2026-10-30-16_14_57.pdf`
- S-120 = `screencapture-conda-capital-kampagnen-profem-going-public-wandelanleihe-4-2026-10-30-16_15_07.pdf`
- S-121 = `screencapture-conda-capital-kampagnen-profem-going-public-wandelanleihe-4-2026-10-30-16_15_18.pdf`
- S-122 = `screencapture-conda-capital-kampagnen-profem-going-public-wandelanleihe-4-2026-10-30-16_15_31.pdf`
- S-123 = `screencapture-conda-capital-kampagnen-profem-going-public-wandelanleihe-4-2026-10-30-16_15_48.pdf`
- S-124 = `screencapture-conda-capital-kampagnen-profem-going-public-wandelanleihe-4-2026-10-30-16_17_14.pdf`

### Venture Space (closed page shell, German)

- S-125 = `screencapture-conda-capital-kampagnen-venture-space-2026-10-30-16_22_47.pdf`
- S-126 = `screencapture-conda-capital-kampagnen-venture-space-2026-10-30-16_22_59.pdf`
- S-127 = `screencapture-conda-capital-kampagnen-venture-space-2026-10-30-16_23_09.pdf`
- S-128 = `screencapture-conda-capital-kampagnen-venture-space-2026-10-30-16_23_19.pdf`

### Auxiliary services and auth

- S-129 = `screencapture-drive-conda-online-external-54878a8a5ae62ccbff6304b140a0e5d36114122e6573c3f73848759436fd169e-2026-10-30-15_10_25.pdf`
- S-130 = `screencapture-events-conda-online-events-2026-10-30-15_08_07.pdf`
- S-131 = `screencapture-events-conda-online-events-2026-10-30-15_08_50.pdf`
- S-132 = `screencapture-forms-conda-capital-conda17-form-Beschwerde-formperma-3AwZhd3FLS-yyVIikMaVYB0Cie96aAZ8YmVfD70inJs-2026-10-30-15_55_30.pdf`
- S-133 = `screencapture-jobs-conda-capital-jobs-Careers-2026-10-30-15_09_51.pdf`
- S-134 = `screencapture-login-conda-capital-auth-realms-condaCM-login-actions-authenticate-2026-10-30-15_17_16.pdf`
- S-135 = `screencapture-login-conda-capital-auth-realms-condaCM-login-actions-authenticate-2026-10-30-15_17_27.pdf`
- S-136 = `screencapture-login-conda-capital-auth-realms-condaCM-login-actions-registration-2026-10-30-15_17_36.pdf`
- S-137 = `screencapture-login-conda-capital-auth-realms-condaCM-login-actions-required-action-2026-10-30-15_17_05.pdf`

### Support portal and KB articles

- S-138 = `screencapture-support-conda-capital-portal-en-home-2026-10-30-15_05_04.pdf`
- S-139 = `screencapture-support-conda-capital-portal-en-kb-articles-changing-personal-details-or-address-2026-10-30-15_05_52.pdf`
- S-140 = `screencapture-support-conda-capital-portal-en-kb-articles-how-do-i-delete-or-deactivate-my-account-2026-10-30-15_06_09.pdf`
- S-141 = `screencapture-support-conda-capital-portal-en-kb-articles-how-do-i-invest-as-a-business-2026-10-30-15_06_35.pdf`
- S-142 = `screencapture-support-conda-capital-portal-en-kb-articles-how-do-i-verify-my-account-with-conda-capital-market-2026-10-30-15_05_20.pdf`
- S-143 = `screencapture-support-conda-capital-portal-en-kb-articles-how-do-i-verify-my-account-with-conda-capital-market-29-4-2026-2026-10-30-15_05_40.pdf`
- S-144 = `screencapture-support-conda-capital-portal-en-kb-articles-i-am-unable-to-invest-2026-10-30-15_06_53.pdf`
- S-145 = `screencapture-support-conda-capital-portal-en-kb-articles-i-have-made-a-payment-from-a-joint-account-what-happens-now-2026-10-30-15_07_24.pdf`
- S-146 = `screencapture-support-conda-capital-portal-en-kb-articles-login-problems-or-forgotten-password-2026-10-30-15_06_21.pdf`
- S-147 = `screencapture-support-conda-capital-portal-en-kb-articles-my-investments-aren-t-listed-in-the-dashboard-what-can-i-do-2026-10-30-15_07_45.pdf`
- S-148 = `screencapture-support-conda-capital-portal-en-kb-articles-what-can-i-do-if-the-payment-reference-is-missing-or-incorrect-2026-10-30-15_07_07.pdf`

### D-alias resolution table (aliases used in the body -> literal archive filename)

- D-AGB_Anleger_CONDA_2026-10-12 = `AGB_Anleger_CONDA_2026-10-12.pdf`
- D-20250509_Smart_Registry_AGB = `20250509_Smart_Registry_AGB_Registerfuehrung_ENG.pdf`
- D-AGB_Kryptoverwahrung_HADC = `AGB_Kryptoverwahrung_HADC.pdf` (English variant: `AGB_Kryptoverwahrung_HADC-en.pdf`)
- D-devolo-Emissionsbedingungen = `devolo-Anleihe---Emissionsbedingungen---Sept-2026.pdf`
- D-devolo-KIIS = `devolo-Anleihe---KIIS--Sept-2026.pdf`
- D-20260109-Emissionsbedingungen-Profem = `20260109-Emissionsbedingungen-Profem.pdf`
- D-Profem_Anlagebasisinformationsblatt = `Profem_Anlagebasisinformationsblatt_20260109.pdf`
- D-oekostrom-Prospekt = `oekostrom-Prospekt-gebilligt-(31.-August-2026)(30480103.1).pdf`
- D-KIIS-oekostrom = `KIIS-oekostrom-v7-final_Signiert.pdf`
- D-treuhand_und_substanzgenussrechtsvertrag_nixe = `treuhand_und_substanzgenussrechtsvertrag_nixe_29092014.pdf`
- D-fernabsatz_kundeninformation_nixe = `fernabsatz_kundeninformation_nixe_29092014.pdf`
- D-18a-konkursverfahren = `18a-konkursverfahren-nixe-brau-gmbh.pdf`
- D-insolvenzreport = `insolvenzreport_20014037-12.pdf`
- D-aiyp_darlehensvertrag = `aiyp_darlehensvertrag_1701-1.pdf`
- D-aiyp_vibuwdr = `aiyp_vibuwdr_45_20170118-1.pdf`
- D-abfrageformular = `abfrageformular-zinsauszahlungsvoraussetzungen_gebrder-stitch.pdf`
- D-Fernabsatz = `Fernabsatz-Zusatz--und-Belehrungsdokument-f#U00fcr-Anleger-Okt-2026.pdf` (You Will Like It variant: `Fernabsatz-Zusatz--und-Belehrungsdokument-f#U00fcr-Anleger_You_Will_Like_It_Hotels_GmbH.pdf`)
- D-Widerrufsbelehrung = `Widerrufsbelehrung.pdf`

### Documents (literal archive filenames)

- `18a-konkursverfahren-nixe-brau-gmbh.pdf`
- `20250509_Smart_Registry_AGB_Registerfuehrung_ENG.pdf`
- `20251128_CONDA_AGB_DE_EN_IT.pdf`
- `20260109-Emissionsbedingungen-Profem.pdf`
- `251009_ProFem_Pitch-Deck.pdf`
- `AGB-CONDA-Capital.pdf`
- `AGB-Kryptoverwahrung-HADC.pdf`
- `AGB-secupay-AG.pdf`
- `AGB_Anleger_CONDA_2026-10-12.pdf`
- `AGB_CONDACapital_202411 (1).pdf`
- `AGB_CONDACapital_202411 (2).pdf`
- `AGB_CONDACapital_202411.pdf`
- `AGB_Kryptoverwahrung_HADC-en.pdf`
- `AGB_Kryptoverwahrung_HADC.pdf`
- `AGB_Smart_Registry_Registerf#U00fchrung_DE.pdf`
- `AGB_Smart_Registry_Registerfu#U0308hrung_DE (1).pdf`
- `AGB_Smart_Registry_Registerfu#U0308hrung_DE.pdf`
- `Anlagebasisinformationsblatt-You-will-like-it-Hotels-GmbH.pdf`
- `DataPrivacy_CONDACapitalMarket202411.pdf`
- `Emissionsbedingungen-You-Will-Like-It-Hotels-GmbH.pdf`
- `Fernabsatz-Zusatz--und-Belehrungsdokument-f#U00fcr-Anleger-Okt-2026.pdf`
- `Fernabsatz-Zusatz--und-Belehrungsdokument-f#U00fcr-Anleger_You_Will_Like_It_Hotels_GmbH.pdf`
- `Fernabsatz-Zusatz--und-Belehrungsdokument-fu#U0308r-Anleger-Okt-2026.pdf`
- `Jahresabschluss-You-Will-Like-It-Hotels-GmbH-2025.pdf`
- `KIIS-oekostrom-v7-final_Signiert.pdf`
- `Kryptoverwahrung_HADC_AGB_2023.pdf`
- `Pitch-Deck_devolo_v2.pdf`
- `Pitchdeck-COOEE-alpin.pdf`
- `ProFem-Quartalsbericht_Q3_2025.pdf`
- `Profem-JAB-2024-def-180425-signed-GF.pdf`
- `Profem_Anlagebasisinformationsblatt_20260109.pdf`
- `Term-Sheet-oekostrom-v6-final_signiert.pdf`
- `Widerrufsbelehrung.pdf`
- `abfrageformular-zinsauszahlungsvoraussetzungen_gebrder-stitch.pdf`
- `aiyp-investment-proposal_dt.pdf`
- `aiyp_altf-infov_1701_0_compr.pdf`
- `aiyp_darlehensvertrag_1701-1.pdf`
- `aiyp_vibuwdr_45_20170118-1.pdf`
- `devolo-Anleihe---Emissionsbedingungen---Sept-2026.pdf`
- `devolo-Anleihe---KIIS--Sept-2026.pdf`
- `devolo_solutions_GmbH__JA_2025.pdf`
- `fernabsatz_kundeninformation_nixe_29092014.pdf`
- `insolvenzreport_20014037-12.pdf`
- `oekostrom-Prospekt-gebilligt-(31.-August-2026)(30480103.1).pdf`
- `oekostrom_Kapitalerhoehung_Investorenprasentation_Upload.pdf`
- `secupay_AG_AGB-2026 (1).pdf`
- `secupay_AG_AGB-2026.pdf`
- `secupay_AG_AGB_20200316_DE.pdf`
- `secupay_AG_AGB_DE-EN.pdf`
- `treuhand_und_substanzgenussrechtsvertrag_nixe_29092014.pdf`
