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

/**
 * Hazard links sit on the type tints. Their colour comes from the host's
 * Mangrove `--mg-color-interactive` (or our fallback), mixed with 15% black in
 * diagram-styles.css. Keep LINK_MIX in sync with that rule.
 * Brand values from https://mangrove.undrr.org/tokens.json (Mangrove 2.3.0).
 */
const LINK_MIX = 0.85;
const LINK_COLORS = {
  fallback: [21, 101, 192],
  undrr: [0, 79, 145],
  preventionweb: [10, 105, 105],
  irp: [15, 120, 191],
  mcr: [89, 26, 97],
};

const toHex = rgb => '#' + rgb.map(c => Math.round(c * LINK_MIX).toString(16).padStart(2, '0')).join('');

describe('hazard link colour', () => {
  const tints = [...Object.values(TYPE_COLORS), DEFAULT_COLOR].map(c => c.bg);

  it.each(Object.entries(LINK_COLORS))('%s links meet WCAG AA on every type tint', (_brand, rgb) => {
    for (const bg of tints) {
      expect(contrast(toHex(rgb), bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
