// Never expose upstream response bodies, SQL diagnostics or SDK dumps.
// Only known stable simulation codes are safe for client-side localization.
const SIMULATION_CODES = new Set(['SIM_TRUSTLINE_MISSING', 'SIM_ACCOUNT_MISSING', 'SIM_INSUFFICIENT_BALANCE', 'SIM_REJECTED']);
export function publicFailure(error: unknown, fallbackCode = 'API_UNAVAILABLE'): { error: string; code: string } {
  const code = error && typeof error === 'object' && 'code' in error ? (error as { code?: unknown }).code : undefined;
  return {
    error: 'The request could not be completed. Please try again later.',
    code: typeof code === 'string' && SIMULATION_CODES.has(code) ? code : fallbackCode,
  };
}
