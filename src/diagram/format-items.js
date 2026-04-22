/**
 * Pure item-formatting helpers for type-group boxes.
 *
 * These functions transform raw hazard item arrays into grouped,
 * range-collapsed structures. No DOM access — safe to unit-test in Node.
 */

/**
 * Group hazard items by name so same-concept codes can be merged.
 *
 * Preserves the first-occurrence order of each name.
 *
 * @param {Array<{ name: string, code: string }>} items
 * @returns {Array<{ name: string, codes: string[] }>}
 */
export function groupItemsByName(items) {
  const map = new Map();
  for (const item of items) {
    if (!map.has(item.name)) {
      map.set(item.name, []);
    }
    map.get(item.name).push(item.code);
  }
  return Array.from(map.entries()).map(([name, codes]) => ({ name, codes }));
}

/**
 * Collapse a list of hazard codes into range strings where possible.
 *
 * Rules:
 * - Codes must share the same 2-letter prefix to be ranged together.
 * - Codes must be numerically consecutive (differ by exactly 1).
 * - A run of `minRun` or more consecutive codes collapses to "START-END".
 * - Shorter runs (including pairs) are emitted individually.
 * - Duplicates are removed before processing.
 * - Malformed codes (not matching /^[A-Z]{2}\d+$/) pass through unchanged.
 *
 * @param {string[]} codes
 * @param {number} [minRun=3] Minimum run length to collapse into a range.
 * @returns {string[]} Mixed array of individual codes and range strings.
 */
export function collapseToRanges(codes, minRun = 3) {
  if (codes.length === 0) return [];

  // Deduplicate while preserving order
  const unique = [...new Set(codes)];

  // Parse into { prefix, num, original }
  const CODE_RE = /^([A-Z]{2})(\d+)$/;
  const parsed = unique.map(c => {
    const m = c.match(CODE_RE);
    if (!m) return { prefix: null, num: NaN, original: c };
    return { prefix: m[1], num: parseInt(m[2], 10), original: c };
  });

  // Sort: well-formed codes by prefix then number; malformed codes last
  parsed.sort((a, b) => {
    const aValid = a.prefix !== null;
    const bValid = b.prefix !== null;
    if (!aValid && !bValid) return 0;
    if (!aValid) return 1;
    if (!bValid) return -1;
    const prefixCmp = a.prefix.localeCompare(b.prefix);
    if (prefixCmp !== 0) return prefixCmp;
    return a.num - b.num;
  });

  // Build consecutive runs (same prefix, nums differ by 1 each step)
  const runs = [];
  let run = [parsed[0]];
  for (let i = 1; i < parsed.length; i++) {
    const prev = run[run.length - 1];
    const curr = parsed[i];
    if (
      curr.prefix !== null &&
      curr.prefix === prev.prefix &&
      curr.num === prev.num + 1
    ) {
      run.push(curr);
    } else {
      runs.push(run);
      run = [curr];
    }
  }
  runs.push(run);

  // Emit each run as a range string or individual codes
  return runs.flatMap(r => {
    if (r.length >= minRun) {
      return [`${r[0].original}-${r[r.length - 1].original}`];
    }
    return r.map(p => p.original);
  });
}
