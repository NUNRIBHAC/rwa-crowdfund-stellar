import type { LegalBlock } from './types';

export const blocks: LegalBlock[] = [
  {
    t: 'notice',
    text: [
      'Testnet prototype privacy notice, updated 3 November 2026. This describes actual account processing; it is not legal advice or evidence of regulatory authorisation. No real-money operations are enabled.',
    ],
  },
  {
    t: 'h2',
    text: ['1. Responsible person and contact'],
  },
  {
    t: 'p',
    text: [
      'Nuno Ribeiro is the data controller responsible for personal data processed by the Blockallisto testnet prototype. Contact for privacy requests: blockallisto@gmail.com. Blockallisto is a project name, not a claim of a registered company. Fictional company particulars on other DEMO legal templates do not identify the controller for account data.',
    ],
  },
  {
    t: 'h2',
    text: ['2. Account and community data'],
  },
  {
    t: 'p',
    text: [
      'Email/password registration stores your normalized email address, a salted scrypt password hash, account identifier, preferred email language, verification status, timestamps and failed-login/lockout records in the community database. We do not store your password in plain text. Verification and reset tokens are hashed and single-use: verification links expire after 24 hours and reset links after one hour. An email account receives an internal public-key identifier; its generated private key is discarded. This does not give it a wallet capable of signing blockchain transactions.',
    ],
  },
  {
    t: 'p',
    text: [
      'Wallet sign-in remains optional and uses a single-use signed challenge valid for five minutes. When a configured social sign-in provider is available, we store its provider name, stable subject identifier, verified email if returned, and login timestamps; we do not automatically merge accounts by email. New social registration may remain restricted separately from email/password registration. Your email is not used as a public comment author label.',
    ],
  },
  {
    t: 'p',
    text: [
      'Session tokens are hashed on the server; the browser keeps the session token in local storage. Sessions last up to 30 days and can be revoked. If you enable an authenticator second factor, its seed is encrypted server-side and recovery codes are stored as hashes. Password reset revokes sessions and pending second-factor login tickets but does not remove an enrolled second factor.',
    ],
  },
  {
    t: 'p',
    text: [
      'Account records, email credentials and optional second-factor data currently have no automatic account-deletion timer. Expired tokens stop working at expiry, but expiry does not guarantee immediate removal of their stored records. There is no self-service account-deletion tool yet. Ask blockallisto@gmail.com for access, correction or deletion; requests are reviewed against security and legal obligations. Provider logs and backups may have separate retention.',
    ],
  },
  {
    t: 'p',
    text: [
      'Comments (public-key identifier, optional display name, text, campaign and timestamp) are public. The latest 100 per campaign are displayed; hidden comments are deleted after 30 days. Support/feedback tickets, issuer applications and notifications are private to the account and authorised operator roles and are deleted after 90 days by the application cleanup rules. Avoid sensitive personal information in free-text fields.',
    ],
  },
  {
    t: 'h2',
    text: ['3. Test transactions and device data'],
  },
  {
    t: 'p',
    text: [
      'Connecting a wallet or preparing test contributions records public wallet keys, campaign identifiers, amounts, transaction envelopes, hashes, status and timestamps in the safety journal. Unsigned preparations expire after 24 hours; final transactions are pruned after 30 days. Unresolved signed transactions remain until resolved and signed envelopes are scrubbed after finality. Public Stellar testnet records cannot be erased by us. Wallet secret keys stay in your wallet.',
    ],
  },
  {
    t: 'p',
    text: [
      'Theme, language and session choices use browser local storage. Hosting providers process IP addresses and request metadata. Application rate limiting and IP-reputation caching use IP addresses in transient memory; application diagnostics use aggregate counters rather than raw-IP logs. Provider infrastructure logs and backup retention are separate. We do not use advertising trackers or newsletter mailing lists.',
    ],
  },
  {
    t: 'h2',
    text: ['4. Security services and recipients'],
  },
  {
    t: 'p',
    text: [
      'Render hosts the app in Frankfurt and Neon hosts its Postgres data. Brevo receives recipient email addresses and verification/reset email content and processes delivery metadata. Cloudflare Turnstile processes browser/device signals and challenge tokens for bot checks; server validation may include the client IP. After a successful bot check, ipapi.is receives the client IP for abuse-reputation assessment. Reputation is initially observation-only; VPN, proxy or Tor status alone is not a blocking reason. Provider errors or lookup-budget exhaustion may reduce this layer; CAPTCHA, rate limits and mail budgets are separate safeguards.',
    ],
  },
  {
    t: 'p',
    text: [
      'Where social sign-in is enabled, the chosen identity provider processes that authentication under its own terms. Stellar testnet is public and global. GitHub hosts source code, not the account database. Security and email providers may process data outside the EEA; do not assume every processor is EU-only. Their current policies and applicable safeguards govern their own processing: https://www.brevo.com/legal/privacypolicy/ ; https://www.cloudflare.com/privacypolicy/ ; https://ipapi.is/privacy.html ; https://ipapi.is/terms.html .',
    ],
  },
  {
    t: 'h2',
    text: ['5. Purpose and rights'],
  },
  {
    t: 'p',
    text: [
      'Data is used to provide the requested prototype account and community features, verify account access, answer support requests and protect the service against abuse. These operational and security purposes rely on legitimate interests under Article 6(1)(f) GDPR, subject to your rights and the assessment required by law. This notice does not certify compliance or replace legal review. We do not sell account data or use it for advertising.',
    ],
  },
  {
    t: 'p',
    text: [
      'You can request access, correction, deletion, restriction, portability or object to processing by writing to blockallisto@gmail.com. You may complain to the Portuguese CNPD or your competent supervisory authority. Public blockchain records cannot be deleted by the operator. The prototype is not directed at children. Identity-document/KYC collection, live investment offerings, fiat payments and real-money operations are not enabled. Any later change requires a new notice before that processing starts.',
    ],
  },
];
