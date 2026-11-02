// Outbound email for the demo platform (verification, and later password
// reset). Delivery is FAIL-CLOSED: with no provider configured the mailer
// is null and routes answer 503 - the API never pretends an email was sent.
//
// Providers:
//   unset / empty   -> not configured (503 at the route)
//   "log"           -> explicit demo opt-in: writes the full message to the
//                      server log. Anyone with hosting log access can read
//                      verification tokens, so this is for demo/staging only,
//                      never a substitute for a real provider.
// A transactional provider (SES/Resend/Postmark/...) is a separate,
// authority-gated step: credentials, sender domain and spend are all
// production decisions, not defaults this module may assume.

export interface Mailer {
  send(message: { to: string; subject: string; text: string }): Promise<void>;
}

export class LogMailer implements Mailer {
  async send(message: { to: string; subject: string; text: string }): Promise<void> {
    // Full body on purpose: this provider exists so a demo operator can pull
    // the verification link out of the hosting logs.
    console.warn(`[log-mailer] DEMO ONLY - email to=${message.to} subject=${JSON.stringify(message.subject)}\n${message.text}`);
  }
}

export function mailerFromEnv(env: NodeJS.ProcessEnv = process.env): Mailer | null {
  const provider = (env.COMMUNITY_EMAIL_PROVIDER ?? '').trim().toLowerCase();
  if (!provider) return null;
  if (provider === 'log') return new LogMailer();
  // Unknown provider name: fail closed, loudly.
  console.warn(`[mailer] unknown COMMUNITY_EMAIL_PROVIDER=${JSON.stringify(provider)}; outbound email disabled`);
  return null;
}
