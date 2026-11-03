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
    t: 'h2',
    text: ['Zuerst lesen: An der heutigen Demo ist kein echtes Geld beteiligt'],
  },
  {
    t: 'p',
    text: [
      'Blockallisto ist derzeit ein ',
      {
        b: ['Prototyp im Stellar-Testnet'],
      },
      '. Alle Beiträge verwenden Test-Token ',
      {
        b: ['ohne Geldwert'],
      },
      '. Sie können in dieser Demo kein echtes Geld verlieren, und nichts daran ist eine echte Investitionsgelegenheit.',
    ],
  },
  {
    t: 'p',
    text: [
      'Die folgenden Warnhinweise erläutern die Risiken, die für die Art des Investierens, die Blockallisto demonstriert - Crowdfunding in reale Vermögenswerte über Krypto-Asset-Infrastruktur -, ',
      {
        b: ['gelten würden'],
      },
      '. Sie werden jetzt veröffentlicht, damit das Risikogespräch vom ersten Tag an Teil des Produkts ist.',
    ],
  },
  {
    t: 'h2',
    text: ['Allgemeine Warnung'],
  },
  {
    t: 'p',
    text: [
      'Das Investieren in Crowdfunding-Projekte - sei es in reale Vermögenswerte wie Immobilien oder Unternehmen, sei es über Krypto-Assets und Token - ist ',
      {
        b: ['hochriskant'],
      },
      '. Sie könnten ',
      {
        b: ['Ihr gesamtes investiertes Geld verlieren'],
      },
      '. Solche Investitionen sind typischerweise ',
      {
        b: ['nicht abgedeckt'],
      },
      ' durch Einlagensicherungs- oder Anlegerentschädigungssysteme.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['Investieren Sie niemals Geld, dessen Verlust Sie sich nicht leisten können.'],
      },
      ' Zur Größenordnung: Die Referenzplattformen in unserem Forschungskorpus geben konkrete Diversifikationshinweise - die Risikohinweisseite von CONDA rät, nicht mehr als etwa 10 % der frei verfügbaren Mittel in diese Anlageklasse zu investieren, und das österreichische Standard-Crowdfunding-Anlegerblatt (AltFG-Regime, bei dagobertinvest beobachtet) warnt davor, mehr als 10 % des Nettovermögens zu investieren. Dies ist die beobachtete Risikokommunikationspraxis etablierter Plattformen, als Referenzpunkt zitiert - sie ist keine Rechtsregel, die auf diese Demo anwendbar wäre, und keine Garantie, dass irgendein Prozentsatz für Ihre Situation sicher ist. Einen kleineren Betrag auf mehrere Projekte zu verteilen reduziert das Risiko eines Totalverlusts, beseitigt es aber nie.',
    ],
  },
  {
    t: 'h2',
    text: ['Spezifische Risiken'],
  },
  {
    t: 'ul',
    items: [
      [
        {
          b: ['Kapitalverlust.'],
        },
        ' Das Projekt, das Sie unterstützen, kann scheitern, hinter den Erwartungen zurückbleiben oder wertlos werden. Emittenten können und werden nach erfolgreichen Finanzierungen insolvent. Erträge sind nie garantiert.',
      ],
      [
        {
          b: ['Illiquidität.'],
        },
        ' Crowdfunding- und tokenisierte Positionen können schwer oder gar nicht verkäuflich sein. Es kann keinen Sekundärmarkt geben, Übertragungen können die Zustimmung des Emittenten oder der Plattform und einen verifizierten Empfänger erfordern, und Sie müssen möglicherweise bis zum Projektende halten - oder länger. (Im aktuellen Prototyp existiert gar kein übertragbarer Token.)',
      ],
      [
        {
          b: ['Nachrangigkeit.'],
        },
        ' Nachrangige oder "Junior"-Instrumente stehen hinter anderen Gläubigern; bei qualifizierter Nachrangigkeit erhalten Sie möglicherweise nichts, solange der Emittent überschuldet ist, und Zins- oder Rückzahlungsansprüche können vollständig ausgesetzt werden.',
      ],
      [
        {
          b: ['Laufzeit- und Verlängerungsrisiko.'],
        },
        ' Darlehen und Anleihen können nach ihren Verträgen über die angegebene Laufzeit hinaus verlängert werden, was die Rückzahlung verzögert.',
      ],
      [
        {
          b: ['Bewertungsrisiko.'],
        },
        ' Reale Vermögenswerte sind schwer zu bewerten; angegebene Bewertungen können falsch oder veraltet sein. (In dieser Demo sind alle Bewertungen und Emittentenidentitäten Platzhalterdaten.)',
      ],
      [
        {
          b: ['Smart-Contract-Risiko.'],
        },
        ' Code kann Fehler enthalten oder ausgenutzt werden, und Transaktionen auf einer Blockchain sind im Allgemeinen unumkehrbar.',
      ],
      [
        {
          b: ['Netzwerkrisiko.'],
        },
        ' Blockchain-Netzwerke können Überlastung, Ausfälle, Forks oder Protokolländerungen erleiden, die außerhalb jeder Kontrolle liegen.',
      ],
      [
        {
          b: ['Schlüssel- und Wallet-Risiko.'],
        },
        ' Wenn Sie den geheimen Schlüssel oder die Wiederherstellungsphrase Ihrer Wallet verlieren oder sie gestohlen werden, sind Ihre Gelder weg, und niemand kann sie wiederherstellen.',
      ],
      [
        {
          b: ['Regulierungsrisiko.'],
        },
        ' Die Regeln für Crowdfunding (ECSPR in der EU) und Krypto-Assets (MiCA) entwickeln sich weiter. Eine heute mögliche Struktur kann sich ändern, und Angebote können an Ihrem Wohnort eingeschränkt werden.',
      ],
      [
        {
          b: ['Volatilitäts- und Währungsrisiko.'],
        },
        ' Krypto-Asset-Preise können stark schwanken; Stablecoins können ihre Bindung verlieren; Wechselkurse bewegen sich.',
      ],
      [
        {
          b: ['Gegenpartei- und Betrugsrisiko.'],
        },
        ' Emittenten können Gelder schlecht verwalten oder ihre Projekte falsch darstellen. Plattformprüfungen reduzieren dieses Risiko, können es aber nicht ausschließen.',
      ],
    ],
  },
  {
    t: 'h2',
    text: ['Anlegerschutz und dieser Prototyp'],
  },
  {
    t: 'p',
    text: [
      'Der Prototyp enthält Demo-Kategorisierung, Wissenstest und Verlustsimulation; die Erhebung echter Daten bleibt beschränkt. Diese Ansichten sind kein rechtlich geprüfter Schutz. Echte Investitionen und eine rechtlich wirksame Bedenkzeit sind nicht aktiv. Ein regulierter Dienst würde eine eigene rechtliche Prüfung und Genehmigungen benötigen. Diese Verfahren beseitigen das Anlagerisiko nicht.',
    ],
  },
  {
    t: 'h2',
    text: ['Keine Beratung'],
  },
  {
    t: 'p',
    text: [
      'Nichts in diesem Service ist eine Anlage-, Rechts- oder Steuerberatung oder eine Empfehlung, irgendetwas zu kaufen oder zu verkaufen. Vergangene Wertentwicklung - real oder simuliert - sagt keine zukünftigen Ergebnisse voraus. Ziehen Sie unabhängige fachliche Beratung in Betracht und diversifizieren Sie: Konzentrieren Sie Ihre Ersparnisse nicht auf ein einzelnes Projekt oder eine einzelne Anlageart.',
    ],
  },
  {
    t: 'h2',
    text: ['Anerkenntnis'],
  },
  {
    t: 'p',
    text: [
      'Durch die Nutzung dieser Demo erkennen Sie an, dass Sie diese Risikooffenlegung gelesen und verstanden haben. Vor einem etwaigen echten Start gilt eine ausführlichere, rechtlich geprüfte Risikoerklärung.',
    ],
  },
];
