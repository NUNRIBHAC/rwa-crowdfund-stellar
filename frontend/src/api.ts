export async function api(url: string, body?: unknown) {
  const r = await fetch(url, body
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : undefined);
  const v = await r.json();
  if (!r.ok) throw new Error(v.error ?? 'API request failed');
  return v;
}
