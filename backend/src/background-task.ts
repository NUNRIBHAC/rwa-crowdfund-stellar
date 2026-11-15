// A rejected startup promise is neither fatal nor retried on every request.
// The rejection is handled by the caller; the next allowed call can recover.
export function retryingSingleFlight<T>(run: () => Promise<T>, options: { now?: () => number; retryMs?: number } = {}) {
  let value: Promise<T> | undefined;
  let retryAt = 0;
  let failure: unknown;
  const now = options.now ?? Date.now;
  return (): Promise<T> => {
    if (value) return value;
    if (now() < retryAt) return Promise.reject(failure);
    value = Promise.resolve()
      .then(run)
      .catch((error) => {
        value = undefined;
        failure = error;
        retryAt = now() + (options.retryMs ?? 60_000);
        throw error;
      });
    return value;
  };
}

// No implicit work on test imports. Tests call the runner explicitly with
// fakes. Production keeps the existing cadence, without overlapping ticks or
// leaking a rejected promise from startup/setInterval into the process.
export function backgroundTask(run: () => Promise<void>, onError: (error: unknown) => void) {
  let inFlight: Promise<void> | undefined;
  return (): Promise<void> => {
    if (!inFlight)
      inFlight = Promise.resolve()
        .then(run)
        .catch((error) => {
          try {
            onError(error);
          } catch {
            /* Error reporting must not reject a background timer. */
          }
        })
        .finally(() => {
          inFlight = undefined;
        });
    return inFlight;
  };
}
export function startBackgroundTask(run: () => Promise<void>, intervalMs: number, onError: (error: unknown) => void, env = process.env) {
  if (env.NODE_ENV === 'test') return;
  const tick = backgroundTask(run, onError);
  void tick();
  const timer = setInterval(() => void tick(), intervalMs);
  timer.unref();
  return timer;
}
