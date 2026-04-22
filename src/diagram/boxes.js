/**
 * Type-group box creation.
 *
 * Each box is a plain HTML div (not SVG) styled via CSS custom
 * properties for border/background color. Text wrapping and layout
 * are handled entirely by CSS — no manual measurement needed.
 */

import { TYPE_COLORS } from '../data/hazard-types.js';
import { groupItemsByName, collapseToRanges } from './format-items.js';

/** Fallback when a hazard type has no entry in TYPE_COLORS. */
const DEFAULT_COLOR = { border: '#9E9E9E', bg: '#F5F5F5' };

/**
 * Create an HTML element for a type-group box.
 *
 * Structure:
 *   div.type-box  (--type-border, --type-bg set inline)
 *     div.type-box__header   "Technological"
 *     div.type-box__content  "Name (CODE); Same Name (CODE1, CODE2); Ranged (A01-A03); ..."
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
 *
 * Items sharing the same name are merged into a single entry:
 *   - Comma-separated links when codes are non-sequential or fewer than 3 in a run.
 *   - Range notation (START-END) when 3+ codes are numerically consecutive and
 *     share the same prefix; both endpoints are rendered as HIP links.
 *
 * Example outputs:
 *   Single:  `Earthquake (<a ...>GH0101</a>)`
 *   Grouped: `Land Transportation Accidents (<a ...>TL0404</a>, <a ...>TL0405</a>)`
 *   Range:   `Air Pollution (<a ...>EN0101</a>-<a ...>EN0103</a>)`
 *
 * @param {Array<{ name: string, code: string }>} items
 * @returns {string} HTML string
 */
export function formatItemsHTML(items) {
  const groups = groupItemsByName(items);

  return groups
    .map(({ name, codes }) => {
      const collapsed = collapseToRanges(codes);
      const codeHTML = collapsed
        .map(token => {
          // Range token: "START-END" — link both endpoints, hyphen is plain text.
          // collapseToRanges only emits ranges for well-formed codes (2-letter prefix
          // + digits), so dashIdx will always be >= 2. Guard anyway for safety.
          const dashIdx = token.indexOf('-', 2);
          if (dashIdx > 0) {
            const start = token.slice(0, dashIdx);
            const end = token.slice(dashIdx + 1);
            return `${codeLink(start)}-${codeLink(end)}`;
          }
          return codeLink(token);
        })
        .join(', ');

      return `${escapeHTML(name)} (${codeHTML})`;
    })
    .join('; ');
}

/** Render a single hazard code as a HIP link. */
function codeLink(code) {
  const escaped = escapeHTML(code);
  const href = `https://www.undrr.org/terms/hips/${encodeURIComponent(code)}?utm_source=hips-diagram&utm_medium=referral&utm_campaign=causal-diagram`;
  return `<a class="hazard-link" href="${href}" target="_blank" rel="noopener">${escaped}</a>`;
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
