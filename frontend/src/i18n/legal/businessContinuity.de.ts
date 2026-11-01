// Generated from frontend/i18n-json/ by scripts/i18n-import.mjs.
// Edit the JSON (Weblate) or this file, then run npm run i18n:export / i18n:import to sync.

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
      'Diese Seite beschreibt, was den Blockallisto-Prototyp verfügbar und wiederherstellbar hält, und welche Kontinuitätsplanung für eine künftige autorisierte Plattform beabsichtigt ist. Der erste Abschnitt ist sachlich zur laufenden Demo; der zweite ist Designabsicht, nicht gegenwärtige Praxis.',
    ],
  },
  {
    t: 'h2',
    text: ['1. Kontinuitätsposition des Prototyps (aktuell)'],
  },
  {
    t: 'ul',
    items: [
      [
        {
          b: ['Keine Kundenvermögen gefährdet:'],
        },
        ' Die Demo hält kein Geld, keine Kundengelder und keine Verwahrung. Beiträge sind Testnet-Token ohne Geldwert, abgewickelt über einen Soroban-Smart-Contract im öffentlichen Stellar-Testnet. Der Vertragszustand liegt im Testnet-Ledger, unabhängig von dieser Website.',
      ],
      [
        {
          b: ['Hosting:'],
        },
        ' Website und API laufen im kostenlosen Tarif von Render; die Betriebsdaten (Transaktionsjournal, Community-Daten) liegen in einer Neon-Postgres-Datenbank im kostenlosen Tarif. Beides sind Dienste Dritter mit eigenen Verfügbarkeitseigenschaften; für die Demo wird keine Betriebszeit garantiert.',
      ],
      [
        {
          b: ['Backups:'],
        },
        ' [Backup-Zeitplan und Aufbewahrung zu definieren - die kostenlosen Tarife bieten keine verwalteten Backups; der Testnet-Vertragszustand ist aus dem öffentlichen Ledger wiederherstellbar].',
      ],
      [
        {
          b: ['Trennung der Umgebungen:'],
        },
        ' die nutzerseitige Demo, eine separate Staging-Umgebung und wegwerfbare Datenbankkopien werden getrennt gehalten, damit Tests die Demo nicht beschädigen können.',
      ],
      [
        {
          b: ['Wenn die Demo nicht verfügbar ist:'],
        },
        ' verliert kein Nutzer etwas von Wert. Der Kampagnenzustand bleibt auf öffentlichen Stellar-Testnet-Explorern lesbar, und Beiträge unterliegen weiterhin dem Vertrag, nicht dieser Website.',
      ],
    ],
  },
  {
    t: 'h2',
    text: ['2. Beabsichtigter Kontinuitätsplan für eine autorisierte Plattform (nicht live)'],
  },
  {
    t: 'p',
    text: [
      'Eine echte Plattform mit regulierten Angeboten bräuchte vor dem Start: dokumentierte Recovery-Time- und Recovery-Point-Ziele [RTO/RPO-Werte mit Rechts- und Infrastrukturberatung festzulegen]; verwaltete Backups mit getesteten Wiederherstellungsverfahren; eine Zahlungsdienste-Vereinbarung, bei der Kundengelder nie von der Plattform gehalten werden, sodass ein Plattformausfall Anlegergelder nicht blockieren kann; einen geordneten Abwicklungsplan, der sicherstellt, dass laufende Kampagnen abgeschlossen oder erstattet werden können, wenn die Plattform den Betrieb einstellt; sowie Kommunikationsverfahren für nutzerbetreffende Vorfälle.',
    ],
  },
  {
    t: 'p',
    text: ['Nichts davon ist heute operativ. Die Veröffentlichung als Vorlage hält die beabsichtigte Compliance-Oberfläche sichtbar und prüfbar.'],
  },
  {
    t: 'h2',
    text: ['3. Kontakt bei Vorfällen'],
  },
  {
    t: 'p',
    text: [
      'Um einen Sicherheits- oder Verfügbarkeitsvorfall zu melden, der den Prototyp betrifft: ',
      {
        v: 'contactEmail',
      },
      ', Betreff "Incident".',
    ],
  },
];
