/**
 * Diagram layout and rendering.
 *
 * Builds the HTML structure for the causal diagram:
 *
 *   .diagram-wrapper
 *     .section-causedby        (optional banner row + grouped type boxes)
 *     .center-node-wrapper     (selected HIP name + code)
 *     .section-causes          (grouped type boxes)
 *     svg.connector-overlay    (orthogonal bus-pattern lines drawn after layout)
 *
 * Box layout uses CSS grid with weighted `fr` columns so boxes size
 * proportionally to their item count. Row splitting is deterministic:
 * <= 4 groups → 1 row, > 4 → balanced split into 2 rows.
 */

import { createBoxElement } from './boxes.js';
import { drawConnectors } from './connectors.js';

/**
 * When the center HIP has >= this many causedBy items of its own type,
 * those items get a full-width banner row above the other type boxes.
 */
const SAME_TYPE_BANNER_THRESHOLD = 4;

/**
 * Render the full causal diagram for a HIP.
 *
 * Collects references to every type-box element so that the connector
 * overlay can read their positions via getBoundingClientRect() after
 * the browser has laid out the grid.
 *
 * @param {HTMLElement} container - Element to render into (typically #app)
 * @param {import('../domain/causal-graph.js').CausalGraph} graph
 */
export function render(container, graph) {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'diagram-wrapper';

  /** @type {HTMLElement[]} Box elements in the causedBy section */
  const causedByEls = [];
  /** @type {HTMLElement[]} Box elements in the causes section */
  const causesEls = [];

  // === CAUSED BY SECTION (top) ===
  if (graph.causedBy.size > 0) {
    const section = document.createElement('div');
    section.className = 'section-causedby';

    const label = document.createElement('div');
    label.className = 'section-label';
    label.textContent = 'CAUSED BY';
    section.appendChild(label);

    const sameTypeName = graph.hazard.type.name;
    const sameTypeGroup = graph.causedBy.get(sameTypeName);
    const sameTypeItems = sameTypeGroup?.hazards ?? null;
    const hasBanner = sameTypeItems && sameTypeItems.length >= SAME_TYPE_BANNER_THRESHOLD;

    // Banner row: full-width box for same-type items when there are many
    if (hasBanner) {
      const bannerRow = document.createElement('div');
      bannerRow.className = 'group-row';
      bannerRow.style.gridTemplateColumns = '1fr';
      const bannerBox = createBoxElement(sameTypeName, sameTypeItems, sameTypeGroup.type.color);
      bannerRow.appendChild(bannerBox);
      section.appendChild(bannerRow);
      causedByEls.push(bannerBox);
    }

    // Remaining type groups (excluding banner if present)
    const otherGroups = [];
    for (const [typeName, { type, hazards }] of graph.causedBy) {
      if (hasBanner && typeName === sameTypeName) continue;
      otherGroups.push({ typeName, type, items: hazards });
    }

    if (otherGroups.length > 0) {
      const rows = splitIntoRows(otherGroups);
      for (const row of rows) {
        const rowEl = document.createElement('div');
        rowEl.className = 'group-row';
        rowEl.style.gridTemplateColumns = getGridTemplate(row);

        for (const group of row) {
          const boxEl = createBoxElement(group.typeName, group.items, group.type.color);
          rowEl.appendChild(boxEl);
          causedByEls.push(boxEl);
        }
        section.appendChild(rowEl);
      }
    }

    wrapper.appendChild(section);
  }

  // === CENTER NODE ===
  const centerWrapper = document.createElement('div');
  centerWrapper.className = 'center-node-wrapper';
  const centerNode = document.createElement('div');
  centerNode.className = 'center-node';
  centerNode.textContent = `${graph.hazard.name} (${graph.hazard.code})`;
  centerWrapper.appendChild(centerNode);
  wrapper.appendChild(centerWrapper);

  // === CAUSES SECTION (bottom) ===
  if (graph.causes.size > 0) {
    const section = document.createElement('div');
    section.className = 'section-causes';

    const label = document.createElement('div');
    label.className = 'section-label';
    label.textContent = 'CAUSES';
    section.appendChild(label);

    const causesGroups = [];
    for (const [typeName, { type, hazards }] of graph.causes) {
      causesGroups.push({ typeName, type, items: hazards });
    }

    const rows = splitIntoRows(causesGroups);
    for (const row of rows) {
      const rowEl = document.createElement('div');
      rowEl.className = 'group-row';
      rowEl.style.gridTemplateColumns = getGridTemplate(row);

      for (const group of row) {
        const boxEl = createBoxElement(group.typeName, group.items, group.type.color);
        rowEl.appendChild(boxEl);
        causesEls.push(boxEl);
      }
      section.appendChild(rowEl);
    }

    wrapper.appendChild(section);
  }

  // === CONNECTOR OVERLAY ===
  const svgNS = 'http://www.w3.org/2000/svg';
  const svgEl = document.createElementNS(svgNS, 'svg');
  svgEl.setAttribute('class', 'connector-overlay');
  wrapper.appendChild(svgEl);

  container.appendChild(wrapper);

  // Draw connectors after the browser completes layout
  requestAnimationFrame(() => {
    drawConnectors(wrapper, svgEl, causedByEls, centerNode, causesEls);
  });
}

/**
 * Split type groups into 1 or 2 rows for balanced layout.
 *
 * - N <= 4 groups: all in a single row
 * - N > 4 groups: greedy balanced split — sort by item count descending,
 *   assign each group to the lighter row
 *
 * @param {Array<{ typeName: string, items: Array }>} groups
 * @returns {Array<Array<{ typeName: string, items: Array }>>} 1 or 2 rows
 */
function splitIntoRows(groups) {
  if (groups.length <= 4) return [groups];

  const row1 = [];
  const row2 = [];
  let count1 = 0;
  let count2 = 0;

  const sorted = [...groups].sort((a, b) => b.items.length - a.items.length);
  for (const g of sorted) {
    if (count1 <= count2) {
      row1.push(g);
      count1 += g.items.length;
    } else {
      row2.push(g);
      count2 += g.items.length;
    }
  }

  return [row1, row2].filter(r => r.length > 0);
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
function getGridTemplate(rowGroups) {
  return rowGroups
    .map(g => `minmax(140px, ${Math.max(1, g.items.length)}fr)`)
    .join(' ');
}
