/**
 * Type-group box creation.
 *
 * Each box is a plain HTML div (not SVG) styled via CSS custom
 * properties for border/background color. Text wrapping and layout
 * are handled entirely by CSS — no manual measurement needed.
 */

import { TYPE_COLORS } from '../data/hazard-types.js';

/** Fallback when a hazard type has no entry in TYPE_COLORS. */
const DEFAULT_COLOR = { border: '#9E9E9E', bg: '#F5F5F5' };

/**
 * Create an HTML element for a type-group box.
 *
 * Structure:
 *   div.type-box  (--type-border, --type-bg set inline)
 *     div.type-box__header   "Technological"
 *     div.type-box__content  "Name (CODE); Name (CODE); ..."
 *
 * @param {string} typeName - Hazard type display name, e.g. "Technological"
 * @param {Array<{ name: string, code: string }>} items - Hazards in this group, sorted by code
 * @returns {HTMLDivElement}
 */
export function createBoxElement(typeName, items) {
  const color = TYPE_COLORS[typeName] || DEFAULT_COLOR;

  const box = document.createElement('div');
  box.className = 'type-box';
  box.style.setProperty('--type-border', color.border);
  box.style.setProperty('--type-bg', color.bg);

  const header = document.createElement('div');
  header.className = 'type-box__header';
  header.textContent = typeName;
  box.appendChild(header);

  const content = document.createElement('div');
  content.className = 'type-box__content';
  content.innerHTML = formatItemsHTML(items);
  box.appendChild(content);

  return box;
}

/**
 * Format hazard items as semicolon-separated HTML.
 * Each hazard code becomes a clickable <a> that navigates to that HIP's diagram.
 *
 * Example output: `Earthquake (<a href="https://www.undrr.org/terms/hips/GH0101">GH0101</a>); Landslide (<a ...>GH0300</a>)`
 *
 * @param {Array<{ name: string, code: string }>} items
 * @returns {string} HTML string
 */
function formatItemsHTML(items) {
  return items
    .map(h => {
      const escapedName = escapeHTML(h.name);
      const link = `<a class="hazard-link" href="https://www.undrr.org/terms/hips/${encodeURIComponent(h.code)}?utm_source=hips-diagram&utm_medium=referral&utm_campaign=causal-diagram" target="_blank" rel="noopener">${escapeHTML(h.code)}</a>`;
      return `${escapedName} (${link})`;
    })
    .join('; ');
}

/**
 * Escape a string for safe HTML insertion.
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
