import type { LegalBlock } from './types';

export const blocks: LegalBlock[] = [
  {
    t: 'notice',
    text: [
      'Demo-Vorlage: Diese Seite ist ein illustratives Dokument für den Blockallisto-Prototyp, keine Rechtsberatung. Sie wurde nicht von einem Anwalt geprüft und ist kein Nachweis einer Firmenregistrierung oder behördlichen Genehmigung. Mit [DEMO] gekennzeichnete Unternehmensangaben sind fiktive Demonstrationsdaten.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['Zuletzt aktualisiert:'],
      },
      ' ',
      {
        v: 'lastUpdated',
      },
    ],
  },
  {
    t: 'p',
    text: [
      'Diese Datenschutzrichtlinie erklärt, welche personenbezogenen Daten der Blockallisto-Prototyp (der "Service") verarbeitet, warum, und welche Rechte Sie haben. Der Service ist ein Prototyp-Projekt, das unter dem Namen Blockallisto betrieben wird. Die für Blockallisto in diesen Dokumenten angegebenen Unternehmensdaten sind fiktive Demonstrationsdaten ([DEMO] Rechtsform "Lda.", [DEMO] eingetragener Sitz "Rua da Demonstracao 0, 0000-000 Lisboa, Portugal", [DEMO] Registernummer "000 000 000"); die eingetragene Rechtspersönlichkeit hinter dem Namen Blockallisto wurde nicht verifiziert, und die Nennung des Projekts identifiziert für sich allein nicht den verantwortlichen Datenverantwortlichen. [Der Verantwortliche - die für diese Verarbeitung tatsächlich verantwortliche Person oder Einheit - ist vor einer Veröffentlichung zu bestätigen.] Datenschutzanfragen werden beantwortet unter ',
      {
        v: 'contactEmail',
      },
      '.',
    ],
  },
  {
    t: 'h2',
    text: ['1. Umfang: was die Demo nicht erhebt'],
  },
  {
    t: 'p',
    text: [
      'Der aktuelle Prototyp hat ',
      {
        b: ['kein KYC, keine Newsletter und keine Zahlungen'],
      },
      '. Die Community-Anmeldung ist walletbasiert: Sie verwendet eine Stellar-Wallet-Signatur, kein Passwort und keine E-Mail-Adresse. Wir fragen weder Ihren vollständigen Namen, Ihre Telefonnummer, Ausweisdokumente noch Ihre Zahlungskarte ab. Die Community-Funktionen erheben allerdings die in Abschnitt 2b beschriebenen Daten: einen öffentlichen Schlüssel, einen optionalen Anzeigenamen, freie Textinhalte, die Sie einreichen, und eine optionale Kontakt-E-Mail bei Emittentenbewerbungen. Wir verwenden keine Analyse- oder Werbe-Tracker, und die Schriften und Assets der Website sind selbst gehostet.',
    ],
  },
  {
    t: 'h2',
    text: ['2. Daten, die wir verarbeiten'],
  },
  {
    t: 'p',
    text: [
      {
        b: ['a) Wallet- und Beitragsdaten.'],
      },
      ' Wenn Sie eine Freighter-Wallet verbinden und einen Testbeitrag leisten, zeichnet das Backend in einer Postgres-Datenbank (gehostet von Neon) ein Sicherheitsjournal auf, das Folgendes enthält: Ihren Stellar-',
      {
        b: ['Public Key'],
      },
      ' (niemals Ihren geheimen Schlüssel), die Kampagnen-ID, die Aktion, den Beitragsbetrag, Transaktionsumschläge, den Transaktionshash und -status sowie Zeitstempel. Ein Stellar-Public-Key ist ein pseudonymes Datum; wir verknüpfen ihn nicht mit Ihrer Identität.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        i: ['Aufbewahrung:'],
      },
      ' nicht signierte vorbereitete Transaktionen verfallen nach 24 Stunden; abgeschlossene oder fehlgeschlagene Transaktionen werden nach 30 Tagen entfernt; eine signierte Transaktion mit ungeklärtem Ausgang wird bis zur Klärung aufbewahrt, weil ihr Löschen die Spur einer gesendeten Transaktion verlieren könnte. Signierte Umschläge werden bereinigt, sobald die Transaktion einen Endzustand erreicht. Dies sind die im eigenen Code der Anwendung konfigurierten Aufräumregeln: Sie beschreiben, was die Anwendung löscht. Die eigenen Serverlogs und Backups unserer Hosting-Anbieter können Daten nach deren eigenen Datenschutzrichtlinien für andere Zeiträume aufbewahren und sind von diesen Regeln nicht erfasst.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['b) Community-Konto und Community-Inhalte.'],
      },
      ' Wenn Sie sich bei den Community-Funktionen anmelden, speichert das Backend in derselben Neon-Postgres-Datenbank: Ihren Stellar-',
      {
        b: ['Public Key'],
      },
      ', einen Zeitstempel der Kontoerstellung und einen optionalen ',
      {
        b: ['Anzeigenamen'],
      },
      ' (bis zu 40 Zeichen). Die Anmeldung funktioniert durch Signieren einer einmaligen Server-Challenge mit Ihrer Wallet (5 Minuten Gültigkeit, einmalige Verwendung); kein Passwort und keine E-Mail sind erforderlich, und Ihr geheimer Schlüssel verlässt die Wallet nie. Der Server speichert nur einen SHA-256-Hash des Sitzungstokens; das Rohtoken liegt im lokalen Speicher Ihres Browsers. Sitzungen dauern 30 Tage, das Abmelden löscht die Sitzung, und abgelaufene Challenges und Sitzungen werden stündlich entfernt.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['Kommentare'],
      },
      ' sind öffentlich: Jeder Kommentar speichert Ihren öffentlichen Schlüssel, Ihren Anzeigenamen, falls gesetzt, den Text (bis zu 1000 Zeichen), die Kampagne und einen Zeitstempel, und die jeweils letzten 100 Kommentare pro Kampagne werden jedem Besucher angezeigt. Ein vom Betreiber ausgeblendeter Kommentar verschwindet sofort aus der öffentlichen Liste und wird 30 Tage nach dem Ausblenden endgültig gelöscht. ',
      {
        b: ['Support-/Feedback-Tickets'],
      },
      ' (Art, Betreff bis 120 Zeichen, Text bis 4000 Zeichen, Status, Zeitstempel) und ',
      {
        b: ['Emittentenbewerbungen'],
      },
      ' (Projektname, Land, Instrumententyp, Zielbetrag, Beschreibung und eine optionale Kontakt-E-Mail) sind nur für Ihr Wallet-Konto und den Administrator des Betreibers sichtbar; beide werden nach 90 Tagen endgültig gelöscht (Aufbewahrungsfenster im Anwendungscode konfigurierbar). Kampagnen-',
      {
        b: ['News'],
      },
      ' werden vom Betreiber verfasst und als Plattform-Demoinhalt gekennzeichnet. Ihre IP-Adresse wird im Arbeitsspeicher zur Ratenbegrenzung verwendet und innerhalb von 24 Stunden verworfen; die Anwendung speichert sie nicht dauerhaft (Hosting-Logs sind unter Punkt e behandelt).',
    ],
  },
  {
    t: 'p',
    text: [
      'Ein Hinweis zur Vorsicht: Öffentliche Schlüssel, Anzeigenamen und freie Textinhalte können Sie identifizieren, obwohl wir nie nach Ihrem Namen fragen. Reichen Sie keine sensiblen persönlichen Informationen in Community-Feldern ein.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['c) Öffentliche Blockchain-Daten.'],
      },
      ' Testbeiträge werden öffentlich im Stellar-',
      {
        b: ['Testnet'],
      },
      ' aufgezeichnet und sind auf öffentlichen Explorern sichtbar. Blockchain-Einträge können von uns weder geändert noch gelöscht werden.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['d) Gerätepräferenzen.'],
      },
      ' Ihre Theme- (hell/dunkel) und Sprachwahl werden im lokalen Speicher Ihres Browsers gespeichert. Diese Daten bleiben auf Ihrem Gerät und werden nicht an uns gesendet.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['e) Technische Logs.'],
      },
      ' Unser Hosting-Anbieter (Render, Region Frankfurt) verarbeitet Standard-Serverlogs (etwa IP-Adresse und Anfrage-Metadaten), um den Service bereitzustellen und zu schützen.',
    ],
  },
  {
    t: 'h2',
    text: ['3. Daten, die wir in zukünftigen Versionen zu verarbeiten planen (heute nicht erhoben)'],
  },
  {
    t: 'p',
    text: [
      'Das indikative Design zukünftiger Blockallisto-Versionen - entlang der Compliance-Oberflächen etablierter EU-Crowdfunding-Plattformen - sieht vor, zusätzliche Kategorien personenbezogener Daten zu verarbeiten, ',
      {
        b: ['wenn und falls'],
      },
      ' diese Funktionen starten. Genaue Kategorien, Anbieter und Schwellenwerte können sich mit Designarbeit und Rechtsberatung ändern:',
    ],
  },
  {
    t: 'ul',
    items: [
      [
        {
          b: ['Registrierungsdaten:'],
        },
        ' vollständiger Name (genau wie in Ihrem Ausweisdokument), E-Mail-Adresse, Wohnsitzland und Steueransässigkeit.',
      ],
      [
        {
          b: ['Identitätsprüfung (KYC/AML):'],
        },
        ' Ausweisbilder, ein Selfie, Mobilnummer und Prüfergebnisse, verarbeitet mit spezialisierten Drittanbietern für Verifizierung; bei Unternehmensinvestoren wirtschaftlich Berechtigte (typischerweise jeder mit mehr als 25 %) und Herkunft der Mittel; Erklärungen politisch exponierter Personen (PEP).',
      ],
      [
        {
          b: ['Zahlungs- und Auszahlungsdaten:'],
        },
        ' Bankdaten (etwa IBAN), verarbeitet von lizenzierten Zahlungsdienstleistern, nicht von uns, die Kundengelder halten.',
      ],
    ],
  },
  {
    t: 'p',
    text: [
      'Mit Ausnahme der optionalen Emittenten-Kontakt-E-Mail aus Abschnitt 2b wird keine dieser Daten von der aktuellen Demo erhoben. Falls diese Funktionen starten, wird diese Richtlinie zuerst aktualisiert, mit den Anbietern, Zwecken, Rechtsgrundlagen und Aufbewahrungsfristen je Kategorie.',
    ],
  },
  {
    t: 'h2',
    text: ['4. Zwecke und Rechtsgrundlagen (DSGVO)'],
  },
  {
    t: 'p',
    text: [
      'Wir verarbeiten die Daten aus Abschnitt 2, um den Prototyp zu betreiben, zu sichern und zu demonstrieren: Testtransaktionen vorzubereiten und zu verfolgen, Doppelausgaben zu verhindern und mehrdeutige Transaktionen aufzuklären, den Service zuverlässig zu halten und die Community-Funktionen zu betreiben (Kommentare veröffentlichen und moderieren, Support- und Feedback-Tickets beantworten und Emittentenbewerbungen prüfen). Rechtsgrundlage ist unser berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO) am Betrieb einer sicheren technischen Demonstration. Wir verwenden Ihre Daten nicht für Marketing, Profiling oder Verkauf.',
    ],
  },
  {
    t: 'h2',
    text: ['5. Wer Daten verarbeitet'],
  },
  {
    t: 'ul',
    items: [
      [
        {
          b: ['Render'],
        },
        ' (Hosting, Frankfurt, EU) - betreibt die Anwendung.',
      ],
      [
        {
          b: ['Neon'],
        },
        ' (verwaltetes Postgres; AWS-Region Europa (Frankfurt), EU - verifiziert in der Neon-Konsole am ',
        {
          v: 'lastUpdated',
        },
        ') - speichert das Beitragsjournal und den Community-Datenspeicher.',
      ],
      [
        {
          b: ['Stellar-Testnet'],
        },
        ' (öffentliches Netz der Stellar Development Foundation, global) - zeichnet öffentliche Testtransaktionen auf.',
      ],
      [
        {
          b: ['GitHub'],
        },
        ' - hostet den Quellcode (keine Nutzerdaten).',
      ],
    ],
  },
  {
    t: 'p',
    text: ['Wo Verarbeitung außerhalb der EU/des EWR stattfindet (etwa das globale Stellar-Netz), betrifft sie ausschließlich pseudonyme Testnet-Daten.'],
  },
  {
    t: 'h2',
    text: ['6. Ihre Rechte nach der DSGVO'],
  },
  {
    t: 'p',
    text: [
      'Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung oder Widerspruch gegen die Verarbeitung Ihrer personenbezogenen Daten sowie auf Datenübertragbarkeit nach der Verordnung (EU) 2016/679 (DSGVO). Sie haben außerdem das Recht, bei der portugiesischen Aufsichtsbehörde, der ',
      {
        b: ['CNPD'],
      },
      ' (Comissao Nacional de Protecao de Dados), eine Beschwerde einzureichen.',
    ],
  },
  {
    t: 'p',
    text: [
      'Wir können die Ihnen zugeordneten Daten nur über Ihren Stellar-Public-Key (und jeden Anzeigenamen oder freien Text, den Sie eingereicht haben) finden. Bereits in einer öffentlichen Blockchain geschriebene Daten können nicht gelöscht werden; wir können Off-Chain-Datensätze (das Beitragsjournal, Ihr Community-Konto, Kommentare, Tickets und Bewerbungen) auf Anfrage berichtigen oder löschen, vorbehaltlich der Aufbewahrungsregeln in Abschnitt 2.',
    ],
  },
  {
    t: 'h2',
    text: ['7. Brasilien (LGPD)'],
  },
  {
    t: 'p',
    text: [
      'Die Demo wird von Portugal aus betrieben. Brasiliens Lei Geral de Protecao de Dados (Lei no 13.709/2018 - LGPD) kann auf Verarbeitungen anwendbar sein, die Personen in Brasilien ansprechen oder betreffen; ob sie auf diesen Prototyp anwendbar ist, ist eine rechtliche Frage, die mit Beratern zu klären ist. Wenn und soweit die LGPD gilt, räumt sie Ihnen Rechte an Ihren personenbezogenen Daten ein, die den oben genannten ähneln, und Sie können sich an die ANPD (Autoridade Nacional de Protecao de Dados) wenden. Nutzen Sie für jede Anfrage denselben Kontakt oben.',
    ],
  },
  {
    t: 'h2',
    text: ['8. Sicherheit'],
  },
  {
    t: 'p',
    text: [
      'Ihre Wallet-Schlüssel verlassen nie Ihre Freighter-Erweiterung; der Service ist so gestaltet, dass er nicht darauf zugreifen kann. Die Anwendung wird über TLS ausgeliefert, und administrative Endpunkte sind standardmäßig deaktiviert (fail-closed). Keine Methode ist absolut, aber das Design des Prototyps minimiert die Daten, die angegriffen werden könnten.',
    ],
  },
  {
    t: 'h2',
    text: ['9. Kinder'],
  },
  {
    t: 'p',
    text: ['Der Service ist eine technische Demonstration und richtet sich nicht an Kinder.'],
  },
  {
    t: 'h2',
    text: ['10. Änderungen'],
  },
  {
    t: 'p',
    text: [
      'Wir können diese Richtlinie mit der Weiterentwicklung des Prototyps aktualisieren. Das Datum "Zuletzt aktualisiert" zeigt die aktuelle Version. Wesentliche Änderungen werden hier veröffentlicht, bevor sie wirksam werden.',
    ],
  },
  {
    t: 'h2',
    text: ['11. Kontakt'],
  },
  {
    t: 'p',
    text: [
      'Datenschutzfragen und -anfragen: ',
      {
        v: 'contactEmail',
      },
      '.',
    ],
  },
];
