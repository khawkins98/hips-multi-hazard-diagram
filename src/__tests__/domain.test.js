/**
 * Tests for domain value objects: HazardCode, HazardType, Hazard, CausalGraph.
 *
 * Focuses on invariants and genuine domain behaviour rather than
 * construction/shape — the existing format-items and row-utils tests
 * cover formatting logic separately.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HazardCode } from '../domain/hazard-code.js';
import { HazardType } from '../domain/hazard-type.js';
import { Hazard } from '../domain/hazard.js';
import { CausalGraph } from '../domain/causal-graph.js';

// ── HazardCode ────────────────────────────────────────────────────────────────

describe('HazardCode', () => {
  it('parses a valid code', () => {
    const c = new HazardCode('TL0305');
    expect(c.raw).toBe('TL0305');
    expect(c.prefix).toBe('TL');
    expect(c.numericPart).toBe(305);
    expect(c.isValid).toBe(true);
  });

  it('parses codes with more than 4 digits', () => {
    const c = new HazardCode('EN01001');
    expect(c.prefix).toBe('EN');
    expect(c.numericPart).toBe(1001);
    expect(c.isValid).toBe(true);
  });

  it('marks malformed codes invalid', () => {
    expect(new HazardCode('').isValid).toBe(false);
    expect(new HazardCode('TOOLONG').isValid).toBe(false);
    expect(new HazardCode('12ABCD').isValid).toBe(false);
  });

  it('toString returns the raw string', () => {
    expect(String(new HazardCode('GH0101'))).toBe('GH0101');
  });

  describe('isConsecutiveTo', () => {
    it('returns true for adjacent codes in the same prefix', () => {
      const a = new HazardCode('EN0101');
      const b = new HazardCode('EN0102');
      expect(a.isConsecutiveTo(b)).toBe(true);
    });

    it('returns false when the numeric gap is > 1', () => {
      const a = new HazardCode('EN0101');
      const b = new HazardCode('EN0103');
      expect(a.isConsecutiveTo(b)).toBe(false);
    });

    it('returns false for different prefixes', () => {
      const a = new HazardCode('EN0101');
      const b = new HazardCode('TL0102');
      expect(a.isConsecutiveTo(b)).toBe(false);
    });

    it('returns false in reverse order', () => {
      const a = new HazardCode('EN0102');
      const b = new HazardCode('EN0101');
      expect(a.isConsecutiveTo(b)).toBe(false);
    });

    it('returns false when either code is invalid', () => {
      const valid = new HazardCode('EN0101');
      const bad = new HazardCode('INVALID');
      expect(valid.isConsecutiveTo(bad)).toBe(false);
      expect(bad.isConsecutiveTo(valid)).toBe(false);
    });
  });
});

// ── HazardType ────────────────────────────────────────────────────────────────

describe('HazardType', () => {
  it('derives type from a known code prefix', () => {
    const t = HazardType.fromCode('TL0305');
    expect(t.name).toBe('Technological');
    expect(t.color.border).toBeTruthy();
    expect(t.color.bg).toBeTruthy();
  });

  it('falls back to Unknown for unrecognised prefix', () => {
    const t = HazardType.fromCode('XX9999');
    expect(t.name).toBe('Unknown');
  });

  it('returns Unknown for empty/null input', () => {
    expect(HazardType.fromCode('').name).toBe('Unknown');
    expect(HazardType.fromCode(null).name).toBe('Unknown');
  });

  it('is a flyweight — same type name → same object reference', () => {
    const a = HazardType.fromCode('TL0305');
    const b = HazardType.fromCode('TL0201');
    expect(a).toBe(b); // reference equality
  });

  it('fromName returns the same instance as fromCode', () => {
    const a = HazardType.fromCode('EN0101');
    const b = HazardType.fromName('Environmental');
    expect(a).toBe(b);
  });

  it('equals() returns true for the same type', () => {
    const a = HazardType.fromCode('GH0101');
    const b = HazardType.fromCode('GH0202');
    expect(a.equals(b)).toBe(true);
  });

  it('equals() returns false for different types', () => {
    const a = HazardType.fromCode('GH0101');
    const b = HazardType.fromCode('TL0305');
    expect(a.equals(b)).toBe(false);
  });

  it('is frozen — properties cannot be reassigned', () => {
    const t = HazardType.fromCode('SO0101');
    expect(() => { t.name = 'Hacked'; }).toThrow();
  });
});

// ── Hazard ────────────────────────────────────────────────────────────────────

describe('Hazard', () => {
  it('constructs from plain code string', () => {
    const h = new Hazard({ code: 'GH0101', name: 'Earthquake' });
    expect(h.code).toBeInstanceOf(HazardCode);
    expect(h.code.raw).toBe('GH0101');
    expect(h.name).toBe('Earthquake');
    expect(h.type).toBeInstanceOf(HazardType);
    expect(h.type.name).toBe('Geological');
  });

  it('accepts a HazardCode instance directly', () => {
    const code = new HazardCode('TL0305');
    const h = new Hazard({ code, name: 'Fire' });
    expect(h.code).toBe(code); // same reference preserved
  });

  it('accepts an explicit HazardType', () => {
    const type = HazardType.fromName('Societal');
    const h = new Hazard({ code: 'SO0101', name: 'Conflict', type });
    expect(h.type).toBe(type);
  });

  it('toString returns name and code', () => {
    const h = new Hazard({ code: 'GH0101', name: 'Earthquake' });
    expect(h.toString()).toBe('Earthquake (GH0101)');
  });
});

// ── CausalGraph ───────────────────────────────────────────────────────────────

describe('CausalGraph', () => {
  let graph;

  beforeEach(() => {
    const hazard = new Hazard({ code: 'TL0305', name: 'Fire' });
    const ghType = HazardType.fromName('Geological');
    const causedBy = new Map([
      ['Geological', { type: ghType, hazards: [new Hazard({ code: 'GH0101', name: 'Earthquake' })] }],
    ]);
    const causes = new Map();
    graph = new CausalGraph({ hazard, causedBy, causes });
  });

  it('exposes the focal hazard', () => {
    expect(graph.hazard.name).toBe('Fire');
    expect(graph.hazard.code.raw).toBe('TL0305');
  });

  it('causedBy groups are accessible by type name', () => {
    const group = graph.causedBy.get('Geological');
    expect(group).toBeDefined();
    expect(group.type.name).toBe('Geological');
    expect(group.hazards).toHaveLength(1);
    expect(group.hazards[0].name).toBe('Earthquake');
  });

  it('causes can be empty', () => {
    expect(graph.causes.size).toBe(0);
  });
});
