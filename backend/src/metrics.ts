import type { Request } from 'express';

// Minimal dependency-free Prometheus-compatible metrics registry.
// No request bodies, query strings, paths with variable segments, credentials,
// SQL, or error messages are stored in labels or values.

type LabelSet = Record<string, string>;

interface CounterMetric {
  help: string;
  values: Map<string, { labels: LabelSet; value: number }>;
}

interface HistogramMetric {
  help: string;
  buckets: number[];
  values: Map<string, { labels: LabelSet; count: number; sum: number; buckets: Map<number, number> }>;
}

interface GaugeMetric {
  help: string;
  values: Map<string, { labels: LabelSet; value: number }>;
}

function labelKey(labels: LabelSet): string {
  return Object.keys(labels)
    .sort()
    .map((k) => `${k}=${JSON.stringify(labels[k])}`)
    .join(',');
}

function formatLabels(labels: LabelSet): string {
  const pairs = Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${JSON.stringify(String(v))}`);
  return pairs.length ? `{${pairs.join(',')}}` : '';
}

function createRegistry() {
  const counters = new Map<string, CounterMetric>();
  const histograms = new Map<string, HistogramMetric>();
  const gauges = new Map<string, GaugeMetric>();

  function createCounter(name: string, opts: { help: string }) {
    const metric: CounterMetric = { help: opts.help, values: new Map() };
    counters.set(name, metric);
    return {
      inc(labels: LabelSet = {}, value = 1) {
        const key = labelKey(labels);
        const existing = metric.values.get(key);
        if (existing) existing.value += value;
        else metric.values.set(key, { labels, value });
      },
    };
  }

  function createHistogram(name: string, opts: { help: string; buckets: number[] }) {
    const buckets = [...opts.buckets].sort((a, b) => a - b);
    const metric: HistogramMetric = { help: opts.help, buckets, values: new Map() };
    histograms.set(name, metric);
    return {
      observe(labels: LabelSet, value: number) {
        const key = labelKey(labels);
        let entry = metric.values.get(key);
        if (!entry) {
          entry = { labels, count: 0, sum: 0, buckets: new Map() };
          metric.values.set(key, entry);
        }
        entry.count++;
        entry.sum += value;
        for (const b of buckets) {
          if (value <= b) {
            entry.buckets.set(b, (entry.buckets.get(b) ?? 0) + 1);
          }
        }
      },
    };
  }

  function createGauge(name: string, opts: { help: string }) {
    const metric: GaugeMetric = { help: opts.help, values: new Map() };
    gauges.set(name, metric);
    return {
      set(labels: LabelSet, value: number) {
        const key = labelKey(labels);
        metric.values.set(key, { labels, value });
      },
    };
  }

  function serializeHistogram(name: string, metric: HistogramMetric, lines: string[]) {
    lines.push(`# HELP ${name} ${metric.help}`);
    lines.push(`# TYPE ${name} histogram`);
    for (const { labels, count, sum, buckets } of metric.values.values()) {
      const labelStr = formatLabels(labels);
      const base = labelStr ? `${labelStr.slice(0, -1)},` : '{';
      for (const b of metric.buckets) {
        lines.push(`${name}_bucket${base}le=${JSON.stringify(String(b))}} ${buckets.get(b) ?? 0}`);
      }
      lines.push(`${name}_bucket${base}le="+Inf"} ${count}`);
      lines.push(`${name}_count${labelStr} ${count}`);
      lines.push(`${name}_sum${labelStr} ${sum.toFixed(6)}`);
    }
  }

  function serializeCounter(name: string, metric: CounterMetric, lines: string[]) {
    lines.push(`# HELP ${name} ${metric.help}`);
    lines.push(`# TYPE ${name} counter`);
    for (const { labels, value } of metric.values.values()) {
      lines.push(`${name}${formatLabels(labels)} ${value}`);
    }
  }

  function serializeGauge(name: string, metric: GaugeMetric, lines: string[]) {
    lines.push(`# HELP ${name} ${metric.help}`);
    lines.push(`# TYPE ${name} gauge`);
    for (const { labels, value } of metric.values.values()) {
      lines.push(`${name}${formatLabels(labels)} ${value}`);
    }
  }

  function serialize(): string {
    const lines: string[] = [];
    for (const [name, metric] of counters) serializeCounter(name, metric, lines);
    for (const [name, metric] of histograms) serializeHistogram(name, metric, lines);
    for (const [name, metric] of gauges) serializeGauge(name, metric, lines);
    return lines.join('\n') + (lines.length ? '\n' : '');
  }

  function resetForTests() {
    for (const metric of counters.values()) metric.values.clear();
    for (const metric of histograms.values()) metric.values.clear();
    for (const metric of gauges.values()) metric.values.clear();
  }

  return { createCounter, createHistogram, createGauge, serialize, resetForTests };
}

export const metrics = createRegistry();

export const httpRequestDuration = metrics.createHistogram('http_request_duration_seconds', {
  help: 'HTTP request duration in seconds, labelled by method, route and status code. Route uses the Express route path to avoid path-parameter cardinality.',
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

export const httpRequestsTotal = metrics.createCounter('http_requests_total', {
  help: 'Total HTTP requests, labelled by method, route and status code.',
});

export const apiErrorsTotal = metrics.createCounter('api_errors_total', {
  help: 'Total API error responses by public error code. Does not include upstream details, SQL or wallet addresses.',
});

export const dbPoolActiveConnections = metrics.createGauge('db_pool_active_connections', {
  help: 'Active (checked-out) connections per database pool, labelled by a stable hash of the database identity. No credentials or SQL are exposed.',
});

export const dbPoolIdleConnections = metrics.createGauge('db_pool_idle_connections', {
  help: 'Idle connections per database pool, labelled by a stable hash of the database identity.',
});

export const dbPoolWaitingConnections = metrics.createGauge('db_pool_waiting_connections', {
  help: 'Waiting requests for connections per database pool, labelled by a stable hash of the database identity.',
});

export const dbPoolMaxConnections = metrics.createGauge('db_pool_max_connections', {
  help: 'Configured maximum pool size, labelled by a stable hash of the database identity.',
});

export function safeHttpMethod(method: string | undefined): string {
  const m = (method ?? 'UNKNOWN').toUpperCase();
  const allowed = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']);
  return allowed.has(m) ? m : 'UNKNOWN';
}

export function safeRoutePath(req: Request): string {
  // Use the matched Express route path, which already contains :param
  // placeholders. Requests that end before routing (body-parse failures,
  // limiter rejections, 404s) collapse to one coarse label so an attacker
  // cannot create a time series per arbitrary path.
  const routePath = (req.route?.path as string | undefined) ?? '';
  return typeof routePath === 'string' && routePath ? routePath : 'unmatched';
}

export function resetMetricsForTests() {
  metrics.resetForTests();
}

// Only a fixed vocabulary may become a label. Unknown public response codes
// share one series rather than retaining arbitrary values in process memory.
const ERROR_CODES = new Set([
  'not_found',
  'invalid_input',
  'body_too_large',
  'internal_error',
  'rate_limited',
  'API_UNAVAILABLE',
  'unauthorized',
  'forbidden',
  'database_unavailable',
  'service_unavailable',
]);
export function safeErrorCode(code: string): string {
  return ERROR_CODES.has(code) ? code : 'other';
}
