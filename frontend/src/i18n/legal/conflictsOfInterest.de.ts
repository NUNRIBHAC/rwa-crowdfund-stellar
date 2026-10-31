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
      'Diese Richtlinienvorlage beschreibt, wie Blockallisto Interessenkonflikte zu erkennen, zu verhindern, zu handhaben und offenzulegen beabsichtigt. Blockallisto ist heute eine Prototyp-Demonstration im Stellar-Testnet: Es gibt keine echten Investoren, Emittenten, Gelder oder Angebote, sodass heute kein tatsächlicher Konflikt entstehen kann. Dieses Dokument ist ein Design-Artefakt, das an den Compliance-Oberflächen etablierter EU-Crowdfunding-Plattformen ausgerichtet wurde, und ',
      {
        b: ['nicht'],
      },
      ' eine Beschreibung eines aktiven Compliance-Programms.',
    ],
  },
  {
    t: 'h2',
    text: ['1. Warum diese Richtlinie existiert'],
  },
  {
    t: 'p',
    text: [
      'Crowdfunding-Plattformen stehen zwischen Emittenten, die Gelder suchen, und Investoren, die sie bereitstellen. Die Verordnung (EU) 2020/1503 erwartet von autorisierten Plattformen, Interessenkonflikte zu vermeiden und sie, wo sie nicht vermeidbar sind, zu handhaben und offenzulegen. Diese Vorlage greift diese Erwartung vorweg.',
    ],
  },
  {
    t: 'h2',
    text: ['2. Betrachtete potenzielle Konflikte'],
  },
  {
    t: 'ul',
    items: [
      [
        {
          b: ['Plattform vs. Investor:'],
        },
        ' Die Plattform, die an abgeschlossenen Finanzierungen verdient, könnte versucht sein, schwache Kampagnen zuzulassen. Beabsichtigte Abmilderung: veröffentlichte Zulassungskriterien, dokumentierte Due-Diligence-Schritte je Kampagne und Gebühren, die nicht von Marketingaussagen der Kampagnen abhängen.',
      ],
      [
        {
          b: ['Nahestehende Personen:'],
        },
        ' der Betreiber, seine Geschäftsführer oder deren enge Angehörige als Emittenten oder Investoren. Beabsichtigte Regel: [Nahestehende Personen dürfen nicht als Emittenten auf der Plattform auftreten - durch Rechtsberatung zu bestätigen]; etwaige Investments nahestehender Personen würden, falls je erlaubt, auf der Kampagnenseite offengelegt.',
      ],
      [
        {
          b: ['Eigenanlagen:'],
        },
        ' Beabsichtigte Regel: Die Plattform investiert ',
        {
          b: ['nicht'],
        },
        ' in eigene Kampagnen und hält zu keinem Zeitpunkt eingezahlte Gelder; die Abwicklung erfolgt über [lizenzierte Zahlungsdienstleister - geplant, nicht live].',
      ],
      [
        {
          b: ['Anreize für Mitarbeitende:'],
        },
        ' Beabsichtigte Regel: keine Vergütung, die an den Finanzierungserfolg einzelner Kampagnen gekoppelt ist.',
      ],
      [
        {
          b: ['Informationsasymmetrie:'],
        },
        ' vom Emittenten gelieferte Inhalte könnten irreführen. Beabsichtigte Abmilderung: Basisinformationsblätter je Kampagne, eine standardisierte Kampagnendatenstruktur und eine klare Trennung zwischen verifizierten Plattformdaten und emittentenseitig gelieferten Inhalten.',
      ],
    ],
  },
  {
    t: 'h2',
    text: ['3. Erkennung, Handhabung, Offenlegung'],
  },
  {
    t: 'p',
    text: [
      'Beabsichtigter Prozess: (1) Konfliktregister, geführt von [dem Compliance-Kontakt des Betreibers - zu benennen]; (2) Prüfung vor jeder Kampagnenzulassung und bei jeder wesentlichen Änderung; (3) wo ein Konflikt nicht vermeidbar ist, Offenlegung gegenüber betroffenen Nutzern in klaren Worten, bevor sie sich binden; (4) Verweigerung des Betriebs des konfliktbehafteten Geschäfts, wenn Vermeidung und Offenlegung nicht ausreichen.',
    ],
  },
  {
    t: 'h2',
    text: ['4. Aktueller Stand'],
  },
  {
    t: 'p',
    text: [
      'Nichts davon ist heute operativ. Der Prototyp nimmt keine echten Gelder an, listet keine echten Emittenten und zahlt keine Gebühren. Diese Seite existiert, damit die beabsichtigte Compliance-Oberfläche vor einem echten Start sichtbar und prüfbar ist.',
    ],
  },
];
