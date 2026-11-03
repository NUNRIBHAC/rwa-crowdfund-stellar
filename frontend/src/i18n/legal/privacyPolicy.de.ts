import type { LegalBlock } from './types';

export const blocks: LegalBlock[] = [
  {
    t: 'notice',
    text: [
      'Datenschutzhinweis zum Testnet-Prototyp, aktualisiert am 3. November 2026. Er beschreibt die tatsächliche Verarbeitung von Kontodaten; er ist weder Rechtsberatung noch ein Nachweis einer behördlichen Zulassung. Es sind keine Echtgeld-Vorgänge aktiviert.',
    ],
  },
  {
    t: 'h2',
    text: ['1. Verantwortlicher und Kontakt'],
  },
  {
    t: 'p',
    text: [
      'Nuno Ribeiro ist der Verantwortliche für die personenbezogenen Daten, die der Blockallisto-Testnet-Prototyp verarbeitet. Kontakt für Datenschutzanfragen: blockallisto@gmail.com. Blockallisto ist ein Projektname und keine Behauptung, dass ein eingetragenes Unternehmen besteht. Fiktive Unternehmensangaben in anderen DEMO-Rechtsvorlagen bezeichnen nicht den Verantwortlichen für Kontodaten.',
    ],
  },
  {
    t: 'h2',
    text: ['2. Konto- und Community-Daten'],
  },
  {
    t: 'p',
    text: [
      'Die Registrierung per E-Mail und Passwort speichert in der Community-Datenbank Ihre normalisierte E-Mail-Adresse, einen gesalzenen scrypt-Passwort-Hash, die Konto-ID, die bevorzugte E-Mail-Sprache, den Verifizierungsstatus, Zeitstempel sowie Protokolle zu fehlgeschlagenen Anmeldungen und Sperren. Wir speichern Ihr Passwort nicht im Klartext. Verifizierungs- und Rücksetz-Tokens werden gehasht und sind nur einmal verwendbar: Verifizierungslinks laufen nach 24 Stunden ab, Rücksetzlinks nach einer Stunde. Ein E-Mail-Konto erhält eine interne Kennung für einen öffentlichen Schlüssel; der erzeugte private Schlüssel wird verworfen. Dadurch erhält es keine Wallet, die Blockchain-Transaktionen signieren kann.',
    ],
  },
  {
    t: 'p',
    text: [
      'Die Anmeldung per Wallet bleibt optional und nutzt eine einmal verwendbare, signierte Challenge mit fünf Minuten Gültigkeit. Wenn ein konfigurierter Anbieter für die Anmeldung über soziale Konten verfügbar ist, speichern wir dessen Namen, die stabile Subjekt-Kennung, die verifizierte E-Mail-Adresse, sofern sie zurückgegeben wird, und Anmeldezeitstempel; Konten werden nicht automatisch per E-Mail zusammengeführt. Die neue Registrierung über soziale Konten kann getrennt von der Registrierung per E-Mail und Passwort eingeschränkt bleiben. Ihre E-Mail-Adresse wird nicht als Autorenbezeichnung öffentlicher Kommentare verwendet.',
    ],
  },
  {
    t: 'p',
    text: [
      'Sitzungs-Tokens werden serverseitig gehasht; der Browser speichert das Sitzungs-Token im lokalen Speicher. Sitzungen dauern bis zu 30 Tage und können widerrufen werden. Wenn Sie einen zweiten Faktor per Authenticator-App aktivieren, wird dessen Seed serverseitig verschlüsselt und Wiederherstellungscodes werden als Hashes gespeichert. Ein Passwort-Reset widerruft Sitzungen und ausstehende Anmelde-Tickets des zweiten Faktors, entfernt aber keinen bereits eingerichteten zweiten Faktor.',
    ],
  },
  {
    t: 'p',
    text: [
      'Für Kontodatensätze, E-Mail-Zugangsdaten und optionale Daten des zweiten Faktors gibt es derzeit keine automatische Frist zur Kontolöschung. Abgelaufene Tokens funktionieren nach Ablauf nicht mehr, doch der Ablauf garantiert nicht die sofortige Entfernung ihrer gespeicherten Datensätze. Ein Selbstbedienungs-Werkzeug zur Kontolöschung gibt es noch nicht. Schreiben Sie an blockallisto@gmail.com, um Auskunft, Berichtigung oder Löschung zu beantragen; Anträge werden anhand von Sicherheits- und Rechtspflichten geprüft. Protokolle und Backups der Anbieter können gesondert aufbewahrt werden.',
    ],
  },
  {
    t: 'p',
    text: [
      'Kommentare (Kennung des öffentlichen Schlüssels, optionaler Anzeigename, Text, Kampagne und Zeitstempel) sind öffentlich. Angezeigt werden die neuesten 100 pro Kampagne; ausgeblendete Kommentare werden nach 30 Tagen gelöscht. Support- und Feedback-Tickets, Emittentenanträge und Benachrichtigungen sind nur für das Konto und autorisierte Betreiberrollen sichtbar und werden nach den Bereinigungsregeln der Anwendung nach 90 Tagen gelöscht. Vermeiden Sie sensible personenbezogene Angaben in Freitextfeldern.',
    ],
  },
  {
    t: 'h2',
    text: ['3. Testtransaktionen und Gerätedaten'],
  },
  {
    t: 'p',
    text: [
      'Beim Verbinden einer Wallet oder Vorbereiten von Testbeiträgen werden im Sicherheitsjournal öffentliche Wallet-Schlüssel, Kampagnenkennungen, Beträge, Transaktionsumschläge, Hashes, Status und Zeitstempel erfasst. Unsignierte Vorbereitungen laufen nach 24 Stunden ab; abgeschlossene Transaktionen werden nach 30 Tagen bereinigt. Ungeklärte signierte Transaktionen bleiben bis zur Klärung bestehen, und signierte Umschläge werden nach der Finalität gelöscht. Öffentliche Stellar-Testnet-Einträge können wir nicht löschen. Geheime Wallet-Schlüssel bleiben in Ihrer Wallet.',
    ],
  },
  {
    t: 'p',
    text: [
      'Design, Sprache und Sitzungsauswahl nutzen den lokalen Speicher des Browsers. Hosting-Anbieter verarbeiten IP-Adressen und Anfragemetadaten. Die Ratenbegrenzung der Anwendung und das Zwischenspeichern der IP-Reputation verwenden IP-Adressen im flüchtigen Speicher; die Anwendungsdiagnose nutzt aggregierte Zähler statt Roh-IP-Protokolle. Infrastrukturprotokolle der Anbieter und die Aufbewahrung von Backups sind davon getrennt. Wir verwenden keine Werbe-Tracker und keine Newsletter-Verteiler.',
    ],
  },
  {
    t: 'h2',
    text: ['4. Sicherheitsdienste und Empfänger'],
  },
  {
    t: 'p',
    text: [
      'Render hostet die Anwendung in Frankfurt und Neon hostet die Postgres-Daten. Brevo erhält die E-Mail-Adressen der Empfänger sowie den Inhalt der Verifizierungs- und Rücksetz-E-Mails und verarbeitet Zustellmetadaten. Cloudflare Turnstile verarbeitet Browser- und Gerätesignale sowie Challenge-Tokens für Bot-Prüfungen; die serverseitige Validierung kann die Client-IP einschließen. Nach einer erfolgreichen Bot-Prüfung erhält ipapi.is die Client-IP zur Bewertung der Missbrauchsreputation. Die Reputation dient zunächst nur der Beobachtung; VPN-, Proxy- oder Tor-Status allein ist kein Grund zur Sperrung. Anbieterfehler oder ein erschöpftes Abfragebudget können diese Ebene schwächen; CAPTCHA, Ratenbegrenzungen und E-Mail-Budgets sind davon getrennte Schutzmaßnahmen.',
    ],
  },
  {
    t: 'p',
    text: [
      'Wo die Anmeldung über soziale Konten aktiviert ist, verarbeitet der gewählte Identitätsanbieter diese Authentifizierung nach seinen eigenen Bedingungen. Das Stellar-Testnet ist öffentlich und global. GitHub hostet den Quellcode, nicht die Kontodatenbank. Sicherheits- und E-Mail-Anbieter können Daten außerhalb des EWR verarbeiten; gehen Sie nicht davon aus, dass jeder Auftragsverarbeiter nur in der EU sitzt. Ihre aktuellen Richtlinien und die geltenden Garantien regeln ihre eigene Verarbeitung: https://www.brevo.com/legal/privacypolicy/ ; https://www.cloudflare.com/privacypolicy/ ; https://ipapi.is/privacy.html ; https://ipapi.is/terms.html .',
    ],
  },
  {
    t: 'h2',
    text: ['5. Zweck und Rechte'],
  },
  {
    t: 'p',
    text: [
      'Die Daten werden verwendet, um die angefragten Konto- und Community-Funktionen des Prototyps bereitzustellen, den Kontozugang zu verifizieren, Supportanfragen zu beantworten und den Dienst vor Missbrauch zu schützen. Diese betrieblichen und sicherheitsbezogenen Zwecke beruhen auf berechtigten Interessen nach Art. 6 Abs. 1 Buchst. f DSGVO, vorbehaltlich Ihrer Rechte und der gesetzlich erforderlichen Prüfung. Dieser Hinweis bescheinigt keine Konformität und ersetzt keine Rechtsprüfung. Wir verkaufen keine Kontodaten und verwenden sie nicht für Werbung.',
    ],
  },
  {
    t: 'p',
    text: [
      'Sie können Auskunft, Berichtigung, Löschung, Einschränkung oder Übertragbarkeit verlangen oder der Verarbeitung widersprechen, indem Sie an blockallisto@gmail.com schreiben. Sie können sich bei der portugiesischen CNPD oder Ihrer zuständigen Aufsichtsbehörde beschweren. Öffentliche Blockchain-Einträge kann der Betreiber nicht löschen. Der Prototyp richtet sich nicht an Kinder. Die Erhebung von Ausweisdokumenten und KYC, echte Anlageangebote, Zahlungen in Fiat-Währung und Echtgeld-Vorgänge sind nicht aktiviert. Jede spätere Änderung erfordert einen neuen Hinweis, bevor diese Verarbeitung beginnt.',
    ],
  },
];
