import { describe, expect, it } from 'vitest';
import {
  builderComplete,
  builderPreview,
  deadlineToTimestamp,
  GOAL_UNITS_MAX,
  goalToUnits,
  runBuilderDeploy,
  validateBuilder,
  validateV2Builder,
  v2BuilderComplete,
} from './campaign-builder';

// Fixed reference instant: 2026-11-15T12:00:00Z.
const NOW = Math.floor(Date.parse('2026-11-15T12:00:00Z') / 1000);

describe('goalToUnits', () => {
  it('parses exact decimal strings into 7-decimal base units', () => {
    expect(goalToUnits('10000')).toBe(10000n * 10_000_000n);
    expect(goalToUnits('0.0000001')).toBe(1n);
    expect(goalToUnits('1.5')).toBe(15_000_000n);
  });
  it('parses amounts beyond float precision without rounding', () => {
    // 9007199254.740993 is past 2^53 as a float product; the string parse
    // must keep the last digit exact.
    expect(goalToUnits('9007199254.740993')).toBe(90071992547409930n);
  });
  it('rejects non-positive, over-precise and malformed amounts', () => {
    expect(goalToUnits('0')).toBeNull();
    expect(goalToUnits('0.00000001')).toBeNull(); // 8 decimal places
    expect(goalToUnits('-5')).toBeNull();
    expect(goalToUnits('abc')).toBeNull();
    expect(goalToUnits('')).toBeNull();
    expect(goalToUnits('1.')).toBeNull();
  });
});

describe('goal i128 range (constructor takes goal: i128)', () => {
  it('accepts exactly the i128 maximum and rejects one unit above', () => {
    const maxGoal = (GOAL_UNITS_MAX / 10_000_000n).toString() + '.' + (GOAL_UNITS_MAX % 10_000_000n).toString().padStart(7, '0');
    const overGoal = ((GOAL_UNITS_MAX + 1n) / 10_000_000n).toString() + '.' + ((GOAL_UNITS_MAX + 1n) % 10_000_000n).toString().padStart(7, '0');
    expect(goalToUnits(maxGoal)).toBe(GOAL_UNITS_MAX);
    expect(goalToUnits(overGoal)).toBe(GOAL_UNITS_MAX + 1n);
    const base = { name: 'P', slug: 'p', deadline: '2026-11-16' };
    expect(validateBuilder({ ...base, goal: maxGoal }, NOW).goal).toBeUndefined();
    expect(validateBuilder({ ...base, goal: overGoal }, NOW).goal).toBe('goalOutOfRange');
    expect(builderComplete({ ...base, goal: maxGoal }, NOW, 'GCREATOR')).toBe(true);
    expect(builderComplete({ ...base, goal: overGoal }, NOW, 'GCREATOR')).toBe(false);
  });
});

describe('deadlineToTimestamp', () => {
  it('interprets a date as 00:00 UTC regardless of timezone', () => {
    expect(deadlineToTimestamp('2026-12-31')).toBe(Date.parse('2026-12-31T00:00:00Z') / 1000);
  });
  it('rejects malformed dates', () => {
    expect(deadlineToTimestamp('31/12/2026')).toBeNull();
    expect(deadlineToTimestamp('2026-13-01')).toBeNull();
  });
});

describe('validateBuilder boundaries', () => {
  it('rejects today (00:00 UTC already past) and accepts tomorrow', () => {
    const base = { name: 'P', slug: 'p', goal: '1', deadline: '' };
    expect(validateBuilder({ ...base, deadline: '2026-11-15' }, NOW).deadline).toBe('deadlinePast');
    expect(validateBuilder({ ...base, deadline: '2026-11-14' }, NOW).deadline).toBe('deadlinePast');
    expect(validateBuilder({ ...base, deadline: '2026-11-16' }, NOW).deadline).toBeUndefined();
  });
  it('enforces the registry slug and name rules', () => {
    const base = { name: 'P', slug: 'ok-slug_1', goal: '1', deadline: '2026-11-16' };
    expect(validateBuilder({ ...base, slug: 'has space' }, NOW).slug).toBe('slugInvalid');
    expect(validateBuilder({ ...base, slug: 'x'.repeat(49) }, NOW).slug).toBe('slugInvalid');
    expect(validateBuilder({ ...base, slug: 'x'.repeat(48) }, NOW).slug).toBeUndefined();
    expect(validateBuilder({ ...base, name: 'n'.repeat(121) }, NOW).name).toBe('nameTooLong');
    expect(validateBuilder({ ...base, name: 'n'.repeat(120) }, NOW).name).toBeUndefined();
    // Empty optional fields are not errors until filled.
    expect(validateBuilder({ name: '', slug: '', goal: '', deadline: '' }, NOW)).toEqual({});
  });
});

describe('builderComplete and builderPreview', () => {
  const good = { name: 'Solar park', slug: 'solar-park', goal: '10000', deadline: '2026-12-31' };
  it('requires every field plus a connected creator', () => {
    expect(builderComplete(good, NOW, null)).toBe(false);
    expect(builderComplete(good, NOW, 'GCREATOR')).toBe(true);
    expect(builderComplete({ ...good, goal: '0' }, NOW, 'GCREATOR')).toBe(false);
    expect(builderComplete({ ...good, deadline: '2026-11-15' }, NOW, 'GCREATOR')).toBe(false);
  });
  it('derives the exact constructor arguments', () => {
    const p = builderPreview(good, 'GCREATOR', 'CTOKEN');
    expect(p.constructorArgs).toEqual({
      creator: 'GCREATOR',
      token: 'CTOKEN',
      goal: '100000000000',
      deadline: Date.parse('2026-12-31T00:00:00Z') / 1000,
    });
    expect(p.registryEntry).toEqual({ id: 'solar-park', name: 'Solar park', contractId: '<assigned at deployment>' });
  });
});

describe('runBuilderDeploy', () => {
  const input = { name: 'Solar Nine', slug: 'solar-nine', goal: '250', deadline: 2000000000 };
  const buildResult = (step: 'upload' | 'create') => ({ xdr: `xdr-${step}`, networkPassphrase: 'Test SDF Network ; September 2015', step });
  it('runs upload then create, signing each envelope once', async () => {
    const signed: string[] = [];
    const steps: string[] = [];
    const result = await runBuilderDeploy(
      input,
      {
        build: async () => buildResult(signed.length === 0 ? 'upload' : 'create'),
        sign: async (xdr) => {
          signed.push(xdr);
          return `signed-${xdr}`;
        },
        submit: async ({ xdr }) =>
          xdr === 'signed-xdr-upload'
            ? { step: 'upload', status: 'SUCCESS', confirmed: true, message: 'uploaded' }
            : {
                step: 'create',
                status: 'SUCCESS',
                confirmed: true,
                contractId: 'CABC',
                registryEntry: { id: 'solar-nine', name: 'Solar Nine', contractId: 'CABC' },
              },
      },
      (s) => steps.push(s),
    );
    expect(result.contractId).toBe('CABC');
    expect(signed).toEqual(['xdr-upload', 'xdr-create']);
    expect(steps).toEqual(['uploaded']);
  });
  it('returns immediately when the first build is already the create step', async () => {
    let builds = 0;
    const result = await runBuilderDeploy(input, {
      build: async () => {
        builds++;
        return buildResult('create');
      },
      sign: async (xdr) => `signed-${xdr}`,
      submit: async () => ({
        step: 'create',
        status: 'SUCCESS',
        confirmed: true,
        contractId: 'CABC',
        registryEntry: { id: 'solar-nine', name: 'Solar Nine', contractId: 'CABC' },
      }),
    });
    expect(builds).toBe(1);
    expect(result.registryEntry?.contractId).toBe('CABC');
  });
  it('refuses to loop forever when every submit looks like an upload', async () => {
    let submits = 0;
    await expect(
      runBuilderDeploy(input, {
        build: async () => buildResult('upload'),
        sign: async (xdr) => `signed-${xdr}`,
        submit: async () => {
          submits++;
          return { step: 'upload', status: 'SUCCESS', confirmed: true };
        },
      }),
    ).rejects.toThrow(/did not reach the create step/);
    expect(submits).toBe(2);
  });
  it('returns an unconfirmed result instead of guessing success', async () => {
    const result = await runBuilderDeploy(input, {
      build: async () => buildResult('create'),
      sign: async (xdr) => `signed-${xdr}`,
      submit: async () => ({ step: 'create', status: 'PENDING', confirmed: false, message: 'check the hash' }),
    });
    expect(result.confirmed).toBe(false);
  });
  it('propagates wallet refusal to sign', async () => {
    await expect(
      runBuilderDeploy(input, {
        build: async () => buildResult('create'),
        sign: async () => {
          throw new Error('user declined');
        },
        submit: async () => ({ step: 'create', status: 'SUCCESS', confirmed: true }),
      }),
    ).rejects.toThrow(/user declined/);
  });
});

describe('validateV2Builder', () => {
  const good = { symbol: 'SOLAR9', decimals: '7', minPerInvestor: '10', maxPerInvestor: '1000' };
  it('accepts a complete, valid v2 parameter set', () => {
    expect(validateV2Builder(good)).toEqual({});
    expect(v2BuilderComplete(good)).toBe(true);
  });
  it('rejects malformed symbols and decimals (mirrors backend validateV2Params)', () => {
    expect(validateV2Builder({ ...good, symbol: 'has space' }).symbol).toBe('symbolInvalid');
    expect(validateV2Builder({ ...good, symbol: 'TOOLONGSYMBOL1' }).symbol).toBe('symbolInvalid');
    expect(validateV2Builder({ ...good, decimals: '19' }).decimals).toBe('decimalsInvalid');
    expect(validateV2Builder({ ...good, decimals: '7.5' }).decimals).toBe('decimalsInvalid');
    expect(v2BuilderComplete({ ...good, decimals: '19' })).toBe(false);
  });
  it('rejects invalid amounts and max below min', () => {
    expect(validateV2Builder({ ...good, minPerInvestor: 'abc' }).minPerInvestor).toBe('amountInvalid');
    expect(validateV2Builder({ ...good, maxPerInvestor: '0' }).maxPerInvestor).toBe('amountInvalid');
    expect(validateV2Builder({ ...good, minPerInvestor: '100', maxPerInvestor: '50' }).maxPerInvestor).toBe('maxBelowMin');
    expect(v2BuilderComplete({ ...good, minPerInvestor: '100', maxPerInvestor: '50' })).toBe(false);
  });
});

describe('runBuilderDeploy v2 chain', () => {
  const input = { name: 'Solar Nine', slug: 'solar-nine', goal: '250', deadline: 2000000000 };
  const V2_STEPS = ['upload-token', 'upload-offering', 'create-token', 'create-offering', 'set-minter'];
  const v2Deps = (opts: { skipUploads?: boolean } = {}) => {
    const signed: string[] = [];
    const confirmed: string[] = [];
    let buildCount = 0;
    const queue = opts.skipUploads ? V2_STEPS.slice(2) : V2_STEPS;
    return {
      signed,
      confirmed,
      get buildCount() {
        return buildCount;
      },
      deps: {
        build: async () => {
          const step = queue[Math.min(buildCount, queue.length - 1)];
          buildCount++;
          return { xdr: `xdr-${step}`, networkPassphrase: 'Test SDF Network ; September 2015', step };
        },
        sign: async (xdr: string) => {
          signed.push(xdr);
          return `signed-${xdr}`;
        },
        submit: async ({ xdr }: { xdr: string }) => {
          const step = xdr.replace('signed-xdr-', '');
          confirmed.push(step);
          if (step === 'set-minter')
            return {
              step,
              status: 'SUCCESS',
              confirmed: true,
              complete: true,
              registryEntry: { id: 'solar-nine', name: 'Solar Nine', contractSet: 'v2', tokenContractId: 'CTOK', offeringContractId: 'COFF' },
            };
          return { step, status: 'SUCCESS', confirmed: true, contractId: step.startsWith('create') ? 'CID' : undefined };
        },
      },
    };
  };
  it('walks the five-step chain, signing each envelope once, and returns the wired registry entry', async () => {
    const steps: string[] = [];
    const h = v2Deps();
    const result = await runBuilderDeploy(input, h.deps, (s) => steps.push(s), 6);
    expect(h.signed).toEqual(V2_STEPS.map((s) => `xdr-${s}`));
    expect(h.confirmed).toEqual(V2_STEPS);
    expect(steps).toEqual(V2_STEPS.slice(0, 4));
    expect(result.registryEntry).toMatchObject({ contractSet: 'v2', tokenContractId: 'CTOK', offeringContractId: 'COFF' });
  });
  it('goes straight to create-token when both Wasms are already on the ledger', async () => {
    const h = v2Deps({ skipUploads: true });
    const result = await runBuilderDeploy(input, h.deps, undefined, 6);
    expect(h.signed).toEqual(['xdr-create-token', 'xdr-create-offering', 'xdr-set-minter']);
    expect(result.complete).toBe(true);
  });
  it('refuses to loop forever when no step ever finishes the chain', async () => {
    let submits = 0;
    await expect(
      runBuilderDeploy(
        input,
        {
          build: async () => ({ xdr: 'xdr-upload-token', networkPassphrase: 'Test SDF Network ; September 2015', step: 'upload-token' }),
          sign: async (xdr: string) => `signed-${xdr}`,
          submit: async () => {
            submits++;
            return { step: 'upload-token', status: 'SUCCESS', confirmed: true };
          },
        },
        undefined,
        6,
      ),
    ).rejects.toThrow(/did not complete within the expected number of steps/);
    expect(submits).toBe(6);
  });
  it('stops at an unconfirmed mid-chain submit instead of guessing success', async () => {
    let builds = 0;
    const result = await runBuilderDeploy(
      input,
      {
        build: async () => {
          builds++;
          return { xdr: 'xdr-create-token', networkPassphrase: 'Test SDF Network ; September 2015', step: 'create-token' };
        },
        sign: async (xdr: string) => `signed-${xdr}`,
        submit: async () => ({ step: 'create-token', status: 'PENDING', confirmed: false, message: 'check the hash' }),
      },
      undefined,
      6,
    );
    expect(result.confirmed).toBe(false);
    expect(builds).toBe(1);
  });
});
