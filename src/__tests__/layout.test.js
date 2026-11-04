import { describe, it, expect } from 'vitest';
import { splitIntoRows, getGridTemplate, MAX_SINGLE_ROW } from '../diagram/layout.js';

/** Make groups with the given item counts. */
const groups = (...counts) =>
  counts.map((n, i) => ({ typeName: `T${i}`, items: Array(n).fill({}) }));

/** Row sizes, largest first (which row gets the extra box doesn't matter). */
const sizes = rows => rows.map(r => r.length).sort((x, y) => y - x);
const total = row => row.reduce((sum, g) => sum + g.items.length, 0);

describe('splitIntoRows', () => {
  it(`keeps up to ${MAX_SINGLE_ROW} groups in one row`, () => {
    expect(sizes(splitIntoRows(groups(1, 2, 3, 4)))).toEqual([4]);
  });

  it('splits more than 4 groups into two rows', () => {
    expect(splitIntoRows(groups(1, 1, 1, 1, 1))).toHaveLength(2);
  });

  it('caps each row at half the groups, even when one group dominates', () => {
    // Building Collapse (TL0201): one large group used to take a row alone
    // and push the other 5 into a row too wide to fit.
    expect(sizes(splitIntoRows(groups(14, 3, 2, 2, 1, 1)))).toEqual([3, 3]);
    expect(sizes(splitIntoRows(groups(20, 1, 1, 1, 1, 1, 1, 1)))).toEqual([4, 4]);
    expect(sizes(splitIntoRows(groups(9, 1, 1, 1, 1)))).toEqual([3, 2]);
  });

  it('still balances item counts within the cap', () => {
    const [a, b] = splitIntoRows(groups(5, 5, 4, 4, 1, 1));
    expect(Math.abs(total(a) - total(b))).toBeLessThanOrEqual(2);
  });

  it('keeps every group exactly once', () => {
    const input = groups(7, 3, 3, 2, 1, 1, 1);
    const out = splitIntoRows(input).flat();
    expect(out).toHaveLength(input.length);
    expect(new Set(out)).toEqual(new Set(input));
  });
});

describe('getGridTemplate', () => {
  it('weights columns by item count with a 140px minimum', () => {
    expect(getGridTemplate(groups(5, 2))).toBe('minmax(140px, 5fr) minmax(140px, 2fr)');
  });

  it('gives empty groups a weight of 1', () => {
    expect(getGridTemplate(groups(0))).toBe('minmax(140px, 1fr)');
  });
});
