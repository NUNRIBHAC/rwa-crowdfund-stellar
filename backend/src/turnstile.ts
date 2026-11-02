// Cloudflare Turnstile bot-challenge verification (siteverify).
//
// Enabled only when TURNSTILE_SECRET_KEY is set. When enabled, the
// mail-triggering routes require a valid token and FAIL CLOSED: a deployment
// that opted into bot protection must not silently drop it. When the env var
// is absent the check is disabled entirely and routes behave as before.
//
// Sources: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
// - tokens are single-use and valid for 300 seconds
// - idempotency_key makes a retried validation safe

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const VERIFY_TIMEOUT_MS = 5000;
const MAX_TOKEN_LENGTH = 2048;

export interface TurnstileConfig {
  secretKey: string;
}

export function turnstileConfigFromEnv(env: NodeJS.ProcessEnv = process.env): TurnstileConfig | null {
  const secretKey = env.TURNSTILE_SECRET_KEY?.trim();
  return secretKey ? { secretKey } : null;
}

export type TurnstileFailure = 'missing-token' | 'rejected' | 'verify-unavailable';

export async function verifyTurnstileToken(
  config: TurnstileConfig,
  token: unknown,
  remoteip?: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: true } | { ok: false; reason: TurnstileFailure; errorCodes: string[] }> {
  if (typeof token !== 'string' || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    return { ok: false, reason: 'missing-token', errorCodes: [] };
  }
  try {
    const res = await fetchImpl(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        secret: config.secretKey,
        response: token,
        ...(remoteip ? { remoteip } : {}),
        idempotency_key: crypto.randomUUID(),
      }),
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    });
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (data.success === true) return { ok: true };
    return { ok: false, reason: 'rejected', errorCodes: data['error-codes'] ?? [] };
  } catch {
    return { ok: false, reason: 'verify-unavailable', errorCodes: [] };
  }
}
