import { describe, it, expect } from 'vitest';
import { groupItemsByName, collapseToRanges } from '../diagram/format-items.js';

// ---------------------------------------------------------------------------
// groupItemsByName
// ---------------------------------------------------------------------------

describe('groupItemsByName', () => {
  it('returns an empty array for no items', () => {
    expect(groupItemsByName([])).toEqual([]);
  });

  it('returns a single group for a single item', () => {
    expect(groupItemsByName([{ name: 'Earthquake', code: 'GH0101' }])).toEqual([
      { name: 'Earthquake', codes: ['GH0101'] },
    ]);
  });

  it('merges codes under the same name', () => {
    const items = [
      { name: 'Land Transportation Accidents', code: 'TL0404' },
      { name: 'Land Transportation Accidents', code: 'TL0405' },
    ];
    expect(groupItemsByName(items)).toEqual([
      { name: 'Land Transportation Accidents', codes: ['TL0404', 'TL0405'] },
    ]);
  });

  it('keeps distinct names as separate groups', () => {
    const items = [
      { name: 'Earthquake', code: 'GH0101' },
      { name: 'Landslide', code: 'GH0300' },
    ];
    const result = groupItemsByName(items);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: 'Earthquake', codes: ['GH0101'] });
    expect(result[1]).toEqual({ name: 'Landslide', codes: ['GH0300'] });
  });

  it('preserves first-occurrence order of names', () => {
    const items = [
      { name: 'Beta', code: 'EN0102' },
      { name: 'Alpha', code: 'GH0101' },
      { name: 'Beta', code: 'EN0103' },
    ];
    const result = groupItemsByName(items);
    expect(result[0].name).toBe('Beta');
    expect(result[1].name).toBe('Alpha');
  });

  it('handles items where same code appears under the same name', () => {
    const items = [
      { name: 'Air Pollution', code: 'EN0101' },
      { name: 'Air Pollution', code: 'EN0101' },
    ];
    const result = groupItemsByName(items);
    // Grouping does not deduplicate — that's collapseToRanges' job
    expect(result).toEqual([{ name: 'Air Pollution', codes: ['EN0101', 'EN0101'] }]);
  });
});

// ---------------------------------------------------------------------------
// collapseToRanges
// ---------------------------------------------------------------------------

describe('collapseToRanges', () => {
  it('returns empty array for no codes', () => {
    expect(collapseToRanges([])).toEqual([]);
  });

  it('returns single code unchanged', () => {
    expect(collapseToRanges(['GH0101'])).toEqual(['GH0101']);
  });

  it('does NOT collapse a pair (2 sequential) by default (minRun=3)', () => {
    expect(collapseToRanges(['EN0101', 'EN0102'])).toEqual(['EN0101', 'EN0102']);
  });

  it('collapses exactly 3 sequential codes into a range', () => {
    expect(collapseToRanges(['EN0101', 'EN0102', 'EN0103'])).toEqual(['EN0101-EN0103']);
  });

  it('collapses 4+ sequential codes into a range', () => {
    expect(collapseToRanges(['EN0101', 'EN0102', 'EN0103', 'EN0104'])).toEqual([
      'EN0101-EN0104',
    ]);
  });

  it('handles non-sequential codes (gap) as individual items', () => {
    // EN0101, EN0103 — gap of 2, not sequential
    expect(collapseToRanges(['EN0101', 'EN0103'])).toEqual(['EN0101', 'EN0103']);
  });

  it('splits on a gap: run of 3, gap, run of 2', () => {
    const codes = ['EN0101', 'EN0102', 'EN0103', 'EN0105', 'EN0106'];
    expect(collapseToRanges(codes)).toEqual(['EN0101-EN0103', 'EN0105', 'EN0106']);
  });

  it('does not range codes with different prefixes', () => {
    // GH0101 and MH0102 share no prefix
    expect(collapseToRanges(['GH0101', 'MH0102'])).toEqual(['GH0101', 'MH0102']);
  });

  it('sorts codes before ranging — order in input does not matter', () => {
    expect(collapseToRanges(['EN0103', 'EN0101', 'EN0102'])).toEqual(['EN0101-EN0103']);
  });

  it('deduplicates identical codes', () => {
    expect(collapseToRanges(['EN0101', 'EN0101', 'EN0102', 'EN0103'])).toEqual([
      'EN0101-EN0103',
    ]);
  });

  it('passes through malformed codes unchanged', () => {
    expect(collapseToRanges(['INVALID', 'EN0101'])).toEqual(['EN0101', 'INVALID']);
  });

  it('respects a custom minRun of 2', () => {
    expect(collapseToRanges(['EN0101', 'EN0102'], 2)).toEqual(['EN0101-EN0102']);
  });

  it('handles a mix of ranged and non-ranged groups across prefixes', () => {
    // EN runs of 3, GH pair
    const codes = ['EN0101', 'EN0102', 'EN0103', 'GH0201', 'GH0202'];
    expect(collapseToRanges(codes)).toEqual(['EN0101-EN0103', 'GH0201', 'GH0202']);
  });
});
