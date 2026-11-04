import { describe, it, expect } from 'vitest';
import { TYPE_COLORS, DEFAULT_COLOR, getHazardType } from '../data/hazard-types.js';

/** WCAG 2.x relative luminance of a #RRGGBB colour. */
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('TYPE_COLORS', () => {
  const entries = [...Object.entries(TYPE_COLORS), ['fallback', DEFAULT_COLOR]];

  it.each(entries)('%s header text meets WCAG AA (4.5:1) on its tint', (_name, color) => {
    expect(contrast(color.text, color.bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('getHazardType', () => {
  it('maps a known prefix to its type and colours', () => {
    const type = getHazardType('TL0305');
    expect(type.name).toBe('Technological');
    expect(type.color).toBe(TYPE_COLORS.Technological);
  });

  it('falls back for an unknown prefix', () => {
    const type = getHazardType('ZZ0001');
    expect(type.name).toBe('Unknown');
    expect(type.color).toBe(DEFAULT_COLOR);
  });
});
