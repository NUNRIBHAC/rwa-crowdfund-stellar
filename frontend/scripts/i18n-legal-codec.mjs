// Codec between the legal TS block structure (src/i18n/legal/types.ts) and the
// Weblate-facing legal JSON (frontend/i18n-json/legal/<locale>.json).
//
// Problem solved: the raw block dump exposed structural data to translators as
// editable units - block type discriminators ("p", "notice"), single-space
// fragments, and bold-label fragments split from their sentences.
//
// Encoding: every translator-editable unit is ONE string containing the full
// sentence with inline markup preserved:
//   { b: [...] }  ->  <b>...</b>
//   { i: [...] }  ->  <i>...</i>
//   { v: name }   ->  {v:name}        (bound constants, never translated)
// Block structure (type, order, ul items, table cells) lives in the KEY PATH,
// never in values:
//   legal.<doc>.<NN>.<notice|p|h2>            = one unit
//   legal.<doc>.<NN>.ul.<II>                  = one unit per list item
//   legal.<doc>.<NN>.table.<head|rows>.<RR>.<CC> = one unit per cell
// <NN>/<II>/<RR>/<CC> are prefixed 2-digit indices: b00, i00, r00, c00. The
// letter prefix keeps the keys non-numeric so JS/JSON object key order stays
// stable (pure-digit keys like "10" get reordered by JS engines). Index b00
// must exist and indices must be sequential - gaps or unknown keys fail.
//
// Losslessness relies on source strings never containing the reserved tokens
// (<b>, </b>, <i>, </i>, {v:..., backslash): the exporter throws if one
// appears, so an unsafe source can never be projected silently.

export const LEGAL_VARS = ['contactEmail', 'lastUpdated', 'neonRegion'];

const RESERVED = /<\/?[bi]>|\{v:[^}]*\}|\\/;

export function serializeInline(inline, path) {
  let out = '';
  for (const item of inline) {
    if (typeof item === 'string') {
      if (RESERVED.test(item)) {
        throw new Error(
          `${path}: source string contains a reserved token (markup or {v:...}); extend the codec before exporting: ${JSON.stringify(item.slice(0, 60))}`,
        );
      }
      out += item;
    } else if ('b' in item) {
      out += `<b>${serializeInline(item.b, `${path}.b`)}</b>`;
    } else if ('i' in item) {
      out += `<i>${serializeInline(item.i, `${path}.i`)}</i>`;
    } else if ('v' in item) {
      if (!LEGAL_VARS.includes(item.v)) throw new Error(`${path}: unknown legal variable ${JSON.stringify(item.v)}`);
      out += `{v:${item.v}}`;
    } else {
      throw new Error(`${path}: unknown inline node ${JSON.stringify(item)}`);
    }
  }
  return out;
}

// Structural signature of one serialized unit: the sorted multiset of markup
// tags and {v:name} variables (text runs excluded). Translators edit and
// reorder words freely - CJK translations legitimately move a bolded term to
// the front of the sentence - so the contract is that no markup and no bound
// variable is dropped, added or swapped, not that tokens stay in position.
// Balanced nesting is enforced separately by parseInline on every unit.
export function unitSkeleton(str, path) {
  const parts = [];
  const re = /<b>|<\/b>|<i>|<\/i>|\{v:([a-zA-Z]+)\}/g;
  for (const m of str.matchAll(re)) {
    if (m[1] !== undefined) {
      if (!LEGAL_VARS.includes(m[1])) throw new Error(`${path}: unknown legal variable {v:${m[1]}}`);
      parts.push(`v:${m[1]}`);
    } else {
      parts.push(m[0] === '<b>' ? 'b+' : m[0] === '</b>' ? 'b-' : m[0] === '<i>' ? 'i+' : 'i-');
    }
  }
  return parts.sort().join('|');
}

export function parseInline(str, path) {
  if (typeof str !== 'string') throw new Error(`${path}: unit must be a string, got ${typeof str}`);
  unitSkeleton(str, path); // validates {v:...} names
  const root = [];
  const stack = [];
  const re = /<b>|<\/b>|<i>|<\/i>|\{v:[a-zA-Z]+\}/g;
  let last = 0;
  const target = () => (stack.length === 0 ? root : stack[stack.length - 1].children);
  const pushText = (t) => {
    if (t.length > 0) target().push(t);
  };
  for (const m of str.matchAll(re)) {
    pushText(str.slice(last, m.index));
    last = m.index + m[0].length;
    const tok = m[0];
    if (tok === '<b>' || tok === '<i>') {
      const node = { tag: tok === '<b>' ? 'b' : 'i', children: [] };
      target().push(node);
      stack.push(node);
    } else if (tok === '</b>' || tok === '</i>') {
      const tag = tok === '</b>' ? 'b' : 'i';
      const open = stack.pop();
      if (!open || open.tag !== tag) throw new Error(`${path}: unmatched ${tok}`);
    } else {
      target().push({ v: tok.slice(3, -1) });
    }
  }
  pushText(str.slice(last));
  if (stack.length > 0) throw new Error(`${path}: unclosed <${stack[stack.length - 1].tag}>`);
  // Convert internal nodes to the LegalInline shape.
  const convert = (nodes) =>
    nodes.map((n) => (typeof n === 'string' ? n : 'v' in n ? { v: n.v } : n.tag === 'b' ? { b: convert(n.children) } : { i: convert(n.children) }));
  return convert(root);
}

const pad = (prefix, i) => `${prefix}${String(i).padStart(2, '0')}`;

function assertCount(n, path) {
  if (n > 99) throw new Error(`${path}: ${n} entries exceed the 2-digit index encoding; widen the codec`);
}

export function blocksToJson(blocks, path = 'legal') {
  assertCount(blocks.length, path);
  const out = {};
  blocks.forEach((b, i) => {
    const p = `${path}.${pad('b', i)}`;
    if (b.t === 'notice' || b.t === 'p' || b.t === 'h2') {
      out[pad('b', i)] = { [b.t]: serializeInline(b.text, `${p}.${b.t}`) };
    } else if (b.t === 'ul') {
      assertCount(b.items.length, `${p}.ul`);
      const items = {};
      b.items.forEach((item, j) => {
        items[pad('i', j)] = serializeInline(item, `${p}.ul.${pad('i', j)}`);
      });
      out[pad('b', i)] = { ul: items };
    } else if (b.t === 'table') {
      const table = {};
      for (const section of ['head', 'rows']) {
        assertCount(b[section].length, `${p}.table.${section}`);
        const rows = {};
        b[section].forEach((row, r) => {
          assertCount(row.length, `${p}.table.${section}.${pad('r', r)}`);
          const cells = {};
          row.forEach((cell, c) => {
            cells[pad('c', c)] = serializeInline(cell, `${p}.table.${section}.${pad('r', r)}.${pad('c', c)}`);
          });
          rows[pad('r', r)] = cells;
        });
        table[section] = rows;
      }
      out[pad('b', i)] = { table };
    } else {
      throw new Error(`${p}: unknown block type ${JSON.stringify(b.t)}`);
    }
  });
  return out;
}

function indexKeys(obj, path, prefix) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) throw new Error(`${path}: expected an index object`);
  const keys = Object.keys(obj);
  const re = new RegExp(`^${prefix}\\d{2}$`);
  keys.forEach((k, i) => {
    if (!re.test(k) || Number(k.slice(1)) !== i)
      throw new Error(`${path}: indices must be ${prefix}00, ${prefix}01, ... sequential, found ${JSON.stringify(k)} at position ${i}`);
  });
  return keys;
}

export function jsonToBlocks(json, path = 'legal') {
  const blocks = [];
  for (const k of indexKeys(json, path, 'b')) {
    const entry = json[k];
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) throw new Error(`${path}.${k}: block must be an object`);
    const types = Object.keys(entry);
    if (types.length !== 1) throw new Error(`${path}.${k}: exactly one block type key expected, found ${types.join(', ')}`);
    const t = types[0];
    const p = `${path}.${k}.${t}`;
    if (t === 'notice' || t === 'p' || t === 'h2') {
      blocks.push({ t, text: parseInline(entry[t], p) });
    } else if (t === 'ul') {
      const items = indexKeys(entry.ul, p, 'i').map((ik) => parseInline(entry.ul[ik], `${p}.${ik}`));
      blocks.push({ t, items });
    } else if (t === 'table') {
      const table = entry.table;
      if (table === null || typeof table !== 'object' || Array.isArray(table)) throw new Error(`${p}: table must be an object`);
      const sections = Object.keys(table);
      if (sections.length !== 2 || !sections.includes('head') || !sections.includes('rows')) {
        throw new Error(`${p}: table needs exactly head and rows, found ${sections.join(', ')}`);
      }
      const block = { t, head: [], rows: [] };
      for (const section of ['head', 'rows']) {
        block[section] = indexKeys(table[section], `${p}.${section}`, 'r').map((rk) => {
          const row = table[section][rk];
          return indexKeys(row, `${p}.${section}.${rk}`, 'c').map((ck) => parseInline(row[ck], `${p}.${section}.${rk}.${ck}`));
        });
      }
      blocks.push(block);
    } else {
      throw new Error(`${path}.${k}: unknown block type ${JSON.stringify(t)}`);
    }
  }
  return blocks;
}

// Base validation for legal JSON: same key structure as the English base, and
// every unit's markup/variable skeleton equal to the base unit's. Units are
// also parsed, so malformed markup fails the check even in the base locale.
export function validateLegalAgainstBase(base, value, path, diffs) {
  if (typeof base === 'string' && typeof value === 'string') {
    let bs;
    let vs;
    try {
      bs = unitSkeleton(base, path);
    } catch (e) {
      diffs.push(`${path}: base unit malformed: ${e.message}`);
      return;
    }
    try {
      vs = unitSkeleton(value, path);
    } catch (e) {
      diffs.push(`${path}: ${e.message}`);
      return;
    }
    if (bs !== vs) diffs.push(`${path}: markup skeleton ${vs} vs base ${bs}`);
    return;
  }
  if (typeof base !== typeof value) {
    diffs.push(`${path}: type ${typeof value} vs base ${typeof base}`);
    return;
  }
  const kb = Object.keys(base);
  const kv = Object.keys(value);
  for (const k of kb) {
    if (!(k in value)) diffs.push(`${path}: missing key ${k}`);
  }
  for (const k of kv) {
    if (!(k in base)) {
      diffs.push(`${path}: unexpected key ${k}`);
      continue;
    }
    validateLegalAgainstBase(base[k], value[k], `${path}.${k}`, diffs);
  }
}
