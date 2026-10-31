export async function api(url: string, body?: unknown) {
  const r = await fetch(url, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  const v = await r.json();
  if (!r.ok) {
    // Stable machine codes let the UI localize known failures without parsing text.
    throw Object.assign(new Error(v.error ?? 'API request failed'), { code: v.code as string | undefined });
  }
  return v;
}
