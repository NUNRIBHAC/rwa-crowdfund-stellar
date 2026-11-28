import { Router } from 'express';
import { emptyTrustEvidence, validateTrustEvidence } from './trust-evidence.js';

// Deliberately no configuration or write route. Published operator evidence needs
// a separately reviewed source pipeline, not arbitrary URLs or request input.
export function trustEvidenceRouter(clock: () => Date = () => new Date()) {
  const router = Router();
  router.get('/api/transparency/evidence', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    try {
      const asOf = clock().toISOString().slice(0, 10);
      const criteria = validateTrustEvidence(emptyTrustEvidence('platform'), asOf);
      res.json({
        schemaVersion: 1,
        asOf,
        scope: 'platform',
        productionEligible: false,
        evidenceComplete: false,
        criteria,
      });
    } catch {
      res.status(503).json({ code: 'API_UNAVAILABLE' });
    }
  });
  return router;
}
