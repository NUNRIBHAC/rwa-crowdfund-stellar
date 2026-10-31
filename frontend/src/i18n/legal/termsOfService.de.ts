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
      'Diese Nutzungsbedingungen (die "Bedingungen") regeln Ihre Nutzung der Blockallisto-Website und -Demoanwendung (der "Service"), eines Prototyp-Projekts, das von Blockallisto betrieben wird ("wir", "uns"). Die für Blockallisto in diesen Bedingungen angegebenen Unternehmensdaten sind fiktive Demonstrationsdaten - Rechtsform "Lda." [DEMO], eingetragener Sitz "Rua da Demonstracao 0, 0000-000 Lisboa, Portugal" [DEMO], Registernummer "000 000 000" [DEMO]. Der eingetragene Firmenname, die Rechtsform, der Sitz und der Registrierungsstatus von Blockallisto wurden nicht verifiziert, und es wird keine Registrierung behauptet. Kontakt: ',
      {
        v: 'contactEmail',
      },
      '.',
    ],
  },
  {
    t: 'p',
    text: ['Durch die Nutzung des Services akzeptieren Sie diese Bedingungen. Wenn Sie nicht einverstanden sind, nutzen Sie den Service nicht.'],
  },
  {
    t: 'h2',
    text: ['1. Was Blockallisto heute ist'],
  },
  {
    t: 'p',
    text: [
      'Blockallisto ist eine ',
      {
        b: ['Prototyp-Demonstration'],
      },
      ' eines Konzepts für tokenisiertes Crowdfunding realer Vermögenswerte, die vollständig im ',
      {
        b: ['Stellar-Testnetz (Testnet)'],
      },
      '.',
    ],
  },
  {
    t: 'p',
    text: ['Das bedeutet konkret:'],
  },
  {
    t: 'ul',
    items: [
      [
        'Der Service ist ',
        {
          b: ['nicht'],
        },
        ' eine Crowdfunding-Plattform im rechtlichen Sinne. Wir sind ',
        {
          b: ['nicht'],
        },
        ' ein autorisierter Crowdfunding-Dienstleister nach der Verordnung (EU) 2020/1503 (ECSPR) oder einer anderen Regelung, und wir machen ',
        {
          b: ['keine echten Angebote'],
        },
        ' für Investitionen.',
      ],
      [
        'Nichts im Service ist ein Angebot, eine Aufforderung, eine Empfehlung oder eine Anlage-, Rechts-, Steuer- oder Finanzberatung in irgendeiner Rechtsordnung.',
      ],
      [
        'Es ist kein echtes Geld im Spiel. Beiträge in der Demo verwenden Stellar-',
        {
          b: ['Testnet-Token (Test-USDC), die keinen Geldwert haben'],
        },
        ' und nicht gegen echte Gelder eingetauscht werden können.',
      ],
      [
        'Die Beispielkampagnen sind fiktive Illustrationen. Emittentenidentitäten, Bewertungen, Zahlen und Ergebnisse in der Demo sind ',
        {
          b: ['Platzhalterdaten'],
        },
        ', keine echten Gelegenheiten.',
      ],
    ],
  },
  {
    t: 'h2',
    text: ['2. Was der Service Ihnen ermöglicht'],
  },
  {
    t: 'ul',
    items: [
      ['Beispiel-Investitionskampagnen durchsuchen und filtern und ihre strukturierten Bedingungen lesen.'],
      ['Das Lernzentrum, das Glossar und die FAQ nutzen, um Investitionsinstrumente zu verstehen.'],
      [
        'Eine ',
        {
          b: ['Freighter'],
        },
        '-Wallet (eine Browser-Erweiterung) verbinden und ',
        {
          b: ['Testbeiträge'],
        },
        ' an die Demokampagne im Stellar-Testnet leisten.',
      ],
    ],
  },
  {
    t: 'p',
    text: [
      'Testbeiträge werden von einem Soroban-Smart-Contract mit folgendem Verhalten verarbeitet: Alles-oder-nichts-Finanzierung, Auszahlung an die Kampagne erst nach ihrer Frist, Beiträge auf das Kampagnenziel begrenzt und Salden im Vertrag verzeichnet. Es wird kein übertragbarer Token ausgegeben.',
    ],
  },
  {
    t: 'h2',
    text: ['3. Geplante Funktionen (noch nicht live)'],
  },
  {
    t: 'p',
    text: [
      'Blockallisto wird an den Compliance-Oberflächen etablierter EU-Crowdfunding-Plattformen ausgerichtet. Zukünftige Versionen ',
      {
        b: ['könnten'],
      },
      ' beinhalten: vollständige Benutzerkonten mit E-Mail-Registrierung (über die optionale Community-Anmeldung hinaus); Identitätsprüfung (KYC/AML), einschließlich Prüfungen des wirtschaftlich Berechtigten und der Herkunft der Mittel bei Unternehmensinvestoren; Investoreneinstufung mit einem Einstiegswissenstest und einer Simulation der Verlusttragfähigkeit; eine vorvertragliche Bedenkzeit für nicht erfahrene Investoren; Basisinformationsblätter je Kampagne; Zahlungen über lizenzierte Zahlungsdienstleister (niemals über uns, die Kundengelder halten); Beschwerdemanagement und Interessenkonflikt-Richtlinien; sowie rechtsraumbezogene Verkaufsbeschränkungen.',
    ],
  },
  {
    t: 'p',
    text: [
      'Nichts davon existiert heute. Die obige Liste ist eine indikative Designrichtung aus unserem Forschungskorpus, keine Spezifikation: Details, Schwellenwerte und ganze Funktionen können sich mit der Designarbeit und Rechtsberatung ändern. Diese Funktionen starten nur unter aktualisierten, rechtlich geprüften Bedingungen und nur unter den erforderlichen behördlichen Genehmigungen. Nichts in diesem Abschnitt ist eine Zusage zu einem Startdatum oder einer Lizenz.',
    ],
  },
  {
    t: 'h2',
    text: ['4. Berechtigung und zulässige Nutzung'],
  },
  {
    t: 'p',
    text: [
      'Der Service richtet sich an Erwachsene (18+). Er richtet sich nicht an Personen in einer Rechtsordnung, in der das Betrachten solcher Crowdfunding-Investitionsinhalte eingeschränkt wäre, und er darf US-Personen nicht als Investitionsgelegenheit präsentiert werden.',
    ],
  },
  {
    t: 'p',
    text: [
      'Sie verpflichten sich, Folgendes zu unterlassen: den Service oder seine Infrastruktur anzugreifen, zu sondieren oder zu stören; ihn zu missbrauchen, in missbräuchlichem Tempo auszulesen oder andere Nutzer zu beeinträchtigen; die Demo als echten Investitionsservice darzustellen; oder den Service für etwas Rechtswidriges zu nutzen.',
    ],
  },
  {
    t: 'h2',
    text: ['5. Ihre Wallet und Ihre Schlüssel'],
  },
  {
    t: 'ul',
    items: [
      [
        'Ihre Wallet ist ',
        {
          b: ['nicht verwahrend'],
        },
        ': Ihr geheimer Schlüssel und Ihre Wiederherstellungsphrase bleiben in Ihrer eigenen Freighter-Erweiterung. Wir sehen, speichern oder verlangen sie niemals.',
      ],
      [
        {
          b: ['Geben Sie niemals'],
        },
        ' Ihren geheimen Schlüssel oder Ihre Wiederherstellungsphrase auf irgendeiner Website ein, einschließlich dieser. Jeder, der danach fragt, versucht, Sie zu bestehlen.',
      ],
      [
        'Jede Transaktion wird von Ihnen in Ihrer Wallet signiert. Transaktionen im Stellar-Testnet werden öffentlich aufgezeichnet und können auf öffentlichen Testnet-Explorern eingesehen werden.',
      ],
    ],
  },
  {
    t: 'h2',
    text: ['6. Geistiges Eigentum'],
  },
  {
    t: 'p',
    text: [
      'Der Service, sein Inhalt und sein Code sind Copyright (c) 2026 Nuno Ribeiro, alle Rechte vorbehalten. Es wird keine Open-Source-Lizenz oder Patenterteilung gewährt. Sie dürfen die Demo zur Bewertung ansehen und nutzen; Sie dürfen sie nicht kopieren, erneut veröffentlichen oder weiterverkaufen.',
    ],
  },
  {
    t: 'h2',
    text: ['7. Verfügbarkeit und Änderungen'],
  },
  {
    t: 'p',
    text: [
      'Der Service läuft auf kostenlosem Hosting und kann langsam starten, nicht verfügbar sein oder jederzeit ohne Vorankündigung geändert oder eingestellt werden. Als "nicht gebaut" gekennzeichnete Funktionen (Konten, KYC, Fiat-Zahlungen, Investoren-Dashboard) existieren noch nicht.',
    ],
  },
  {
    t: 'h2',
    text: ['8. Haftungsausschlüsse und Haftungsbeschränkung'],
  },
  {
    t: 'p',
    text: [
      'Der Service wird ',
      {
        b: ['"wie besehen" und "je nach Verfügbarkeit"'],
      },
      ' bereitgestellt, ohne ausdrückliche oder stillschweigende Gewährleistungen jeglicher Art, einschließlich Genauigkeit, Eignung für einen bestimmten Zweck oder Nichtverletzung. Im maximal gesetzlich zulässigen Umfang haften wir nicht für indirekte, beiläufige oder Folgeschäden oder für Verluste aus Ihrer Nutzung des Services, Ihrer Wallet oder des Stellar-Netzwerks. Nichts in diesen Bedingungen schließt eine gesetzlich unabdingbare Haftung aus.',
    ],
  },
  {
    t: 'h2',
    text: ['9. Anwendbares Recht'],
  },
  {
    t: 'p',
    text: [
      'Diese Bedingungen unterliegen den Gesetzen ',
      {
        b: ['Portugals'],
      },
      ' und dem anwendbaren Recht der Europäischen Union, unbeschadet zwingender Verbraucherschutzvorschriften Ihres Wohnsitzlandes.',
    ],
  },
  {
    t: 'h2',
    text: ['10. Änderungen dieser Bedingungen'],
  },
  {
    t: 'p',
    text: [
      'Wir können diese Bedingungen jederzeit aktualisieren. Das Datum "Zuletzt aktualisiert" zeigt die aktuelle Version. Die fortgesetzte Nutzung nach einer Änderung bedeutet, dass Sie die neuen Bedingungen akzeptieren.',
    ],
  },
  {
    t: 'h2',
    text: ['11. Kontakt'],
  },
  {
    t: 'p',
    text: [
      'Fragen zu diesen Bedingungen: ',
      {
        v: 'contactEmail',
      },
      '.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['Ungelöste Betreiberangaben:'],
      },
      ' Die DEMO-Betreiberangaben in diesen Bedingungen sind illustrativ und genügen keiner zwingenden Betreiberkennzeichnungspflicht (etwa einem Impressum oder rechtlichen Hinweis nach portugiesischem oder EU-Recht zu E-Commerce, Medien oder Verbraucherschutz). Ob eine solche Pflicht für diesen Prototyp-Service gilt, wurde nicht festgestellt; etwaig erforderliche Angaben werden hier oder auf einer verlinkten Seite vor einem echten Start ergänzt.',
    ],
  },
];
