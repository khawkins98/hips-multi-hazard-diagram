/**
 * Pure layout helpers for arranging type groups into grid rows.
 *
 * No DOM access — safe to unit-test in Node.
 */

/** Up to this many groups share a single row. */
export const MAX_SINGLE_ROW = 4;

/** Minimum box width (px) in the weighted grid template. */
const MIN_BOX_WIDTH = 140;

/**
 * Split type groups into balanced rows.
 *
 * - N <= MAX_SINGLE_ROW groups: all in a single row.
 * - More: ceil(N / MAX_SINGLE_ROW) rows (2 for the 8 hazard types; 3 if an
 *   unknown 9th type appears), each holding at most ceil(N / rows) groups.
 *   Groups are taken largest first and placed in the row with fewer items
 *   that still has room. The cap stops one large group from pushing every
 *   other group into a row too wide to fit (seen on Building Collapse, TL0201).
 *
 * A row never holds more than MAX_SINGLE_ROW boxes, so its minimum width
 * (4 × 140px + gaps) fits the wide layout.
 *
 * @param {Array<{ typeName: string, items: Array }>} groups
 * @returns {Array<Array<{ typeName: string, items: Array }>>}
 */
export function splitIntoRows(groups) {
  if (groups.length <= MAX_SINGLE_ROW) return [groups];

  const rowCount = Math.ceil(groups.length / MAX_SINGLE_ROW);
  const cap = Math.ceil(groups.length / rowCount);
  const rows = Array.from({ length: rowCount }, () => ({ groups: [], count: 0 }));

  const sorted = [...groups].sort((a, b) => b.items.length - a.items.length);
  for (const g of sorted) {
    const open = rows.filter(r => r.groups.length < cap);
    const target = open.reduce((lightest, r) => (r.count < lightest.count ? r : lightest));
    target.groups.push(g);
    target.count += g.items.length;
  }

  return rows.map(r => r.groups).filter(r => r.length > 0);
}

/**
 * Generate a CSS grid-template-columns value weighted by item count.
 * Groups with more items get proportionally wider columns.
 *
 * Example for 3 groups with 5, 2, and 4 items:
 *   "minmax(140px, 5fr) minmax(140px, 2fr) minmax(140px, 4fr)"
 *
 * @param {Array<{ items: Array }>} rowGroups
 * @returns {string} CSS grid-template-columns value
 */
export function getGridTemplate(rowGroups) {
  return rowGroups
    .map(g => `minmax(${MIN_BOX_WIDTH}px, ${Math.max(1, g.items.length)}fr)`)
    .join(' ');
}
