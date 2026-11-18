import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyAudit } from '../scripts/audit-filter.mjs';

const picomatchAdvisory = {
  source: 1247710,
  name: 'picomatch',
  title: 'picomatch vulnerable to ReDoS through single-branch repeated extglobs',
  severity: 'high',
};

// A realistic root-cause entry: picomatch itself carries the advisory object.
const picomatchEntry = {
  name: 'picomatch',
  severity: 'high',
  isDirect: false,
  via: [picomatchAdvisory],
};

// Transitive dependents have string-only `via` chains and add no advisory object.
const dependent = (name, chain) => ({
  name,
  severity: 'high',
  isDirect: false,
  via: chain,
});

const viteEntry = {
  name: 'vite',
  severity: 'high',
  isDirect: true,
  via: ['picomatch', 'tinyglobby'],
};

const unrelated = {
  name: 'left-pad',
  severity: 'critical',
  isDirect: true,
  via: [{ source: 999001, name: 'left-pad', title: 'left-pad critical', severity: 'critical' }],
};

test('passes with no high/critical advisories', () => {
  assert.deepEqual(classifyAudit({ vulnerabilities: {} }), { status: 'pass', reason: undefined });
});

test('passes when the only advisory root is picomatch, with many transitive dependents', () => {
  const doc = {
    vulnerabilities: {
      picomatch: picomatchEntry,
      micromatch: dependent('micromatch', ['picomatch']),
      fastGlob: dependent('fast-glob', ['micromatch']),
      vite: viteEntry,
      docusaurusCore: dependent('@docusaurus/core', ['vite', 'picomatch']),
    },
  };
  assert.equal(classifyAudit(doc).status, 'pass');
});

test('fails closed on an unrelated advisory alongside picomatch', () => {
  const doc = {
    vulnerabilities: { picomatch: picomatchEntry, 'left-pad': unrelated },
  };
  const verdict = classifyAudit(doc);
  assert.equal(verdict.status, 'fail');
  assert.match(verdict.reason, /left-pad/);
});

test('fails closed on an unrelated advisory even without picomatch present', () => {
  const doc = { vulnerabilities: { 'left-pad': unrelated } };
  assert.equal(classifyAudit(doc).status, 'fail');
});

test('fails closed on an npm audit ENOLOCK error document', () => {
  const doc = { error: { code: 'ENOLOCK', summary: 'This command requires an existing lockfile.' } };
  const verdict = classifyAudit(doc);
  assert.equal(verdict.status, 'fail');
  assert.match(verdict.reason, /ENOLOCK/);
});

test('fails closed when high/critical advisories exist but have no attributable root', () => {
  // npm 12 drops `source` but keeps the object with `name`; even if only
  // string chains appeared, failing closed is safer than passing.
  const doc = {
    vulnerabilities: {
      mystery: { name: 'mystery', severity: 'critical', isDirect: true, via: [] },
    },
  };
  const verdict = classifyAudit(doc);
  assert.equal(verdict.status, 'fail');
});

test('fails closed on high/critical advisories with no recognizable via objects', () => {
  const doc = {
    vulnerabilities: {
      mystery: { name: 'mystery', severity: 'high', isDirect: true, via: ['something-else'] },
    },
  };
  assert.equal(classifyAudit(doc).status, 'fail');
});

test('passes when the tolerated advisory is identified by its source id (npm 7-11 shape)', () => {
  const doc = {
    vulnerabilities: {
      picomatch: {
        name: 'picomatch',
        severity: 'high',
        isDirect: false,
        via: [{ source: 1247710, name: 'picomatch', severity: 'high' }],
      },
    },
  };
  assert.equal(classifyAudit(doc).status, 'pass');
});

test('fails closed when a second, different advisory shares the picomatch package name', () => {
  // Tolerate one advisory id, not one package name. A second picomatch
  // advisory (source 999001) is unrelated even though its package name matches.
  const doc = {
    vulnerabilities: {
      picomatch: {
        name: 'picomatch',
        severity: 'high',
        isDirect: false,
        via: [
          { source: 1247710, name: 'picomatch', severity: 'high', title: 'tolerated ReDoS' },
          { source: 999001, name: 'picomatch', severity: 'high', title: 'a second picomatch advisory' },
        ],
      },
    },
  };
  const verdict = classifyAudit(doc);
  assert.equal(verdict.status, 'fail');
  assert.match(verdict.reason, /999001/);
});

test('fails closed on a picomatch object whose advisory id is unknown', () => {
  const doc = {
    vulnerabilities: {
      picomatch: {
        name: 'picomatch',
        severity: 'high',
        isDirect: false,
        via: [{ source: 424242, name: 'picomatch', severity: 'high' }],
      },
    },
  };
  assert.equal(classifyAudit(doc).status, 'fail');
});

test('passes on the npm 12 shape where the tolerated advisory carries no source id', () => {
  const doc = {
    vulnerabilities: {
      picomatch: { name: 'picomatch', severity: 'high', isDirect: false, via: [{ name: 'picomatch', severity: 'high' }] },
    },
  };
  assert.equal(classifyAudit(doc).status, 'pass');
});

test('fails closed when a source-less picomatch object sits beside an unrelated advisory (npm 12 shape)', () => {
  const doc = {
    vulnerabilities: {
      picomatch: { name: 'picomatch', severity: 'high', isDirect: false, via: [{ name: 'picomatch', severity: 'high' }] },
      'left-pad': unrelated,
    },
  };
  const verdict = classifyAudit(doc);
  assert.equal(verdict.status, 'fail');
  assert.match(verdict.reason, /left-pad/);
});
