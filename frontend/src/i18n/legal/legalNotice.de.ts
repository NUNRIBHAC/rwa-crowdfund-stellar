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
      'Dieser Rechtliche Hinweis identifiziert den Betreiber der Blockallisto-Website und -Demoanwendung (der "Service"). Die unten gezeigten Unternehmensdaten sind fiktive Demonstrationsdaten: Rechtsform "Lda." [DEMO], eingetragener Sitz "Rua da Demonstracao 0, 0000-000 Lisboa, Portugal" [DEMO], Registernummer "000 000 000" [DEMO], Stammkapital "EUR 0" [DEMO], Geschäftsführer "Nome Demonstracao" [DEMO]. Der eingetragene Firmenname, die Rechtsform, der Sitz und der Registrierungsstatus von Blockallisto wurden nicht verifiziert, und es wird keine Registrierung behauptet. Kontakt: ',
      {
        v: 'contactEmail',
      },
      '.',
    ],
  },
  {
    t: 'h2',
    text: ['1. Betreiber'],
  },
  {
    t: 'table',
    head: [[['Feld'], ['Wert']]],
    rows: [
      [['Handelsname'], ['Blockallisto']],
      [['Rechtsform'], ['"Lda." [DEMO]']],
      [['Eingetragener Sitz'], ['"Rua da Demonstracao 0, 0000-000 Lisboa, Portugal" [DEMO]']],
      [['Handelsregister'], ['"Registo Comercial de [Lisboa], Nummer 000 000 000" [DEMO]']],
      [['USt-IdNr.'], ['"PT 000 000 000" [DEMO]']],
      [['Geschäftsführer'], ['"Nome Demonstracao" [DEMO]']],
      [
        ['Kontakt'],
        [
          {
            v: 'contactEmail',
          },
        ],
      ],
    ],
  },
  {
    t: 'p',
    text: [
      'Ersetzen Sie jeden [DEMO]-Wert durch die tatsächlichen registrierten Daten des Betreibers, bevor etwas über den Prototyp hinaus veröffentlicht wird.',
    ],
  },
  {
    t: 'h2',
    text: ['2. Regulatorischer Status'],
  },
  {
    t: 'p',
    text: [
      'Blockallisto ist heute eine ',
      {
        b: ['Prototyp-Demonstration'],
      },
      ', die vollständig im Stellar-Testnetz (Testnet) läuft. Der Betreiber ist ',
      {
        b: ['nicht'],
      },
      ' als Crowdfunding-Dienstleister gemäß der Verordnung (EU) 2020/1503 (ECSPR) autorisiert, ',
      {
        b: ['nicht'],
      },
      ' von der CMVM oder einer anderen zuständigen Behörde in dieser Eigenschaft beaufsichtigt und macht ',
      {
        b: ['kein Angebot'],
      },
      ' für Investitionen. Nichts im Service ist ein Angebot, eine Aufforderung, eine Empfehlung oder eine Anlage-, Rechts-, Steuer- oder Finanzberatung. Es ist kein echtes Geld im Spiel; Testnet-Token haben keinen Geldwert.',
    ],
  },
  {
    t: 'p',
    text: [
      'Wenn und sobald ein echter Start vorbereitet wird, wird dieser Hinweis vor jedem echten Angebot mit dem Genehmigungsstatus des Betreibers, seiner zuständigen Aufsichtsbehörde und allen erforderlichen Binnenmarkt-Angaben aktualisiert.',
    ],
  },
  {
    t: 'h2',
    text: ['3. Inhalt und Haftung'],
  },
  {
    t: 'p',
    text: [
      'Der Inhalt des Services wird wie besehen zur Bewertung eines Prototyps bereitgestellt. Beispielkampagnen, Emittenten, Zahlen und Ergebnisse sind fiktive Illustrationen. Der Betreiber übernimmt keine Haftung für Entscheidungen auf Grundlage von Demo-Inhalten. Externe Links führen, sofern vorhanden, zu Inhalten Dritter, die der Betreiber nicht kontrolliert.',
    ],
  },
  {
    t: 'h2',
    text: ['4. Geistiges Eigentum'],
  },
  {
    t: 'p',
    text: [
      'Der Service, sein Inhalt und sein Code sind Copyright (c) 2026 Nuno Ribeiro, alle Rechte vorbehalten. Es wird keine Open-Source-Lizenz oder Patenterteilung gewährt. Sie dürfen die Demo zur Bewertung ansehen und nutzen; Sie dürfen sie nicht kopieren, erneut veröffentlichen oder weiterverkaufen.',
    ],
  },
  {
    t: 'h2',
    text: ['5. Anwendbarer Rahmen [zu prüfen]'],
  },
  {
    t: 'p',
    text: [
      'Klauseln zu anwendbarem Recht und Gerichtsstand für einen echten Start erfordern Rechtsberatung und hängen von der endgültigen Registrierung des Betreibers ab. Diese Vorlage trifft für den Prototyp bewusst keine Aussage zum anwendbaren Recht.',
    ],
  },
];
