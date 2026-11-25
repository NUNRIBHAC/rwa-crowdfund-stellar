// Explicit catalog-only namespaces. These remain translatable but are never
// projected into runtime dictionaries. Activation requires a separate change.
const DORMANT = Object.freeze({
  automaticRefund: Object.freeze(['title', 'testnetOnly', 'pending', 'submitted', 'paid', 'blocked', 'manualFallback', 'unavailable']),
});
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const placeholders = (s) =>
  [...s.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1])
    .sort()
    .join(',');

function validateNamespace(name, value, base, label) {
  const keys = DORMANT[name];
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== keys.length || keys.some((k) => !own(value, k))) {
    throw new Error(`${label}.${name}: dormant catalog shape rejected`);
  }
  for (const k of keys) {
    if (typeof value[k] !== 'string' || !value[k].trim()) throw new Error(`${label}.${name}.${k}: nonempty string required`);
    if (base && placeholders(value[k]) !== placeholders(base[k])) throw new Error(`${label}.${name}.${k}: placeholders differ`);
  }
}

export function splitCatalog(catalog, englishCatalog, runtimeBase, label) {
  const active = { ...catalog };
  const dormant = {};
  for (const name of Object.keys(DORMANT)) {
    if (own(runtimeBase, name)) throw new Error(`${name}: dormant namespace must not be active in runtime`);
    const expected = own(englishCatalog, name);
    if (expected) validateNamespace(name, englishCatalog[name], null, 'ui.en');
    if (own(catalog, name) !== expected) throw new Error(`${label}.${name}: dormant namespace presence differs from English`);
    if (!expected) continue;
    validateNamespace(name, catalog[name], englishCatalog[name], label);
    dormant[name] = catalog[name];
    delete active[name];
  }
  return { active, dormant };
}

export function preserveDormant(runtimeProjection, catalog, englishCatalog, label) {
  const { active, dormant } = splitCatalog(catalog, englishCatalog, runtimeProjection, label);
  for (const name of Object.keys(active)) {
    if (!own(runtimeProjection, name)) throw new Error(`${label}: unknown catalog namespace ${name}`);
  }
  const values = { ...runtimeProjection, ...dormant };
  const ordered = {};
  for (const key of Object.keys(catalog)) if (own(values, key)) ordered[key] = values[key];
  for (const key of Object.keys(values)) if (!own(ordered, key)) ordered[key] = values[key];
  return ordered;
}
