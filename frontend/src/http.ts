import { localizedApiError } from './i18n';
// Stable codes only. Unknown server diagnostics are never user-facing text.
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
  ) {
    super(message);
  }
}

export async function responseCall<T>(url: string, init: RequestInit, decode: (response: Response) => Promise<T>): Promise<T> {
  const read = !init.method || ['GET', 'HEAD'].includes(init.method.toUpperCase());
  const controller = read ? new AbortController() : undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const signal = init.signal;
  const abort = () => controller?.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  try {
    const work = (async () => {
      const response = await fetch(url, { ...init, ...(controller ? { signal: controller.signal } : {}) });
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        const code = payload && typeof payload === 'object' && 'code' in payload && typeof payload.code === 'string' ? payload.code : undefined;
        throw new ApiError(localizedApiError(code), code, response.status);
      }
      return decode(response);
    })();
    if (!read) return await work; // Never time out or automatically retry a mutation.
    return await Promise.race([
      work,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          controller?.abort();
          reject(new ApiError(localizedApiError('API_UNAVAILABLE'), 'API_UNAVAILABLE'));
        }, 20000);
      }),
    ]);
  } catch (error) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (error instanceof ApiError) throw error;
    const code = read ? 'API_UNAVAILABLE' : 'API_UNCONFIRMED';
    throw new ApiError(localizedApiError(code), code);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
