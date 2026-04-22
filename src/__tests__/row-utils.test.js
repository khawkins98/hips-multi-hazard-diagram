import { describe, it, expect } from 'vitest';
import { groupIntoRows, ROW_Y_TOLERANCE } from '../diagram/row-utils.js';

describe('ROW_Y_TOLERANCE', () => {
  it('is a positive number', () => {
    expect(ROW_Y_TOLERANCE).toBeGreaterThan(0);
  });
});

describe('groupIntoRows', () => {
  const box = (x, y, w = 100, h = 40) => ({ x, y, width: w, height: h });

  it('returns empty array for no boxes', () => {
    expect(groupIntoRows([])).toEqual([]);
  });

  it('single box → one row with that box', () => {
    const b = box(0, 0);
    expect(groupIntoRows([b])).toEqual([[b]]);
  });

  it('two boxes at identical Y → same row', () => {
    const b1 = box(0, 50);
    const b2 = box(200, 50);
    const rows = groupIntoRows([b1, b2]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveLength(2);
  });

  it('two boxes within tolerance → same row', () => {
    const b1 = box(0, 50);
    const b2 = box(200, 55); // 5px difference, within default 20px
    const rows = groupIntoRows([b1, b2]);
    expect(rows).toHaveLength(1);
  });

  it('two boxes at exactly the tolerance boundary → separate rows', () => {
    const tol = ROW_Y_TOLERANCE;
    const b1 = box(0, 0);
    const b2 = box(200, tol); // y diff === tolerance, NOT < tolerance
    const rows = groupIntoRows([b1, b2]);
    expect(rows).toHaveLength(2);
  });

  it('two boxes clearly apart → separate rows', () => {
    const b1 = box(0, 0);
    const b2 = box(200, 100);
    const rows = groupIntoRows([b1, b2]);
    expect(rows).toHaveLength(2);
  });

  it('rows are sorted top-to-bottom', () => {
    const b1 = box(0, 100); // lower row
    const b2 = box(0, 0);   // upper row
    const rows = groupIntoRows([b1, b2]);
    expect(rows[0][0].y).toBe(0);
    expect(rows[1][0].y).toBe(100);
  });

  it('boxes within a row are sorted left-to-right', () => {
    const b1 = box(300, 0);
    const b2 = box(100, 0);
    const b3 = box(0, 0);
    const rows = groupIntoRows([b1, b2, b3]);
    expect(rows[0].map(b => b.x)).toEqual([0, 100, 300]);
  });

  it('three rows with 2 boxes each', () => {
    const row1 = [box(0, 0), box(200, 0)];
    const row2 = [box(0, 100), box(200, 100)];
    const row3 = [box(0, 200), box(200, 200)];
    const rows = groupIntoRows([...row1, ...row2, ...row3]);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveLength(2);
    expect(rows[1]).toHaveLength(2);
    expect(rows[2]).toHaveLength(2);
  });

  it('respects a custom tolerance', () => {
    const b1 = box(0, 0);
    const b2 = box(200, 8);
    // default tolerance (20) → same row; custom tolerance (5) → separate rows
    expect(groupIntoRows([b1, b2])).toHaveLength(1);
    expect(groupIntoRows([b1, b2], 5)).toHaveLength(2);
  });

  it('does not exhibit cumulative drift: 3 boxes at y=0, y=10, y=30', () => {
    // y=30 - y=0 (rowMinY) = 30 >= 20 → new row
    const b1 = box(0, 0);
    const b2 = box(100, 10);
    const b3 = box(200, 30);
    const rows = groupIntoRows([b1, b2, b3]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveLength(2); // b1, b2
    expect(rows[1]).toHaveLength(1); // b3
  });
});
