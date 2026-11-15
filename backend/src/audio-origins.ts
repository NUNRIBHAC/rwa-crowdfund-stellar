// Exact audio origins only. No wildcard, credentials, path or implicit HTTPS
// blanket. Deployment must separately approve the configured external hosts.
export function audioOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const values = (env.COMMUNITY_AUDIO_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return [
    ...new Set(
      values.map((value) => {
        const url = new URL(value);
        if (url.protocol !== 'https:' || url.origin !== value || url.username || url.password || url.hostname.includes('*'))
          throw new Error('Invalid audio origin');
        return value;
      }),
    ),
  ];
}
export function audioUrlAllowed(value: string, env: NodeJS.ProcessEnv = process.env): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && audioOrigins(env).includes(url.origin);
  } catch {
    return false;
  }
}
