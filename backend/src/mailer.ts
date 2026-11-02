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
//   "brevo"         -> Brevo transactional API (free tier: 300 emails/day,
//                      no card, sender can be an individually verified
//                      address - no domain purchase required). Needs
//                      BREVO_API_KEY and COMMUNITY_EMAIL_FROM (a sender
//                      verified in the Brevo account); missing either fails
//                      closed with 503, never a pretend-send.

export interface Mailer {
  send(message: { to: string; subject: string; text: string }): Promise<void>;
}

// Guard failure: carries the HTTP status + stable localization code like
// AuthError/CommunityError (sendError maps all three the same way).
export class MailerError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
  }
}

// Controlled-test guard: COMMUNITY_EMAIL_ALLOWED_RECIPIENTS is a
// comma-separated allowlist of recipient addresses. While it is set, a send
// to any other address fails BEFORE the provider is called - no real email
// can leave the platform to an unapproved recipient, and the caller gets an
// honest 503 instead of a pretend send. Unset means unrestricted (a
// deliberate operator decision, not the default during controlled tests).
export class AllowlistMailer implements Mailer {
  constructor(
    private readonly inner: Mailer,
    private readonly allowed: ReadonlySet<string>,
  ) {}

  async send(message: { to: string; subject: string; text: string }): Promise<void> {
    const to = message.to.trim().toLowerCase();
    if (!this.allowed.has(to)) {
      throw new MailerError(503, 'email delivery to this recipient is not allowed on this deployment', 'email_recipient_restricted');
    }
    return this.inner.send(message);
  }
}

export function allowedRecipientsFromEnv(env: NodeJS.ProcessEnv = process.env): Set<string> | null {
  const raw = (env.COMMUNITY_EMAIL_ALLOWED_RECIPIENTS ?? '').trim();
  if (!raw) return null;
  const list = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
  return list.length > 0 ? new Set(list) : null;
}

export class LogMailer implements Mailer {
  async send(message: { to: string; subject: string; text: string }): Promise<void> {
    // Full body on purpose: this provider exists so a demo operator can pull
    // the verification link out of the hosting logs.
    console.warn(`[log-mailer] DEMO ONLY - email to=${message.to} subject=${JSON.stringify(message.subject)}\n${message.text}`);
  }
}

// Brevo transactional email API v3. The API key is a secret: it comes from
// the environment and is never logged; send failures surface status and a
// truncated, key-free body only.
export class BrevoMailer implements Mailer {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly endpoint = 'https://api.brevo.com/v3/smtp/email',
  ) {}

  async send(message: { to: string; subject: string; text: string }): Promise<void> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({
        sender: { email: this.from },
        to: [{ email: message.to }],
        subject: message.subject,
        textContent: message.text,
      }),
    });
    if (!res.ok) {
      const body = (await res.text().catch(() => '')).slice(0, 200);
      throw new Error(`email provider rejected the send (${res.status}): ${body}`);
    }
  }
}

export function mailerFromEnv(env: NodeJS.ProcessEnv = process.env): Mailer | null {
  const provider = (env.COMMUNITY_EMAIL_PROVIDER ?? '').trim().toLowerCase();
  if (!provider) return null;
  const allowed = allowedRecipientsFromEnv(env);
  const wrap = (m: Mailer): Mailer => (allowed ? new AllowlistMailer(m, allowed) : m);
  if (provider === 'log') return wrap(new LogMailer());
  if (provider === 'brevo') {
    const apiKey = (env.BREVO_API_KEY ?? '').trim();
    const from = (env.COMMUNITY_EMAIL_FROM ?? '').trim();
    if (!apiKey || !from) {
      // Fail closed, loudly: a half-configured provider must surface as 503,
      // not as a silent or pretend delivery.
      console.warn('[mailer] COMMUNITY_EMAIL_PROVIDER=brevo but BREVO_API_KEY or COMMUNITY_EMAIL_FROM is missing; outbound email disabled');
      return null;
    }
    return wrap(new BrevoMailer(apiKey, from));
  }
  // Unknown provider name: fail closed, loudly.
  console.warn(`[mailer] unknown COMMUNITY_EMAIL_PROVIDER=${JSON.stringify(provider)}; outbound email disabled`);
  return null;
}
