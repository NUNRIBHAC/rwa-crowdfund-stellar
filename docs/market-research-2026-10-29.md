# Crowdfunding market research - 2026-10-29

Prepared to inform the frontend redesign. Two sources requested by the project owner:
the EU registry of crowdfunding platforms, and a directory of tokenised platforms.

Platforms outside the EU and US are in [market-research-world-excl-eu-us-2026-10-30.md](market-research-world-excl-eu-us-2026-10-30.md) (CSV: [market-research-world-excl-eu-us-2026-10-30.csv](market-research-world-excl-eu-us-2026-10-30.csv)).

## 1. EU registry: ESMA register of ECSPR providers

Under the European Crowdfunding Service Providers Regulation (ECSPR, Regulation
(EU) 2020/1503), every authorised crowdfunding platform in the EU appears in the
ESMA register. Verified live on 2026-10-29 at
https://registers.esma.europa.eu/publication/searchRegister?core=esma_registers_upreg
(entity type "European Crowdfunding Service Provider"): **261 entities** listed,
each with entity name, home member state, host states, competent authority,
authorisation date and status.

EUROCROWD publishes a readable mirror with a voluntary transparency benchmark
(**\* established / ** developing / \* emerging), based on the same ESMA data
(accessed 2026-01-16, 246 rows):
https://eurocrowd.org/platforms-under-ecspr/

Registry facts are authorisations by national competent authorities; they are not
quality ratings. Any "Regulated" badge in a product UI must come from this kind of
source, not from platform marketing.

### 1.1 Full register extract (261 entities)

Source: ESMA Registers, register "European Crowdfunding Service Provider"
(https://registers.esma.europa.eu/publication/searchRegister?core=esma_registers_upreg).
Extracted on 2026-10-30; the register's own last-update stamp at that time was
2026-10-30 00:31 UTC, and the most recent entity record update in it was 2026-10-28.
Counts: **261 entities, 239 Active, 22 Inactive**, all head-office records (no branches).
Rows by home member state: France 62, Italy 43, Spain 27, Netherlands 22, Lithuania 17, Belgium 10, Sweden 9, Romania 8, Czechia 7, Ireland 7, Latvia 7, Slovakia 7, Germany 6, Bulgaria 5, Poland 5, Portugal 5, Austria 3, Cyprus 2, Denmark 2, Estonia 2, Greece 2, Malta 2, Finland 1.
Fields are copied as published (names, authority, authorisation date as notified, status);
Status is as published by ESMA (Active / Inactive); the register gives no further reason in these fields.
Commercial name and website are as entered by the national authority and are sometimes blank.
This is a register extract, not a quality rating. Re-pull before relying on it: the register changes.

<!-- prettier-ignore-start -->

| # | Entity name | Commercial name | Home state | Host states | Competent authority | Authorised | Status | Withdrawal / end date | Website |
|---|---|---|---|---|---|---|---|---|---|
| 1 | CONDA Capital GmbH | CONDA Capital GmbH | Austria | Belgium, Germany, Denmark, Spain, Croatia, Hungary, Ireland, Italy, Luxembourg, Malta | Austrian Financial Market Authority (FMA) | 2023-09-22 | Active |  | conda-capital.com |
| 2 | dagobertinvest gmbh | dagobertinvest | Austria | Czechia, Germany, Poland | Austrian Financial Market Authority (FMA) | 2023-09-13 | Active |  | www.dagobertinvest.com |
| 3 | Invesdor GmbH | Invesdor GmbH | Austria | Belgium, Germany, Finland, Netherlands | Austrian Financial Market Authority (FMA) | 2023-01-17 | Inactive | 2024-03-29 | https://www.invesdor.at/#/ |
| 4 | BEEBONDS | BeeBonds | Belgium | Netherlands, Luxembourg | Financial Services and Markets Authority (FSMA) | 2023-06-29 | Active |  | https://www.beebonds.com/ |
| 5 | CAPITAC BV | Capitac | Belgium |  | Financial Services and Markets Authority (FSMA) | 2026-04-22 | Active |  | https://capitac.com |
| 6 | ECCO NOVA | ECCO NOVA | Belgium | Netherlands, France, Luxembourg | Financial Services and Markets Authority (FSMA) | 2023-11-06 | Active |  | https://www.ecconova.com/fr |
| 7 | FinanceLink NV | FLINK | Belgium |  | Financial Services and Markets Authority (FSMA) | 2025-01-21 | Active |  | www.financelink.be |
| 8 | Fraktion BV | Fraktion | Belgium |  | Financial Services and Markets Authority (FSMA) | 2024-05-08 | Active |  | www.fraktionx.com |
| 9 | Horeca Crowdfunding België | Horeca Crowdfunding België | Belgium |  | Financial Services and Markets Authority (FSMA) | 2024-01-16 | Active |  | www.horecacrowdfunding.be |
| 10 | KBC Bank | Bolero Crowdfunding | Belgium |  | Financial Services and Markets Authority (FSMA) | 2023-10-24 | Active |  | https://www.bolero.be/fr |
| 11 | Look and Fin | LOOK&FIN | Belgium | Germany, France, Luxembourg, Netherlands | Financial Services and Markets Authority (FSMA) | 2023-06-06 | Active |  | https://www.lookandfin.com/fr/ |
| 12 | Spreds SA | Spreds | Belgium | France | Financial Services and Markets Authority (FSMA) | 2022-09-26 | Active |  | https://www.spreds.com/fr |
| 13 | WinWinner Crowd | WinWinner | Belgium | Netherlands, France, Spain, Germany, Luxembourg | Financial Services and Markets Authority (FSMA) | 2023-07-04 | Active |  | https://www.winwinner.be/ |
| 14 | AFRANGA EOOD | AFRANGA | Bulgaria | Austria, Belgium, Croatia, Cyprus, Czechia, Denmark, Estonia, Finland, France, Germany, Greece, Hungary, Ireland, Italy, Lithuania, Luxembourg, Malta, Netherlands, Poland, Portugal, Romania, Slovakia, Slovenia, Spain, Sweden | Financial Supervision Commission (FSC) | 2023-09-12 | Active |  | www.afranga.com |
| 15 | COLLECTIVE FINANCING AD | COLLECTIVE FINANCING AD | Bulgaria |  | Financial Supervision Commission (FSC) | 2023-11-03 | Active |  | pending |
| 16 | PATIENT CAPITAL OOD | PATIENT CAPITAL | Bulgaria |  | Financial Supervision Commission (FSC) | 2023-11-09 | Active |  | https://patientcapital.bg/ |
| 17 | PropertyPeers OOD | PropertyPeers | Bulgaria |  | Financial Supervision Commission (FSC) | 2024-06-20 | Active |  | pending |
| 18 | Quart Fund AD | Quart Fund | Bulgaria |  | Financial Supervision Commission (FSC) | 2025-07-23 | Active |  | www.quartfund.com |
| 19 | CROWDBASE LTD | Crowdbase | Cyprus |  | Cyprus Securities and Exchange Commission (CySEC) | 2023-11-20 | Active |  | www.crowdbase.eu |
| 20 | EURIVEX LTD | Eurivex | Cyprus | European Union | Cyprus Securities and Exchange Commission (CySEC) | 2024-01-22 | Active |  | http://trade.eurivex.com |
| 21 | CREDITSHARE s.r.o. | CREDITSHARE | Czechia |  | Czech National Bank (CNB) | 2024-04-11 | Active |  | www.creditshare.cz |
| 22 | Fingood s.r.o. | fingood | Czechia |  | Czech National Bank (CNB) | 2023-11-10 | Active |  | www.fingood.cz |
| 23 | FUNDSTER a.s. | FUNDSTER | Czechia |  | Czech National Bank (CNB) | 2025-01-15 | Active |  | www.dluhopisomat.cz |
| 24 | Investown Technologies s.r.o. | Investown | Czechia | Austria, Slovakia, Germany, Poland | Czech National Bank (CNB) | 2023-10-24 | Active |  | www.investown.cz |
| 25 | okeilo s.r.o. | okeilo | Czechia |  | Czech National Bank (CNB) | 2024-07-16 | Active |  | www.okeilo.cz |
| 26 | ROIER Invest, s.r.o. | ROIER | Czechia | Slovakia, Germany, Slovakia, Germany | Czech National Bank (CNB) | 2023-11-04 | Active |  | www.roier.cz |
| 27 | wefund s.r.o. | wefund | Czechia |  | Czech National Bank (CNB) | 2026-04-01 | Active |  | www.wefund.cz |
| 28 | Flex Funding A/S | Flex Funding | Denmark | Norway | Finanstilsynet | 2024-01-11 | Active |  | www.flexfunding.com |
| 29 | Lendino A/S | Lendino | Denmark |  | Finanstilsynet | 2023-07-28 | Active |  | www.lendino.dk |
| 30 | Crowdestate AS | Crowdestate | Estonia | Austria, Belgium, Bulgaria, Cyprus, Czechia, Germany, Denmark, Spain, Finland, France, Croatia, Hungary, Ireland, Italy, Lithuania, Luxembourg, Latvia, Malta, Netherlands, Poland, Portugal, Romania, Sweden, Slovenia, Slovakia, European Union | Estonian Financial Supervision Authority (EFSA) | 2023-03-06 | Inactive | 2026-04-14 | https://crowdestate.eu/ |
| 31 | Estateguru OÜ | Estateguru | Estonia | Belgium, Bulgaria, Croatia, Cyprus, Czechia, Austria, Denmark, European Union, Finland, France, Germany, Greece, Hungary, Ireland, Italy, Latvia, Lithuania, Luxembourg, Malta, Netherlands, Poland, Portugal, Romania, Slovakia, Slovenia, Spain, Sweden | Estonian Financial Supervision Authority (EFSA) | 2023-05-08 | Active |  | https://estateguru.co |
| 32 | Vauraus Suomi Oyj | Vauraus | Finland |  | Finanssivalvonta (FSA) | 2023-10-24 | Active |  | www.vauraus.fi |
| 33 | 1001PACT | Lita | France | Belgium, Italy | Autorité des Marchés Financiers (AMF) | 2023-11-09 | Active |  | https://fr.lita.co/fr |
| 34 | ALTERFINANCE | FUNDHERO | France |  | Autorité des Marchés Financiers (AMF) | 2023-11-06 | Active |  | https://fundhero.fr/ |
| 35 | AM EQUITY | Upstone, Immocratie | France |  | Autorité des Marchés Financiers (AMF) | 2023-12-07 | Active |  | https://www.upstone.co/ |
| 36 | ANAXAGO | Anaxago | France |  | Autorité des Marchés Financiers (AMF) | 2023-11-08 | Active |  | https://www.anaxago.com/ |
| 37 | BALTIS | BALTIS | France |  | Autorité des Marchés Financiers (AMF) | 2023-11-09 | Active |  | https://www.baltis.com/ |
| 38 | BEEFORDEAL | BEEFORDEAL | France |  | Autorité des Marchés Financiers (AMF) | 2022-12-20 | Active |  | https://www.beefordeal.com/ |
| 39 | BLAST | BLAST | France | Belgium, Luxembourg | Autorité des Marchés Financiers (AMF) | 2023-08-21 | Active |  | https://blast.club/ |
| 40 | BLAST ANGELS EUROPE | Blast Angels Europe | France | Germany, Denmark, Spain, Finland, Ireland, Italy, Netherlands, Poland, Sweden, Austria | Autorité des Marchés Financiers (AMF) | 2024-03-15 | Active |  | https://blastangels.com/ |
| 41 | BLOCKS | Stomea | France |  | Autorité des Marchés Financiers (AMF) | 2023-05-23 | Active |  | https://www.stomea.com/ |
| 42 | BRICKS | BRICKS.CO | France | European Union | Autorité des Marchés Financiers (AMF) | 2023-06-30 | Active |  | https://www.bricks.co/ |
| 43 | Bulb in Town | Tudigo | France |  | Autorité des Marchés Financiers (AMF) | 2023-11-24 | Active |  | https://www.tudigo.co/ |
| 44 | CITESIA | Rendimo | France | Spain | Autorité des Marchés Financiers (AMF) | 2023-11-07 | Active |  | https://citesia.fr/ |
| 45 | CLUBFUNDING | Clubfunding | France | European Union | Autorité des Marchés Financiers (AMF) | 2023-11-24 | Active |  | https://www.clubfunding.fr/ |
| 46 | CREDOFUNDING | Credofunding | France |  | Autorité des Marchés Financiers (AMF) | 2023-11-07 | Active |  | https://www.credofunding.fr/fr |
| 47 | CROWDYBEE | Crowdybee | France |  | Autorité des Marchés Financiers (AMF) | 2023-03-08 | Active |  | https://crowdybee.fr/ |
| 48 | CROWN FUNDING | Crown Funding | France |  | Autorité des Marchés Financiers (AMF) | 2024-01-03 | Active |  | https://www.crownfunding.fr/ |
| 49 | ENERFIP | ENERFIP | France | European Union | Autorité des Marchés Financiers (AMF) | 2022-12-06 | Active |  | https://fr.enerfip.eu/ |
| 50 | EQUISAFE INVEST | Equisafe Invest | France |  | Autorité des Marchés Financiers (AMF) | 2024-01-05 | Active |  | https://www.equisafe-invest.io/ |
| 51 | FINPLE | Finple | France |  | Autorité des Marchés Financiers (AMF) | 2023-11-24 | Active |  | https://finple.com/ |
| 52 | FLOLEND | Flolend | France |  | Autorité des Marchés Financiers (AMF) | 2024-11-20 | Active |  | https://www.flolend.com/ |
| 53 | FUNDIMMO | Fundimmo | France |  | Autorité des Marchés Financiers (AMF) | 2023-10-25 | Active |  | https://www.fundimmo.com/ |
| 54 | GROUPE MiiMOSA | MiiMOSA | France |  | Autorité des Marchés Financiers (AMF) | 2024-01-05 | Active |  | http://miimosa.com/ |
| 55 | GWENNEG | GWENNEG | France |  | Autorité des Marchés Financiers (AMF) | 2023-07-31 | Active |  | https://www.gwenneg.bzh/fr |
| 56 | HAPPY CAPITAL | HAPPY CAPITAL / MY CAPITAL IMMO | France |  | Autorité des Marchés Financiers (AMF) | 2023-11-09 | Active |  | https://www.happy-capital.com/ https://www.mycapital.immo/ |
| 57 | HOMUNITY | Homunity | France | Poland, Netherlands, Spain, Belgium, Luxembourg, Italy, Germany, Portugal | Autorité des Marchés Financiers (AMF) | 2023-11-09 | Active |  | https://www.homunity.com/fr/ |
| 58 | HUMAN FOR IMPACT | Human for Impact | France |  | Autorité des Marchés Financiers (AMF) | 2025-06-03 | Active |  | https://www.humanforimpact.com/ |
| 59 | INGO (XPERTS CROWDFUNDING) | Xperts Crowdfunding | France |  | Autorité des Marchés Financiers (AMF) | 2024-04-15 | Active |  | https://ingo.finance/ |
| 60 | INVEST IN PACIFIC | Invest in Pacific | France |  | Autorité des Marchés Financiers (AMF) | 2024-01-03 | Active |  | https://www.investinpacific.com/ |
| 61 | KIWAÏ | Kiwaï et Kiwaï Normandie | France |  | Autorité des Marchés Financiers (AMF) | 2023-09-26 | Active |  | https://www.KIWAÏ-normandie.fr/ |
| 62 | KOLIBRI | Kolibri Crowdfunding | France |  | Autorité des Marchés Financiers (AMF) | 2025-03-13 | Active |  | https://kolibri-crowdfunding.com/ |
| 63 | KOREGRAF | Koregraf | France |  | Autorité des Marchés Financiers (AMF) | 2023-11-14 | Inactive | 2025-06-20 | https://www.koregraf.com/ |
| 64 | LA PREMIERE BRIQUE | LA PREMIERE BRIQUE | France |  | Autorité des Marchés Financiers (AMF) | 2023-09-28 | Active |  | https://www.lapremierebrique.fr/ |
| 65 | LENDOCOMPANY | Lendosphere / Lendopolis | France | Spain, Portugal, Spain, Portugal | Autorité des Marchés Financiers (AMF) | 2023-11-07 | Active |  | https://www.lendosphere.com/ |
| 66 | LENDOPOLIS | Lendopolis | France |  | Autorité des Marchés Financiers (AMF) | 2023-11-08 | Inactive | 2025-12-16 | https://www.lendopolis.com/ |
| 67 | LES ENTREPRETEURS | Les Entrepreteurs | France | Belgium, Spain, Germany, Poland, Portugal, Luxembourg | Autorité des Marchés Financiers (AMF) | 2023-11-09 | Active |  | https://www.lesentrepreteurs.com/ |
| 68 | LUMO | Lumo | France |  | Autorité des Marchés Financiers (AMF) | 2023-10-25 | Inactive | 2026-04-02 | https://www.lumo-france.com/ |
| 69 | LYMO FINANCE | LYMO FINANCE | France |  | Autorité des Marchés Financiers (AMF) | 2023-11-07 | Inactive | 2026-01-08 | https://lymo.fr/ |
| 70 | M CAPITAL INVEST | BUILDR | France |  | Autorité des Marchés Financiers (AMF) | 2023-12-21 | Active |  | https://www.buildr.fr/ |
| 71 | MAHANA CAPITAL | Mahana Capital | France |  | Autorité des Marchés Financiers (AMF) | 2024-03-28 | Active |  | https://www.mahana-capital.fr/ |
| 72 | MATIS | Matis | France | Luxembourg, Belgium, Italy | Autorité des Marchés Financiers (AMF) | 2023-11-07 | Active |  | https://www.matis.club/fr |
| 73 | MONEGO | Monego | France |  | Autorité des Marchés Financiers (AMF) | 2023-09-14 | Active |  | https://www.monego.fr/ |
| 74 | NRNC (THE CLIQUE) | THE CLIQUE | France |  | Autorité des Marchés Financiers (AMF) | 2023-06-23 | Active |  | https://www.theclique.fr/fr |
| 75 | OCTOBER IFP | October | France | Spain, Italy, Netherlands, Germany | Autorité des Marchés Financiers (AMF) | 2023-10-20 | Active |  | https://october.eu/fr/ |
| 76 | OPTIONS | MyOptions | France |  | Autorité des Marchés Financiers (AMF) | 2024-01-02 | Active |  | https://www.myoptions.co/ |
| 77 | RAIZERS | Raizers | France | Spain, Belgium, Italy, Luxembourg, Netherlands, Portugal | Autorité des Marchés Financiers (AMF) | 2023-06-20 | Active |  | https://raizers.com/ |
| 78 | SEED AND COLLECT | Seed and collect | France |  | Autorité des Marchés Financiers (AMF) | 2023-11-10 | Active |  | https://seedandcollect.com/ |
| 79 | SOUL INVEST | Soul Invest - The Moon Venture | France |  | Autorité des Marchés Financiers (AMF) | 2023-01-23 | Active |  | https://soulinvest.com/ https://www.themoonventure.com/ |
| 80 | SOWEFUND | SOWEFUND | France |  | Autorité des Marchés Financiers (AMF) | 2023-07-11 | Active |  | https://sowefund.com/ |
| 81 | TANTIEM | Tantiem | France |  | Autorité des Marchés Financiers (AMF) | 2025-10-29 | Active |  | https://www.tantiem.com/ |
| 82 | TOKIMO | Tokimo | France |  | Autorité des Marchés Financiers (AMF) | 2023-05-17 | Active |  | https://www.tokimo.eu/ |
| 83 | TYLIA INVEST | Tylia | France |  | Autorité des Marchés Financiers (AMF) | 2024-10-17 | Active |  | https://www.tylia.fr/ |
| 84 | ULENDS | Bienprêter | France |  | Autorité des Marchés Financiers (AMF) | 2023-11-24 | Active |  | https://www.bienpreter.com/ |
| 85 | UNITUP | Pretup et Unilend | France |  | Autorité des Marchés Financiers (AMF) | 2024-02-12 | Active |  | https://www.pretup.fr/ |
| 86 | URBANIS FINANCE | Collecticity | France |  | Autorité des Marchés Financiers (AMF) | 2023-11-21 | Active |  | https://collecticity.fr/ |
| 87 | VATEL DIRECT SAS | Vatel Direct | France |  | Autorité des Marchés Financiers (AMF) | 2023-11-24 | Active |  | https://www.vateldirect.com/fr |
| 88 | VILLYZ | VILLYZ | France |  | Autorité des Marchés Financiers (AMF) | 2022-09-06 | Active |  | https://villyz.fr/ |
| 89 | WE ARE OLIVIA | We Are Olivia | France | Romania | Autorité des Marchés Financiers (AMF) | 2024-07-19 | Active |  | https://www.weareolivia.com/ |
| 90 | WE TAKE PART | WE TAKE PART | France | European Union | Autorité des Marchés Financiers (AMF) | 2024-06-10 | Active |  | https://www.wetakepart.com/ |
| 91 | WEVEST | WEVEST | France |  | Autorité des Marchés Financiers (AMF) | 2023-07-28 | Active |  | https://www.wevest.fr/ |
| 92 | WISEED | Wiseed | France | Belgium, Spain, Italy, Luxembourg, Netherlands, Germany | Autorité des Marchés Financiers (AMF) | 2023-11-15 | Active |  | https://www.wiseed.com/ |
| 93 | WISEPROFITS | WeShareBonds | France |  | Autorité des Marchés Financiers (AMF) | 2023-07-04 | Active |  | https://www.wesharebonds.com/ |
| 94 | ZALEO | Zaleo | France |  | Autorité des Marchés Financiers (AMF) | 2024-02-12 | Inactive | 2026-04-01 | https://www.zaleo.fr/ |
| 95 | Bergfürst AG | Bergfürst | Germany |  | Federal Financial Supervisory Authority (BaFin) | 2024-03-28 | Active |  | https://de.bergfuerst.com/ |
| 96 | BERGFÜRST AG | BERGFÜRST | Germany | Spain | Federal Financial Supervisory Authority (BaFin) | 2024-03-28 | Active |  | www.bergfuerst.com |
| 97 | EPH Investment GmbH | Exporo | Germany |  | Federal Financial Supervisory Authority (BaFin) | 2023-12-05 | Active |  | www.exporo.com |
| 98 | EV Digital Invest AG | Engel & Völkers Digital Invest | Germany |  | Federal Financial Supervisory Authority (BaFin) | 2024-01-26 | Inactive | 2026-01-20 | www.ev-digitalinvest.de |
| 99 | wiwin Crowd-Investing GmbH | WIWIN | Germany | Belgium, Austria, Luxembourg | Federal Financial Supervisory Authority (BaFin) | 2024-09-30 | Inactive | 2026-01-26 | https://wiwin.de/ |
| 100 | Zinsbaustein GmbH | Zinsbaustein | Germany | Belgium, Austria, Luxembourg | Federal Financial Supervisory Authority (BaFin) | 2023-06-21 | Inactive | 2026-01-26 | www.zinsbaustein.de |
| 101 | BRIKBEE SINGLE MEMBER S.A. | BRIKBEE | Greece |  | Hellenic Capital Market Commission (HCMC) | 2024-09-16 | Active |  | https://brikbee.com |
| 102 | ONE THREE CAPITAL S.A. | ONETHREECAPITAL | Greece |  | Hellenic Capital Market Commission (HCMC) | 2024-12-27 | Active |  | www.ovolus.com |
| 103 | Bridge Peer Financial Limited | Property Bridges | Ireland | Belgium, Bulgaria, Czechia, Germany, France, Greece, Spain, Lithuania, Luxembourg, Malta, Netherlands, Romania, Portugal | Central Bank of Ireland (CBI) | 2023-11-10 | Active |  | https://www.propertybridges.com/ |
| 104 | Green Crowd Limited | Green Crowd | Ireland | Spain, Bulgaria, Belgium, Austria, Croatia, Cyprus, Czechia, Denmark, Estonia, Finland, France, Germany, Greece, Hungary, Italy, Latvia, Lithuania, Luxembourg, Malta, Netherlands, Poland, Portugal, Romania, Slovakia, Slovenia, Sweden | Central Bank of Ireland (CBI) | 2023-12-15 | Active |  | www.greencrowd.ie |
| 105 | Join Shuttle Limited | Join Shuttle | Ireland | Austria, Belgium, Bulgaria, Croatia, Cyprus, Czechia, Denmark, Estonia, Finland, France, Germany, Greece, Hungary, Italy, Latvia, Lithuania, Luxembourg, Malta, Netherlands, Poland, Portugal, Romania, Slovakia, Slovenia, Spain, Sweden | Central Bank of Ireland (CBI) | 2024-08-28 | Active |  | www.joinshuttle.com |
| 106 | Lendermarket Limited | Lendermarket Limited | Ireland |  | Central Bank of Ireland (CBI) | 2024-12-17 | Active |  | www.lendermarket.com |
| 107 | Linked P2P Limited | Linked Finance | Ireland | Belgium, Bulgaria, Cyprus, Czechia, Germany, Denmark, Estonia, Spain, Finland, France, Croatia, Hungary, Italy, Lithuania, Luxembourg, Latvia, Malta, Netherlands, Poland, Portugal, Romania, Sweden, Slovenia, Slovakia, Greece | Central Bank of Ireland (CBI) | 2023-12-18 | Active |  | https://www.linkedfinance.com/ |
| 108 | Seedrs Europe Limited | Seedrs | Ireland | Bulgaria, Cyprus, Denmark, Germany, Estonia, Greece, Spain, Finland, Austria, France, Croatia, Hungary, Italy, Lithuania, Luxembourg, Latvia, Malta, Netherlands, Poland, Portugal, Romania, Sweden, Slovenia, Slovakia, Belgium | Central Bank of Ireland (CBI) | 2023-10-06 | Active |  | https://www.seedrs.com/ |
| 109 | Slua Ventures Ltd (Trading as Spark Venture Funding ) | Spark Crowdfunding | Ireland |  | Central Bank of Ireland (CBI) | 2023-11-10 | Active |  | https://www.sparkcrowdfunding.com/ |
| 110 | Backtowork24 S.r.l. | BACKTOWORK24 | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2023-11-10 | Inactive | 2025-06-10 | www.backtowork24.com |
| 111 | BILDAP S.R.L. | Bildap | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2024-01-31 | Active |  | www.bildap.it |
| 112 | Brickup S.R.L. | Brickup | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2024-07-10 | Active |  | www.brickup.it |
| 113 | Bridge Real Estate S.r.l. | Bridge Asset | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2024-01-31 | Active |  | www.bridgeasset.it |
| 114 | BUILD LENDERS SRL | Build Lenders | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2024-07-10 | Active |  | www.buildlenders.it |
| 115 | Buildbull s.r.l. | Buildbull | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2023-10-25 | Inactive | 2026-04-21 | www.buildbull.com |
| 116 | Concrete S.r.l. | Concrete Investing | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2023-10-25 | Active |  | www.concreteinvesting.com |
| 117 | Demetra Lending S.r.l. Società Benefit | DEMETRA LENDING | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2023-12-12 | Active |  | https://www.demetralending.com/ |
| 118 | DOORWAY S.p.A. SB | DOORWAY | Italy | Austria, Belgium | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2023-11-08 | Active |  | www.doorwayplatform.com/it |
| 119 | EASYCROWD S.r.l. | ISICROWD | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2024-05-22 | Active |  | https://isicrowd.it/ |
| 120 | ECOMILL S.R.L. | ECOMILL | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2024-04-18 | Inactive | 2025-12-19 | www.ecomill.it |
| 121 | ENER2CROWD S.r.l. SB | ENER2CROWD | Italy | Spain, Austria, Portugal, Netherlands | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2023-11-08 | Active |  | https://www.ener2crowd.com/it/home |
| 122 | ENTERA S.P.A. | CROWDFUNDME, ENTERA | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2023-11-10 | Active |  | www.crowdfundme.it |
| 123 | EQUITY & CROWDFUNDING S.r.l. | EQUICROWD | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2024-02-14 | Active |  | www.equicrowd.it |
| 124 | Escaluscapital S.r.l. SB | Wisemoon | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2024-09-18 | Active |  | www.wisemoon.eu |
| 125 | FORCROWD S.R.L. | Forcrowd | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2024-06-19 | Active |  | www.forcrowd.com |
| 126 | FUNDERA S.r.l. | FUNDERA | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2023-10-25 | Active |  | www.fundera.it |
| 127 | INNEXTA S.c.r.l. | Finnexta | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2024-02-20 | Inactive | 2026-04-10 | www.innexta.it |
| 128 | ITALFUND S.R.L. | ITALFUND S.R.L. | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2025-07-30 | Active |  | https://italsoft.it |
| 129 | Italia Capitalis S.R.L. | Italia Bond | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2025-03-12 | Active |  | www.italiabond.it |
| 130 | LEONE INVESTMENT S.R.L. | Leone Investments | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2023-12-06 | Active |  | www.leoneinvestments.it |
| 131 | MAMACROWD S.r.l. | Mamacrowd | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2023-11-08 | Active |  | www.mamacrowd.com |
| 132 | MF NEXT EQUITY CROWDFUNDING S.R.L. | MF NEXT EQUITY | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2024-06-12 | Active |  | www.mfnextequity.it |
| 133 | MIGLIORA S.R.L. | 2meet2biz | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2023-12-20 | Active |  | www.2meet2biz.com |
| 134 | Opstart S.R.L. | OPSTART | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2023-12-12 | Active |  | www.opstart.it |
| 135 | OPTIMART S.r.l. | Optimart | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2024-06-12 | Active |  | www.optimart.it |
| 136 | PARITER EQUITY S.r.l. | Pariter Equity | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2024-06-05 | Active |  | www.pariterequity.com |
| 137 | PREPAY S.R.L. | Prepay Investimenti | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2024-01-31 | Active |  | www.prepayinvestimenti.it |
| 138 | Profit Farm S.R.L. | Profit Farm | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2024-12-05 | Active |  | www.profitfarm.it |
| 139 | RE-LENDER S.p.A. | Re-Lender | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2024-07-10 | Active |  | www.relender.eu |
| 140 | RECROWD S.R.L. | RECROWD | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2023-11-29 | Active |  | www.recrowd.com |
| 141 | RENDIMENTO ETICO S.R.L. | RENDIMENTO ETICO | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2023-11-10 | Inactive | 2026-03-04 | www.rendimentoetico.it |
| 142 | RESTARTUP S.R.L. S.B. | MyRestartUp/ReStartUp | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2024-04-18 | Active |  | www.myrestartup.it |
| 143 | STARS UP S.R.L. | STARSUP | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2024-05-22 | Active |  | https://starsup.it |
| 144 | TIFOSY ITALIA SIM S.P.A. | https://www.tifosy.com/it | Italy | Belgium, Slovenia, Germany, Malta, Ireland, Luxembourg, Denmark, Estonia, France, Spain, Greece, Sweden, Poland, Austria, Croatia, Netherlands, Romania, Cyprus, Hungary, Portugal, Finland, Czechia, Slovakia, Lithuania, Bulgaria, Latvia | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2024-10-23 | Inactive | 2025-12-19 | www.tifosy.com/it/tifosy-italia/investing |
| 145 | Trusters S.r.l. | TRUSTERS | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2023-12-06 | Active |  | www.trusters.it |
| 146 | UpsideTown s.r.l. | UpsideTown | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2024-01-17 | Active |  | www.upsidetown.it |
| 147 | Urban Deal S.R.L. | Urban Deal | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2024-09-18 | Active |  | www.urbandeal.it |
| 148 | WALLIANCE GROUP S.P.A. | WALLIANCE | Italy | Spain, France | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2023-11-08 | Active |  | www.walliance.it |
| 149 | WE BRIDGE COMMUNITY S.r.l. | WE CROWD COMMUNITY | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2024-09-04 | Active |  | www.wecrowdcommunity.com |
| 150 | WEARESTARTING S.r.l. | WeAreStarting | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2024-02-20 | Active |  | www.wearestarting.it |
| 151 | Weltix S.p.A. | Weltix | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2024-01-17 | Active |  | www.weltix.tech |
| 152 | Y-CROWD S.R.L. | Y-CROWD | Italy |  | Commissione Nazionale per le Societa e la Borsa (CONSOB) | 2023-11-08 | Active |  | www.yeldocrowd.com |
| 153 | Capitalia SE | Capitalia | Latvia | European Union | Latvijas Banka | 2023-11-01 | Active |  | https://www.capitalia.com/lv |
| 154 | CSP Growth Solutions | Digilo | Latvia | European Union | Latvijas Banka | 2025-09-16 | Active |  | www.digilo.com |
| 155 | FLOW | FLOW Finance | Latvia |  | Latvijas Banka | 2025-08-27 | Active |  | www.flowfinance.lv; www.flowfinance.eu |
| 156 | FUNDAUS SIA | FUNDAUS | Latvia | European Union | Latvijas Banka | 2026-03-03 | Active |  | www.fundaus.com; www.fundaus.eu |
| 157 | SIA Ascend Finance | Ascend Finance | Latvia | Belgium, Bulgaria, Croatia, Cyprus, Czechia, Denmark, Estonia, European Union, Finland, France, Germany, Greece, Hungary, Iceland, Ireland, Italy, Liechtenstein, Lithuania, Luxembourg, Malta, Netherlands, Norway, Poland, Portugal, Romania, Austria, Slovakia, Slovenia, Spain, Sweden | Latvijas Banka | 2025-07-09 | Active |  | https://ascend-finance.capital/ |
| 158 | SIA CrowdedHero Latvia | CrowdedHero | Latvia | European Union | Latvijas Banka | 2022-08-16 | Active |  | www.crowdedhero.com |
| 159 | SIA LANDE PLATFORM | LANDE.finance | Latvia | European Union | Latvijas Banka | 2024-02-07 | Active |  | https://lande.finance |
| 160 | 8 stars, UAB | 8 stars | Lithuania | Latvia, Estonia, Spain, Portugal, Romania, Luxembourg, Greece, Germany, Poland, Norway | Bank of Lithuania (LSC) | 2023-07-25 | Active |  | https://letsinvest.eu |
| 161 | UAB "Bendras finansavimas" | SAVY | Lithuania |  | Bank of Lithuania (LSC) | 2023-08-01 | Active |  | https://gosavy.com/lt |
| 162 | UAB "Finance EU" | "Finance EU“ | Lithuania | Poland | Bank of Lithuania (LSC) | 2026-07-31 | Active |  | https://florrid.com/ |
| 163 | UAB "FinoMark" | FinoMark | Lithuania |  | Bank of Lithuania (LSC) | 2023-11-10 | Active |  | www.finomark.lt |
| 164 | UAB "Perfect Sunday" | Perfect Sunday | Lithuania | Estonia | Bank of Lithuania (LSC) | 2024-04-16 | Active |  | www.bemybond.com |
| 165 | UAB "Profitus Crowdfunding" | Profitus | Lithuania | Estonia, Spain, Germany, Latvia | Bank of Lithuania (LSC) | 2023-11-10 | Active |  | www.profitus.lt |
| 166 | UAB "Trečia diena" | Trečia diena | Lithuania |  | Bank of Lithuania (LSC) | 2023-09-12 | Active |  | www.rontgen.lt |
| 167 | UAB Bondea | Bondea | Lithuania |  | Bank of Lithuania (LSC) | 2025-07-22 | Active |  | https://www.bondea.lt |
| 168 | UAB Crowdpear | Crowdpear | Lithuania | Romania, Portugal | Bank of Lithuania (LSC) | 2023-07-25 | Active |  | https://crowdpear.com |
| 169 | UAB Go investing | Go investing | Lithuania |  | Bank of Lithuania (LSC) | 2023-07-14 | Active |  | http://www.CapitalGoInvest.lt |
| 170 | UAB Greenit Crowd | Greenit Crowd | Lithuania |  | Bank of Lithuania (LSC) | 2021-05-03 | Active |  | https://greenit.lt |
| 171 | UAB HEAVY FINANCE | HeavyFinance | Lithuania | Poland, Latvia, Portugal, Bulgaria | Bank of Lithuania (LSC) | 2023-07-14 | Active |  | www.heavyfinance.com |
| 172 | UAB Inrento | Inrento | Lithuania | Italy, Poland, Latvia, Ireland, Spain, Finland, Romania | Bank of Lithuania (LSC) | 2023-11-10 | Active |  | www.inrento.lt |
| 173 | UAB Nordstreet | Nordstreet | Lithuania | Estonia, Poland, Latvia, Spain | Bank of Lithuania (LSC) | 2023-11-10 | Active |  | www.nordstreet.com |
| 174 | UAB ROIX | ROIX | Lithuania |  | Bank of Lithuania (LSC) | 2024-12-10 | Active |  | https://roix.lt/ |
| 175 | UAB sutelktinio finansavimo platformos "Revestus" | Revestus | Lithuania |  | Bank of Lithuania (LSC) | 2024-10-22 | Active |  | N/A |
| 176 | UAB „Finansų bitė verslui“ | Finbee | Lithuania |  | Bank of Lithuania (LSC) | 2023-11-10 | Active |  | WWW.FINBEEVERSLUI.LT |
| 177 | Ektico Ltd. | Ektico Ltd. | Malta | European Union | Malta Financial Services Authority (MFSA) | 2025-09-15 | Active |  | ektico.com |
| 178 | TokePortal.com Ltd | TokePortal.com Ltd | Malta |  | Malta Financial Services Authority (MFSA) | 2024-06-06 | Active |  | https://tokeportal.com/ |
| 179 | Aespire B.V. | Aespire B.V. | Netherlands | Belgium | Netherlands Authority for the Financial Markets (AFM) | 2025-08-25 | Active |  | www.aespire.eu |
| 180 | Briqwise B.V. | Briqwise | Netherlands |  | Netherlands Authority for the Financial Markets (AFM) | 2024-05-01 | Active |  | www.briqwise.com |
| 181 | Broccoli B.V. | Broccoli B.V. | Netherlands | Belgium, Ireland, Italy, Germany | Netherlands Authority for the Financial Markets (AFM) | 2023-06-06 | Active |  | www.broccoli.eu |
| 182 | Collin Crowdfund N.V. | Collin Crowdfund N.V., Vastgoed Crowdfinance, Vastgoed Crowdfunding, Corporate Crowdfinance, Corporate Crowdfunding, Collin Corporate Finance | Netherlands | Germany | Netherlands Authority for the Financial Markets (AFM) | 2023-11-10 | Active |  | www.collincrowdfund.nl |
| 183 | Confince B.V. | Confince B.V., Geldvoorelkaar.nl, AndersFinancieren | Netherlands |  | Netherlands Authority for the Financial Markets (AFM) | 2023-03-30 | Active |  | www.geldvoorelkaar.nl |
| 184 | Crowd Real Estate B.V. | Crowdrealestate | Netherlands | Belgium, Germany | Netherlands Authority for the Financial Markets (AFM) | 2024-04-26 | Active |  | www.crowdrealestate.nl/ |
| 185 | CrowdAboutNow B.V. | CrowdAboutNow B.V. | Netherlands |  | Netherlands Authority for the Financial Markets (AFM) | 2023-04-03 | Active |  | www.crowdaboutnow.nl |
| 186 | Crowdinvesting B.V. | DuurzaamInvesteren, DuurzaamInvesteren.nl, VastgoedInvesteren, VastgoedInvesteren.nl, fundgreen | Netherlands |  | Netherlands Authority for the Financial Markets (AFM) | 2023-11-06 | Inactive | 2026-05-07 | www.duurzaaminvesteren.nl, www.vastgoedinvesteren.nl |
| 187 | Eyevestor B.V. | Eyevestor B.V. | Netherlands | Austria | Netherlands Authority for the Financial Markets (AFM) | 2023-11-22 | Active |  | www.eyevestor.com |
| 188 | FundCo B.V. | FundCo B.V. | Netherlands |  | Netherlands Authority for the Financial Markets (AFM) | 2025-09-16 | Active |  | https://fundco.nl/ |
| 189 | Hands-on B.V. | Lendahand | Netherlands | Belgium, Spain, France, Sweden, Denmark, Germany, Finland | Netherlands Authority for the Financial Markets (AFM) | 2022-08-11 | Active |  | www.lendahand.com |
| 190 | Horeca Crowdfunding Nederland B.V. | Horeca Crowdfunding Nederland | Netherlands |  | Netherlands Authority for the Financial Markets (AFM) | 2022-12-19 | Active |  | www.horecacrowdfunding.nl |
| 191 | KOM Group B.V. | KOM Group B.V., Kapitaal op Maat, Capital Circle | Netherlands | Germany, Spain, France, Luxembourg, Austria, Bulgaria, Croatia, Cyprus, Czechia, Denmark, Estonia, Finland, Greece, Hungary, Ireland, Italy, Latvia, Lithuania, Malta, Poland, Portugal, Romania, Slovenia, Slovakia, Belgium | Netherlands Authority for the Financial Markets (AFM) | 2022-11-30 | Active |  | www.kapitaalopmaat.nl |
| 192 | Mogelijk B.V. | Mogelijk Vastgoedfinancieringen | Netherlands | Belgium, Germany | Netherlands Authority for the Financial Markets (AFM) | 2023-11-09 | Active |  | www.mogelijk.nl |
| 193 | NLInvesteert B.V. | NLInvesteert B.V. | Netherlands |  | Netherlands Authority for the Financial Markets (AFM) | 2022-11-07 | Active |  | www.nlinvesteert.nl/ |
| 194 | NPEX B.V. | Nederlandsche Participatie Exchange, NPEX | Netherlands |  | Netherlands Authority for the Financial Markets (AFM) | 2023-06-16 | Active |  | www.npex.nl |
| 195 | Oneplanetcrowd International B.V. | Invesdor, Oneplanetcrowd | Netherlands | Austria, Belgium, Germany, Denmark, Spain, Finland, Croatia, Hungary, Ireland, Italy, Luxembourg, Malta, Sweden | Netherlands Authority for the Financial Markets (AFM) | 2022-09-15 | Active |  | www.invesdor.com |
| 196 | Samen in Geld B.V. | Samen in Geld B.V., Sameningeld | Netherlands | Austria, Belgium, Greece, Spain, Ireland, Portugal | Netherlands Authority for the Financial Markets (AFM) | 2023-11-06 | Active |  | www.sameningeld.nl |
| 197 | Waardevoorjegeld B.V. | Waardevoorjegeld.nl | Netherlands | Belgium, France, Luxembourg | Netherlands Authority for the Financial Markets (AFM) | 2023-11-02 | Active |  | www.waardevoorjegeld.nl |
| 198 | Wefunder EU B.V. | Wefunder | Netherlands |  | Netherlands Authority for the Financial Markets (AFM) | 2022-12-27 | Inactive | 2024-11-28 | www.wefunder.com |
| 199 | ZIB Beleggingsonderneming B.V. | ZIB Beleggingsonderneming B.V., ZIB BO | Netherlands | Belgium, Germany, France | Netherlands Authority for the Financial Markets (AFM) | 2022-12-07 | Active |  | www.zibinvestments.nl |
| 200 | Zonnepanelendelen B.V. | Zonnepanelendelen B.V., Zonhub | Netherlands | Germany, Greece, Spain, Belgium, France, Italy, Luxembourg, Portugal, Lithuania, Poland, Romania | Netherlands Authority for the Financial Markets (AFM) | 2024-01-31 | Active |  | www.zonnepanelendelen.nl |
| 201 | Crowd Real Estate SPÓŁKA AKCYJNA | Crowd Real Estate | Poland |  | Polish Financial Supervisory Authority (KNF) | 2024-05-23 | Active |  | crowdrealestate.pl |
| 202 | Emiteo sp. z o.o. | Emiteo sp. z o.o. | Poland |  | Polish Financial Supervisory Authority (KNF) | 2023-10-27 | Active |  | www.emiteo.pl |
| 203 | Europpa  sp. z o.o. | Europpa | Poland |  | Polish Financial Supervisory Authority (KNF) | 2024-08-23 | Active |  | www.europpa.com |
| 204 | Finansowo.pl S.A. | Finansowo.pl | Poland |  | Polish Financial Supervisory Authority (KNF) | 2023-10-24 | Active |  | www.biznes.finansowo.pl |
| 205 | GPW Private Market S.A. | GPW Private Market S.A. | Poland |  | Polish Financial Supervisory Authority (KNF) | 2023-10-27 | Inactive | 2024-12-20 | www.gpwpm.pl |
| 206 | ACREDIUS PORTUGAL, S.A. | ACREDIUS PORTUGAL, S.A. | Portugal | Germany, France, Austria, Spain, Romania | Comissão do Mercado de Valores Mobiliários (CMVM) | 2024-02-29 | Active |  | https://acredius.ch |
| 207 | DASKAPITAL - CROWDFUNDING, S.A. | DASKAPITAL - CROWDFUNDING, S.A. | Portugal |  | Comissão do Mercado de Valores Mobiliários (CMVM) | 2024-10-17 | Active |  | www.daskapital.eu |
| 208 | Power Parity S.A. | Power Parity S.A. | Portugal | Bulgaria, Belgium, Denmark, Germany, Estonia, Ireland, Greece, Spain, France, Croatia, Italy, Cyprus, Latvia, Lithuania, Luxembourg, Hungary, Malta, Netherlands, Austria, Poland, Romania, Slovenia, Slovakia, Finland, Sweden | Comissão do Mercado de Valores Mobiliários (CMVM) | 2024-01-25 | Active |  | www.goparity.com |
| 209 | Querido Investi S.A. | Querido Investi S.A. | Portugal |  | Comissão do Mercado de Valores Mobiliários (CMVM) | 2024-02-15 | Active |  | www.queridoinvesti.pt |
| 210 | RAIZECROWD - SERVIÇOS DE INFORMAÇÃO E TECNOLOGIA, SOCIEDADE UNIPESSOAL LDA | RAIZECROWD - SERVIÇOS DE INFORMAÇÃO E TECNOLOGIA, SOCIEDADE UNIPESSOAL LDA | Portugal |  | Comissão do Mercado de Valores Mobiliários (CMVM) | 2024-02-08 | Active |  | www.raize.pt |
| 211 | European Digital Exchange S.A. | Ronin | Romania |  | Romanian Financial Supervisory Authority | 2024-09-05 | Active |  | www.weronin.com |
| 212 | Fagura Finance S.R.L. | Fagura | Romania | Austria, Belgium, Bulgaria, Czechia, Cyprus, Croatia, Denmark, Estonia, Finland, France, Germany, Greece, Ireland, Italy, Latvia, Lithuania, Luxembourg, Malta, Netherlands, Poland, Portugal, Slovakia, Slovenia, Spain, Sweden, Hungary | Romanian Financial Supervisory Authority | 2023-09-04 | Active |  | www.fagura.ro |
| 213 | GROWCEANU ANGEL INVESTMENT SRL | GROWCEANU | Romania |  | Romanian Financial Supervisory Authority | 2026-03-25 | Active |  | www.app.growceanu.com |
| 214 | HIGHCROWD ESTATE TECHNOLOGIES S.A. | HIGHCROWD | Romania |  | Romanian Financial Supervisory Authority | 2024-03-25 | Active |  | www.highcrowd.com |
| 215 | SEEDBLINK  S.A. | SeedBlink | Romania | Belgium, Bulgaria, Croatia, Greece, Ireland, Luxembourg, Malta, Netherlands, Spain, Hungary, Austria, Czechia, Cyprus, Denmark, Estonia, Finland, France, Germany, Italy, Lithuania, Latvia, Poland, Portugal, Sweden, Slovakia, Slovenia | Romanian Financial Supervisory Authority | 2022-11-03 | Active |  | www.seedblink.com |
| 216 | STOCKESTATE CROWDFUNDING S.R.L | STOCK.ESTATE | Romania | Italy, Austria, Belgium, Bulgaria, Czechia, Cyprus, Croatia, Denmark, Estonia, Finland, France, Germany, Greece, Ireland, Latvia, Lithuania, Luxembourg, Malta, Netherlands, Poland, Portugal, Slovakia, Slovenia, Spain, Sweden, Hungary | Romanian Financial Supervisory Authority | 2023-08-29 | Active |  | https://www.stock.estate/ |
| 217 | SYNDIFI CROWD PLATFORM SRL | SYNDIFI | Romania |  | Romanian Financial Supervisory Authority | 2026-06-02 | Active |  | https://app.syndi.fi |
| 218 | VENEVO CSP S.R.L. | Venevo | Romania |  | Romanian Financial Supervisory Authority | 2026-08-21 | Active |  | www.venevo.ro |
| 219 | Across Wealth Creators s. r. o. | Across Wealth Creators | Slovakia | Czechia | National Bank of Slovakia (NBS) | 2023-05-11 | Active |  | www.acrosscrowd.sk |
| 220 | Ci investment, s. r. o. | Ci investment, s. r. o. | Slovakia | Czechia | National Bank of Slovakia (NBS) | 2024-02-15 | Active |  | www.investinslovakia.eu |
| 221 | Crowdberry Investment Platform j. s. a. | Crowdberry Investment Platform j. s. a. | Slovakia | Czechia | National Bank of Slovakia (NBS) | 2023-06-29 | Active |  | www.crowdberry.eu |
| 222 | Crowdmeup s. r. o. | Crowdmeup s. r. o. | Slovakia | European Union | National Bank of Slovakia (NBS) | 2023-12-13 | Active |  | crowdmeup.com |
| 223 | FINVESTOR | FINVESTOR | Slovakia | Czechia | National Bank of Slovakia (NBS) | 2024-12-31 | Active |  | www.finvestor.sk |
| 224 | Sunvest digital a. s. | Sunvest digital | Slovakia |  | National Bank of Slovakia (NBS) | 2023-11-24 | Active |  | www.sunvestdigital.com |
| 225 | Tremint, s. r. o. | Tremint, s. r. o. | Slovakia |  | National Bank of Slovakia (NBS) | 2024-04-09 | Active |  | www.tremint.eu |
| 226 | ADVENTUREES CAPITAL PFP, SOCIEDAD LIMITADA | ALIUS CAPITAL | Spain | Italy, Portugal, Luxembourg, Germany, France | Comisión Nacional del Mercado de Valores (CNMV) | 2023-11-03 | Active |  | www.aliuscap.com |
| 227 | BOLSA SOCIAL, S.L. | BOLSA SOCIAL | Spain | Portugal | Comisión Nacional del Mercado de Valores (CNMV) | 2023-03-24 | Active |  | www.bolsasocial.com |
| 228 | BUECOR & PARTNERS, SOCIEDAD LIMITADA | BUËCOR | Spain | Portugal | Comisión Nacional del Mercado de Valores (CNMV) | 2023-12-01 | Active |  | http://www.buecor.com/ |
| 229 | BUSINESS DREAM FACTORY PSFP, SOCIEDAD LIMITADA | BDKAPITAL | Spain |  | Comisión Nacional del Mercado de Valores (CNMV) | 2024-04-26 | Active |  | www.bdkapital.es |
| 230 | CITYPRIVE PSFP, S.L. | CITYPRIVE PSFP, S.L. | Spain | France, Portugal, Italy | Comisión Nacional del Mercado de Valores (CNMV) | 2023-10-20 | Active |  | WWW.WECITY.COM |
| 231 | CIVISLEND PSFP, S.A. | CIVISLEND PSFP, S.A. | Spain | Portugal | Comisión Nacional del Mercado de Valores (CNMV) | 2023-10-20 | Active |  | www.civislend.com |
| 232 | CIVITAE CROWDFUNDING, S.L. | CIVITAE | Spain |  | Comisión Nacional del Mercado de Valores (CNMV) | 2025-07-04 | Active |  | www.civitae.com |
| 233 | CROWDCUBE EUROPE, SOCIEDAD LIMITADA | CROWDCUBE | Spain | European Union | Comisión Nacional del Mercado de Valores (CNMV) | 2022-04-11 | Active |  | www.crowdcube.es |
| 234 | CROWDFUNDING BIZKAIA, P.S.F.P., S.L. | CROWDFUNDING BIZKAIA | Spain |  | Comisión Nacional del Mercado de Valores (CNMV) | 2023-11-17 | Active |  | https://crowdfundingbizkaia.com/ |
| 235 | CROWPIRE, S.L. | CROWPIRE | Spain | Austria, Belgium, Germany, Denmark, France, Italy, Netherlands, Portugal, Sweden | Comisión Nacional del Mercado de Valores (CNMV) | 2023-11-10 | Active |  | www.crowpire.com |
| 236 | DOZEN INVESTMENTS PSFP, S.L. | DOZEN INVESTMENTS | Spain |  | Comisión Nacional del Mercado de Valores (CNMV) | 2023-12-15 | Active |  | https://dozeninvestments.com/ |
| 237 | ECROWD INVEST PLATAFORMA DE FINANCIACION PARTICIPATIVA, S.L. | ECROWD! | Spain |  | Comisión Nacional del Mercado de Valores (CNMV) | 2023-12-07 | Active |  | WWW.ECROWDINVEST.COM |
| 238 | EVENFI FINTECH, S.A. | EVENFI | Spain | Portugal, Austria, Italy, Germany, Belgium, Bulgaria, Cyprus, Croatia, Denmark, Slovakia, Estonia, Slovenia, Finland, France, Greece, Hungary, Ireland, Latvia, Lithuania, Luxembourg, Malta, Netherlands, Poland, Czechia, Romania, Sweden | Comisión Nacional del Mercado de Valores (CNMV) | 2023-02-17 | Active |  | www.evenfi.com |
| 239 | FELLOW FUNDERS PSFP, S.A. | FELLOW FUNDERS CROWD INVESTMENT | Spain |  | Comisión Nacional del Mercado de Valores (CNMV) | 2022-11-07 | Active |  | www.fellowfunders.es |
| 240 | FLOBERS CROWDFUNDING SPAIN PFP, SOCIEDAD LIMITADA | FLOBERS | Spain | European Union | Comisión Nacional del Mercado de Valores (CNMV) | 2024-04-19 | Active |  | www.flobers.com |
| 241 | FUNDEEN PLATFORM, SOCIEDAD LIMITADA | FUNDEEN PLATFORM | Spain | European Union | Comisión Nacional del Mercado de Valores (CNMV) | 2022-12-02 | Active |  | https://www.fundeen.com |
| 242 | GOCROWD, SOCIEDAD LIMITADA | GOCROWD | Spain |  | Comisión Nacional del Mercado de Valores (CNMV) | 2024-10-04 | Active |  | www.gocrowd.es |
| 243 | MYTRIPLEA FINANCIACIÓN, PFP, SL | MYTRIPLEA PRÉSTAMOS | Spain | European Union | Comisión Nacional del Mercado de Valores (CNMV) | 2023-10-27 | Active |  | https://www.mytripleaprestamos.com/ |
| 244 | PFP CAPITAL CELL, S.L. | CAPITAL CELL | Spain | European Union | Comisión Nacional del Mercado de Valores (CNMV) | 2023-11-10 | Active |  | https://capitalcell.es |
| 245 | SMART CREDIT PSFP, SOCIEDAD LIMITADA | SMART CREDIT | Spain |  | Comisión Nacional del Mercado de Valores (CNMV) | 2024-04-26 | Active |  | http://www.smartcredit.es |
| 246 | SOCIEDAD ECONOMICA PARA EL DESARROLLO DE LA FINANCIACION ALTERNATIVA COLECTUAL, PSFP, S.L. | COLECTUAL | Spain |  | Comisión Nacional del Mercado de Valores (CNMV) | 2023-12-22 | Active |  | www.colectual.com |
| 247 | SOCIOSINVERSORES 2010 S.L. | SOCIOSINVERSORES | Spain |  | Comisión Nacional del Mercado de Valores (CNMV) | 2023-04-14 | Active |  | https://venture.segofinance.com/ |
| 248 | SODACROWD, S.L. | SODACROWD | Spain |  | Comisión Nacional del Mercado de Valores (CNMV) | 2023-12-01 | Active |  | www.sodacrowd.com |
| 249 | STARTUPXPLORE, PSFP, S.L. | STARTUPXPLORE, PSFP, S.L. | Spain | European Union | Comisión Nacional del Mercado de Valores (CNMV) | 2023-12-15 | Active |  | https://startupxplore.com/ |
| 250 | STOCKCROWD PLATFORM, S.L. | STOCKCROWD IN | Spain |  | Comisión Nacional del Mercado de Valores (CNMV) | 2023-12-15 | Active |  | https://www.stockcrowdin.com/in/ |
| 251 | URBANITAE REAL ESTATE PLATFORM, S.L. | URBANITAE | Spain | Germany, Denmark, Finland, France, Greece, Hungary, Ireland, Italy, Belgium, Lithuania, Luxembourg, Malta, Netherlands, Portugal, Sweden | Comisión Nacional del Mercado de Valores (CNMV) | 2022-12-23 | Active |  | https://urbanitae.com/ |
| 252 | URBIX, PSFP, S.L. | URBIX Real Estate Investments | Spain |  | Comisión Nacional del Mercado de Valores (CNMV) | 2025-10-03 | Active |  | https://urbix.es |
| 253 | Accumeo AB | Accumeo AB | Sweden |  | Finansinspektionen (FI) | 2023-05-15 | Inactive | 2026-01-26 | https://accumeo.com/ |
| 254 | Crowdlending Europe AB | Crowdlending Europe AB | Sweden |  | Finansinspektionen (FI) | 2025-12-19 | Active |  | N/A |
| 255 | FinReg Solutions AB | Crowdfunding by eAktiebok | Sweden |  | Finansinspektionen (FI) | 2023-03-02 | Inactive | 2025-08-05 | http://www.eaktiebok.se/crowdfunding |
| 256 | FundingPartner Sverige AB | FP crowdlending AB | Sweden | Norway | Finansinspektionen (FI) | 2023-11-13 | Active |  | https://fundingpartner.se/ |
| 257 | Kameo Investment Platform AB | KAMEO | Sweden | Norway | Finansinspektionen (FI) | 2023-11-08 | Active |  | https://www.kameo.se/ |
| 258 | Pepins Sweden AB | Pepins | Sweden |  | Finansinspektionen (FI) | 2023-05-05 | Inactive | 2025-02-28 | https://www.pepins.com |
| 259 | SBL Finans AB (publ) | Savelend Sweden AB | Sweden |  | Finansinspektionen (FI) | 2023-02-02 | Active |  | https://savelend.se/ |
| 260 | Tessin Nordic AB (publ) | tessin.com | Sweden |  | Finansinspektionen (FI) | 2023-04-06 | Active |  | https://tessin.com/ |
| 261 | TRINE AB | TRINE AB | Sweden |  | Finansinspektionen (FI) | 2023-12-11 | Active |  | https://trine.com/ |

<!-- prettier-ignore-end -->

### 1.2 United States: no single ECSPR equivalent

The US has no one register that matches the ECSPR list. Crowdfunding intermediaries for
SEC Regulation Crowdfunding (Reg CF, 17 CFR Part 227) are either SEC-registered
broker-dealers or SEC-registered **funding portals**; a funding portal must file Form
Funding Portal with the SEC and be a member of FINRA (17 CFR 227.400). Other US
crowdfunding types (Reg A, Rule 506(c) platforms, rewards or donation sites) sit under
different rules and are not covered by this list.

Official sources:

- FINRA list of funding portals (funding portal members; shows SEC file number, other names, website, address, and marks suspended portals):
  https://www.finra.org/about/entities-we-regulate/funding-portals-we-regulate
  Read on 2026-10-30: 73 entries, of which 9 are marked "Suspended" under FINRA Rule 9552 or 9553.
- SEC guidance on funding portal registration and the Form Funding Portal filings (searchable via EDGAR company database):
  https://www.sec.gov/resources-small-businesses/small-business-compliance-guides/registration-funding-portals
  https://www.edgarcompany.sec.gov/servlet/CompanyDBSearch?page=main
- Rule text for portal registration: https://www.ecfr.gov/current/title-17/chapter-II/part-227/subpart-D
- Broker-dealers that run Reg CF offerings are on FINRA's separate broker-dealer list, not the funding portal list.

#### FINRA funding portal list, as read on 2026-10-30

Source: https://www.finra.org/about/entities-we-regulate/funding-portals-we-regulate
(73 entries: 64 with no suspension note, 9 marked "Suspended" by FINRA, with the effective dates and rule numbers as published).
Fields are copied as published, including blank other names and websites. This table covers
funding portals only: it does not include SEC-registered broker-dealers that run Reg CF
offerings, or rewards and donation platforms. Listing status is not a quality rating, and the
FINRA list changes.

<!-- prettier-ignore-start -->

| # | Funding portal | Status on FINRA list | SEC file no. | Other names | Website | Address (as published) |
|---|---|---|---|---|---|---|
| 1 | Aequitas Invest Inc. | Listed | 7-483 |  |  | 11926 N 58 St, Omaha, NE 68152 |
| 2 | ALAO Invest LLC | Listed | 7-331 | Commonwealth; CMNWLTH | https://www.joincommonwealth.com/ | 164 Christopher Street, New York, NY 10014 |
| 3 | Allocations Crowdfunding LLC | Listed | 7-294 |  | www.allocationscf.com | 8 The Green Suite 7105, Dover, DE 19901 |
| 4 | Alvear Ventures Portal LLC | Listed | 7-370 |  | https://alvearventures.demo-ncmaas.com/; https://www.alvearventures.com/ | One Alhambra Plaza, Floor PH, Miami, FL 33134 |
| 5 | Angel Estate Development LLC | Listed | 7-384 |  | https://www.angelestate.com/ | 521 Marguerite, Corona Del Mar, CA 92625 |
| 6 | BigCrowd Portal, LLC | Suspended (effective 10/31/2024, FINRA Rule 9553) | 7-357 |  | https://bigcrowd.com/ | 25 Raspberry Trail, Warren, NJ 07059 |
| 7 | BioTech Funding Portal LLC | Listed | 7-474 | BioTech Social | www.biotech.fund | 222 W Merchandise Mart Plaza #228, Chicago, IL 60654 |
| 8 | Blue Dot Media Holdings, llc | Listed | 7-278 | Untold Capital; Film Capital; Untold | https://untoldcapital.com/; Filmcapital.io; https://www.untoldcapital.com/ | 2140 S Dupont Hwy, Camden, DE 19934 |
| 9 | BRITE Investments, Inc. | Suspended (effective 09/21/2026, FINRA Rule 9552) | 7-218 | BRITE | https://brite.us/ | 8766 Wittenwood CV, Orlando, FL 32836 |
| 10 | Caravan Funds Portal LLC | Listed | 7-322 |  | https://caravanfunds.com/ | 11603 Caplinger Rd, Silver Spring, MD 20904 |
| 11 | CineBlockFilms, LLC | Listed | 7-431 | CineBlock | www.cineblockfilms.com | 9841 Washingtonian Blvd, Suite 200, Gaithersburg, MD 20878 |
| 12 | Climatize Earth Securities LLC | Listed | 7-360 | Climatize | https://www.climatize.earth/; https://apps.apple.com/us/app/climatize-protect-the-planet/id1625951422 | 411 Keystone Way, Santa Cruz, CA 95060 |
| 13 | CollectiveSun Marketplace, LLC | Listed | 7-71 |  | http://collectivesun.market/ | 3295 Meade Ave., San Diego, CA 92116 |
| 14 | Common Owner CF LLC | Listed | 7-229 |  | https://commonowner.com/ | 170 Florida Street, Buffalo, NY 14208 |
| 15 | Community Bond, LLC | Suspended (effective 09/21/2026, FINRA Rule 9552) | 7-443 | Main Street Bond | https://www.mainstreetbond.com/explore | 1972 W 2550 S, Suite D, West Haven, UT 84401 |
| 16 | CRCLE | Listed | 7-479 |  |  | 158 Neponset Ave Unit 3, Boston, MA 02122 |
| 17 | Crowd Ignition, Inc. | Listed | 7-106 |  | https://crowdignition.com/ | 1120 Avenue of the Americas, 4th Floor, New York, NY 10036 |
| 18 | Crowdfund My Deal, LLC | Listed | 7-399 | Crowdfund My Deal | https://invest.crowdfundmydeal.com/; crowdfundmydeal.com | 1431 E. McKinney, Ste 130, Denton, TX 76209 |
| 19 | CrowdsourceFunded.com | Listed | 7-27 |  | https://crowdsourcefunded.com/ | 1319 Ivy Ln, #104, Naperville, IL 60563 |
| 20 | Crowdsurf Funding Portal LLC | Listed | 7-395 | Crowdsurf | https://crowdsurf.xyz/ | 5931 Greenville Avenue, PMB 3023, Dallas, TX 75206 |
| 21 | Dentist Fund LLC | Suspended (effective 09/25/2026, FINRA Rule 9552) | 7-383 |  | https://dentist.fund/ | 791 FM1103 #119, Cibolo, TX 78108 |
| 22 | Eman Equity LLC | Listed | 7-417 |  | https://emanequity.com/ | 355 E Ohio St, Unit 502, Chicago, IL 60611 |
| 23 | Equifund Crowd Funding Portal Inc. | Listed | 7-115 |  | https://equifund.com/ | 9200 Freedom Way NE, Albuquerque, NM 87109 |
| 24 | Equity St. Portal LLC | Listed | 7-412 | Equity St. | https://equityst.com/ | 2931 1st Ave S., Suite A, Seattle, WA 98134 |
| 25 | FanVestor CF, LLC | Listed | 7-248 |  | https://fanvestor.io/investments | 9663 Santa Monica Blvd, Suite 770, Beverly Hills, CA 90210 |
| 26 | FlashFunders Funding Portal, LLC | Listed | 7-9 |  | https://www.flashfunders.com | 6 Venture, Suite 395, Irvine, CA 92618 |
| 27 | Fundify Portal, LLC | Listed | 7-216 | Fundify Portal | https://fundifyportal.com/ | 5900 Balcones Drive, Suite 10888, Austin, TX 78731 |
| 28 | FundingHope, LLC | Listed | 7-380 | FundingHope | https://fundinghope.com/ | 2003 Canterbury Pl, Wheaton, IL 60189 |
| 29 | Fundme.com, Inc. | Listed | 7-78 | FundMe | https://www.fundme.com | 4770 South, 900 East, Suite 202, Murray, UT 84117 |
| 30 | Fundpaas Inc | Suspended (effective 10/14/2026, FINRA Rule 9552) | 7-65 | FundpaaS, Inc. d/b/a Custvestor | http://www.custvestor.com/ | 415 Jackson Street, Suite B, San Francisco, CA 94111 |
| 31 | Fundrizz, Inc. | Listed | 7-475 | Fundrizz | www.fundrizz.com | 9 Maple Street, Scituate, MA 02066 |
| 32 | Fursa Capital LLC | Listed | 7-225 | FURSA; Halal Franchise LLC | https://fursa.capital/ | Unit 5 Third Avenue, London E12 6DX GBR |
| 33 | GigaStar Portal LLC | Listed | 7-376 | GigaStar Market | https://www.gigastarmarket.io/ | 159 N Sangamon St, Suite 200, Chicago, IL 60607 |
| 34 | Honeycomb Portal LLC | Listed | 7-119 | HoneyComb | https://www.honeycombcredit.com/ | 6008 Broad Street, Pittsburgh, PA 15206 |
| 35 | Hospitality Multiple LLC | Suspended (effective 10/31/2024, FINRA Rule 9553) | 7-332 | Hospitality Multiple | https://hmxnyc.new.crowdengine.com/explore | 132 West 31st Street, 9th Floor, New York, NY 10001 |
| 36 | Hycrowd LLC | Listed | 7-96 | Hycrowd | https://www.hycrowd.com/ | 3 SwanCt, Jersey City, NJ 07305 |
| 37 | Ignite Social Impact, Inc | Suspended (effective 11/15/2023, FINRA Rule 9553) | 7-237 |  | https://www.ignitesocialimpact.com/ | 9508 Burning Tree Road, Bethesda, MD 20817 |
| 38 | Infrashares Inc. | Listed | 7-107 |  | https://infrashares.com/ | 125 South HWY 101, Solana Beach, CA 92067 |
| 39 | Invown Funding Portal LLC | Listed | 7-329 |  | https://www.invown.com/ | 33 Dixwell Ave, Ste 330, New Haven, CT 06511 |
| 40 | IPO Wallet LLC | Listed | 7-170 |  | https://ipowallet.com/ | 13601 Preston Road, Suite 220-E, Dallas, TX 75240 |
| 41 | Jumpstart Micro, Inc | Listed | 7-8 | Issuance Express | https://issuanceexpress.com/ | 9800 Wilshire Blvd, Beverly Hills, CA 90212 |
| 42 | Ksdaq Inc. | Listed | 7-42 | Mr. Crowd | https://www.MrCrowd.com | 1302 Decca Industrial Centre, 12 Kut Shing Street, Chai Wan, Hong Kong HKG |
| 43 | Loupt Portal LLC | Listed | 7-446 |  | https://www.investloupt.com/ | 6 Crimson Drive, Hockessin, DE 19707 |
| 44 | MainVest, Inc. | Listed | 7-162 |  | https://mainvest.com/ | 81 Washington St, Salem, MA 01970 |
| 45 | Miventure, Inc. | Listed | 7-227 |  | https://portals.syndicatepath.com/ | 128 Prospect Drive SW, Leesburg, VA 20175 |
| 46 | MustrdSeed Portal LLC | Suspended (effective 10/05/2026, FINRA Rule 9552) | 7-251 |  | https://mustrdseed.com/ | 384 Northyards Blvd, Bldg 100 Suite 190, Atlanta, GA 30313 |
| 47 | NetCapital Funding Portal Inc. | Listed | 7-35 |  | https://netcapital.com/ | 1 Lincoln Street, Floor 29, Boston, MA 02111 |
| 48 | NSSC Funding Portal, LLC | Listed | 7-12 | Small Change | https://www.smallchange.co/ | 947 Liberty Avenue, Pittsburgh, PA 15222 |
| 49 | OpenDeal Portal LLC | Listed | 7-167 | Republic | https://republic.co; https://republic.com | 149 Fifth Avenue, 10th Floor, New York, NY 10010 |
| 50 | OverSubscribe Portal, LLC | Listed | 7-185 |  | https://portal.oversubscribe.co/ | 1140 Ave of the Americas, Suite 931, New York, NY 10036 |
| 51 | PicMii Crowdfunding LLC | Listed | 7-246 | PicMii Crowdfunding; Highlander Crowdfunding | https://www.picmiicrowdfunding.com/; https://www.highlander.ai/ | 212 Spottswood Drive, Lancaster, PA 17601 |
| 52 | Pocket Properties App Corp | Listed | 7-396 |  | https://www.pocketpropertiesapp.com/ | 1724 Lancashire Dr, Chesterfield, VA 23235 |
| 53 | Publicks House Portal Inc | Suspended (effective 10/13/2026, FINRA Rule 9552) | 7-317 | Fundhouse | www.fundhouse.io | 1000 Brickell Ave, Suite 1100, Miami, FL 33131 |
| 54 | PW Capital, Inc. | Listed | 7-429 |  | https://funding.planetwealth.com/ | 1011 SW A Street, Suite 209, Bentonville, AR 72712 |
| 55 | Pyrium, Inc. | Listed | 7-457 |  |  | 584 Castro Street, #2134, San Francisco, CA 94114 |
| 56 | RealRise Capital LLC | Listed | 7-324 |  | https://realrisecapital.net/ | 4030 Wake Forest Road, Ste 349, Raleigh, NC 27609 |
| 57 | Seedstarter, LLC | Listed | 7-382 |  | https://www.myseedstarter.com/ | 109 Miln Street, Cranford, NJ 07016 |
| 58 | Sengbe Reg CF Portal LLC | Listed | 7-453 | Kingvest | www.kingvest.co | 8746 Apperson, Sunland, CA 91040 |
| 59 | SM Portal LLC | Listed | 7-311 |  | https://smartmoney.inc/ | 300 Arboretum Place, Suite 530, N. Chesterfield, VA 23236 |
| 60 | SMBX, Inc. | Listed | 7-129 | SMBX; SMBX LLC | https://www.thesmbx.com/ | 1667 41st Avenue, San Francisco, CA 94122 |
| 61 | Sprowtt CrowdFunding, Inc. | Listed | 7-44 |  | https://www.sprowttcf.com/ | 3030 N Rocky Point Dr W, Tampa, FL 33607 |
| 62 | StartEngine Capital LLC | Listed | 7-7 | StartEngine | https://www.startengine.com/ | 4100 W. Alameda Avenue, 3rd Floor, Burbank, CA 91505 |
| 63 | Startly Portal LLC | Listed | 7-291 |  | https://startlyportal.com/ | 30 N Gould St Ste 9036, Sheridan, WY 82801 |
| 64 | Thunder Funder Portal LLC | Listed | 7-463 | Thunder Funder | https://thunderfunder.com/ | 1200 Euclid Avenue, #201, Miami Beach, FL 33139 |
| 65 | Timestamp Portal LLC | Listed | 7-456 |  | https://www.timestampfinancial.com/ | 75 State Street, Suite 100, Boston, MA 02109 |
| 66 | Title3Funds, LLC | Listed | 7-83 | Title3Funds.com | http://title3funds.com/ | 301 Forest Avenue, Laguna Beach, CA 92651 |
| 67 | VedasLabs Inc. | Listed | 7-188 |  | https://vedaslabs.io/ | 20 Hallets Point, Unit 601, Queens, NY 11102 |
| 68 | Vesterr | Listed | 7-341 |  | www.vesterr.com | 2727 Paces Ferry Road SE, Suite 750, Atlanta, GA 30339 |
| 69 | Vicinity, LLC | Listed | 7-223 | Vicinity Capital; Vicinity | https://marketplace.vicinityventures.co/offers/ | 411 University Ridge, Greenville, SC 29601 |
| 70 | Wefunder Portal LLC | Listed | 7-33 | Wefunder | https://www.Wefunder.com | 1885 Mission Street, San Francisco, CA 94103 |
| 71 | WeVidIt, Inc. | Listed | 7-328 | Good Works Investments | https://invest.goodworkshub.com/ | 7521 S. Olympia Ave West, #1063, Tulsa, OK 74132 |
| 72 | Wunderfund, Inc. | Listed | 7-116 | Wunderfund | https://www.wunderfund.co/ | 178 Shoemaker Dr., Cincinnati, OH 45140 |
| 73 | WWF Funding Portal LLC | Listed | 7-156 | ClimateWrx | https://www.climatewrx.com/ | 76 W. Adams, #307, Detroit, MI 48226 |

<!-- prettier-ignore-end -->

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

| Platform                     | HQ                  | Types                         | Min        | Advertised return | Secondary | Regulated mark                     |
| ---------------------------- | ------------------- | ----------------------------- | ---------- | ----------------- | --------- | ---------------------------------- |
| 8lends                       | Switzerland         | P2P, Tokenized                | 100 USDT   | 22.5%             | Yes       |                                    |
| FF Forest                    | Latvia              | Tokenized                     | 1,000 USDT | 18%               | No        |                                    |
| skew.net                     | Switzerland         | P2P, Reward, Tokenized        | $200       | 12%               | No        | Regulated                          |
| Shipfinex                    | UAE                 | Equity, Tokenized             | $1,000     | 10%               | No        |                                    |
| Headway Nova                 | South Africa        | Tokenized                     | $25        | 16.7%             | Yes       | Regulated                          |
| 0xequity                     | Turkey/USA          | Equity, Tokenized             | $10        | 7%                | No        | Regulated                          |
| Daskapital                   | Portugal            | Equity, Debt, Tokenized       | €10        | 9%                | Yes       | Regulated                          |
| InvestaX                     | Singapore           | Tokenized                     | 100 USDT   | 4-10%             | Yes       | Regulated (MAS CMS + RMO per card) |
| Invesdor                     | Germany             | Equity, Debt, Tokenized       | €250       | 6%                | No        | Regulated                          |
| Bitlauncher                  | United Kingdom      | Tokenized                     | $150,000   | 4%                | No        |                                    |
| DealMaker                    | USA/Canada          | Equity, Debt, Reward          | $1         | —                 | No        | Regulated                          |
| FundinFolks                  | Singapore           | Equity, Tokenized             | $10,000    | 20%               | No        |                                    |
| pitchIN                      | Malaysia            | Equity, Tokenized             | RM 500     | —                 | Yes       | Regulated                          |
| Republic                     | USA                 | Equity, Tokenized             | $50        | 15%               | Yes       | Regulated                          |
| Hurst                        | Brazil              | Debt, Tokenized               | R$ 10,000  | 21.1%             | Yes       | Regulated                          |
| GigaStar Market              | USA                 | Tokenized                     | $50        | 14%               | No        | Regulated                          |
| Fraxtor                      | Singapore/Australia | Equity, Tokenized, Buy-to-let | S$ 10,000  | 10%               | No        | Regulated                          |
| BlocHome                     | Luxembourg          | Tokenized                     | €1,000     | —                 | No        |                                    |
| Securitize                   | USA                 | Tokenized                     | $1,000     | 10%               | Yes       | Regulated                          |
| Tecra Space                  | Poland              | Reward, Tokenized, Donation   | 1 USDT     | 15%               | Yes       |                                    |
| arttrade                     | Germany             | Tokenized                     | €1,000     | 9%                | No        | Regulated                          |
| Reental                      | Spain               | Tokenized                     | €100       | 18%               | Yes       |                                    |
| BnkToTheFuture               | USA/Canada          | Equity, Tokenized             | $1         | 15%               | Yes       |                                    |
| MountX                       | Mexico/Canada       | Tokenized                     | $200       | 15%               | No        |                                    |
| Alta                         | Singapore/India     | Equity, Debt, Tokenized       | $500       | —                 | Yes       | Regulated                          |
| Coreestate                   | Denmark             | Tokenized                     | €100       | 10%               | No        |                                    |
| Metawealth                   | Ireland             | Tokenized                     | $100       | 20%               | Yes       |                                    |
| Definder                     | United Kingdom      | Tokenized                     | $10        | 15%               | No        |                                    |
| STOKR                        | Luxembourg          | Tokenized                     | $100       | 15%               | No        |                                    |
| Atlas One Digital Securities | Canada              | Equity, Debt, Tokenized       | C$ 1,000   | 14%               | No        | Regulated                          |
| Alius Capital                | Spain               | Equity, Debt, Tokenized       | —          | —                 | Yes       | Regulated (CNMV-licensed per card) |
| FINEXITY                     | Germany             | Equity, Debt, Tokenized       | €500       | 5-10.4%           | Yes       | Regulated                          |
| Micro Tuber                  | Singapore           | Tokenized                     | 1 USDT     | —                 | Yes       |                                    |
| Crowd For Angels             | United Kingdom      | Equity, Debt, Tokenized       | £25        | up to 8% p.a.     | No        | Regulated                          |
| Rocksolid Estate             | Austria             | Tokenized                     | €100       | 12%               | No        |                                    |
| CONDA Capital                | Austria             | Equity, Debt, Tokenized       | €250       | 7%                | No        | Regulated                          |
| RealDeed Proppass            | UAE/India           | Tokenized                     | $1,500     | 15%               | No        | Regulated                          |
| Infinite Launch              | Singapore           | Tokenized                     | 20 USDT    | 40%               | Yes       | Regulated                          |
| TrustPad                     | Panama              | Equity, Tokenized             | 1 USDT     | —                 | Yes       |                                    |
| ChainRaise                   | USA                 | Equity, Tokenized             | $100       | 10%               | No        |                                    |
| Meta Yield                   | Panama              | Reward, Tokenized             | 1 USDT     | —                 | No        |                                    |
| Grex                         | India               | Equity, Debt, Tokenized       | ₹20,000    | 10%               | No        |                                    |

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
