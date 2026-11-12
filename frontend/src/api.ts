import { responseCall } from './http';
export async function api(url: string, body?: unknown): Promise<any> {
  return responseCall(
    url,
    body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    async (response) => {
      const value: unknown = await response.json();
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid API object');
      return value;
    },
  );
}
