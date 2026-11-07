import { walletDeletionEvidenceVerdict, type WalletHistorySources } from './deletion-history-snapshot.js';

export type WalletVerdict = 'clear' | 'protected' | 'unavailable';

// A verdict older than this never authorizes a deletion mutation: the
// journal, pending proofs, archive and manifest it was computed from may
// have moved since.
export const WALLET_VERDICT_MAX_AGE_MS = 30_000;

type Head = { sequence: number; verdict: WalletVerdict; at: number };

export type WalletDeletionWiring = {
  check: (publicKey: string) => Promise<WalletVerdict>;
  recheck: (publicKey: string) => WalletVerdict;
};

// Prepared adapter between the composed wallet evidence verdict and the
// account deletion final mutation. The hosted router does NOT inject this
// adapter: no server route passes it, so hosted wallet deletion stays
// unavailable. Activating it is a separate held decision that needs its own
// full gate and explicit authorization.
//
// Verdict computation is serialized per owner, so 'latest' is well defined.
// The final mutation re-checks inside its serialized store change: it reads
// the latest completed verdict (never a cached older one) and refuses when
// none exists, when it aged out, or when it is anything but clear. Unknown
// or throwing evidence always becomes unavailable, never clear.
//
// Honest residual: the journal, pending-proof, archive and manifest inputs
// live outside the community store's mutation lock, so evidence can still
// drift inside the freshness window. Closing that needs a cross-store
// serialized boundary and remains an open precondition for any activation.
export function walletDeletionWiring(computeVerdict: (publicKey: string) => Promise<WalletVerdict>, now: () => number = Date.now): WalletDeletionWiring {
  const chains = new Map<string, Promise<unknown>>();
  const heads = new Map<string, Head>();
  return {
    check(publicKey) {
      const run = (chains.get(publicKey) ?? Promise.resolve()).then(async (): Promise<WalletVerdict> => {
        let verdict: WalletVerdict;
        try {
          verdict = await computeVerdict(publicKey);
        } catch {
          verdict = 'unavailable';
        }
        // External results are never trusted beyond the known verdict set.
        if (verdict !== 'clear' && verdict !== 'protected') verdict = 'unavailable';
        const head = heads.get(publicKey);
        heads.set(publicKey, { sequence: (head?.sequence ?? 0) + 1, verdict, at: now() });
        return verdict;
      });
      chains.set(
        publicKey,
        run.catch(() => {}),
      );
      return run;
    },
    recheck(publicKey) {
      const head = heads.get(publicKey);
      if (!head) return 'unavailable';
      if (now() - head.at > WALLET_VERDICT_MAX_AGE_MS) return 'unavailable';
      return head.verdict;
    },
  };
}

// Bind the real evidence composer. Kept separate from the generic adapter so
// tests can substitute a verdict function without fabricating chain sources.
export function prepareWalletDeletionWiring(sources: WalletHistorySources, now: () => number = Date.now): WalletDeletionWiring {
  return walletDeletionWiring((publicKey) => walletDeletionEvidenceVerdict(publicKey, sources), now);
}
