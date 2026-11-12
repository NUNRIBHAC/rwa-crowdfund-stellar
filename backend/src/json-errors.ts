import type { ErrorRequestHandler, RequestHandler } from 'express';

export const apiNotFound: RequestHandler = (req, res, next) => {
  // The production host mounts static assets and SPA routes after the API.
  // Match the API boundary exactly, leaving /apiary and page paths alone.
  if (req.path !== '/api' && !req.path.startsWith('/api/')) return next();
  res.status(404).json({ error: 'not found', code: 'not_found' });
};

export const jsonErrors: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) return next(error);
  const type = error && typeof error === 'object' && 'type' in error ? error.type : undefined;
  if (type === 'entity.too.large') {
    res.status(413).json({ error: 'request too large', code: 'body_too_large' });
  } else if (type === 'entity.parse.failed') {
    res.status(400).json({ error: 'invalid JSON body', code: 'invalid_input' });
  } else {
    console.error(JSON.stringify({ event: 'api.unexpected_error', code: 'internal_error' }));
    res.status(500).json({ error: 'internal error', code: 'internal_error' });
  }
};
