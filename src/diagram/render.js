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
 * proportionally to their item count. Row splitting lives in layout.js:
 * <= 4 groups → 1 row, > 4 → balanced split into 2 rows of at most half each.
 *
 * Column templates are passed to CSS as the `--hips-cols` custom property
 * rather than set as an inline `grid-template-columns`, so the stylesheet
 * can switch to a wrapping layout when the diagram's container is narrow.
 *
 * Sections are flagged for the connector conduit lane (see styles):
 *   .section--multirow  rendered as 2+ rows, so it needs a conduit at any width
 *   .section--multibox  2+ boxes, so it needs a conduit once boxes wrap
 */

import { createBoxElement } from './boxes.js';
import { drawConnectors } from './connectors.js';
import { splitIntoRows, getGridTemplate } from './layout.js';

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
 * @param {{ name: string, code: string, type: { name: string }, causedBy: Map, causes: Map }} data
 */
export function render(container, data) {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'diagram-wrapper';

  /** @type {HTMLElement[]} Box elements in the causedBy section */
  const causedByEls = [];
  /** @type {HTMLElement[]} Box elements in the causes section */
  const causesEls = [];

  // === CAUSED BY SECTION (top) ===
  if (data.causedBy.size > 0) {
    const section = document.createElement('div');
    section.className = 'section-causedby';

    const label = document.createElement('div');
    label.className = 'section-label';
    label.textContent = 'Caused by';
    section.appendChild(label);

    const sameTypeName = data.type.name;
    const sameTypeItems = data.causedBy.get(sameTypeName);
    const hasBanner = sameTypeItems && sameTypeItems.length >= SAME_TYPE_BANNER_THRESHOLD;

    // Banner row: full-width box for same-type items when there are many
    if (hasBanner) {
      const bannerRow = document.createElement('div');
      bannerRow.className = 'group-row';
      bannerRow.style.setProperty('--hips-cols', '1fr');
      const bannerBox = createBoxElement(sameTypeName, sameTypeItems);
      bannerRow.appendChild(bannerBox);
      section.appendChild(bannerRow);
      causedByEls.push(bannerBox);
    }

    // Remaining type groups (excluding banner if present)
    const otherGroups = [];
    for (const [typeName, items] of data.causedBy) {
      if (hasBanner && typeName === sameTypeName) continue;
      otherGroups.push({ typeName, items });
    }

    let rowCount = hasBanner ? 1 : 0;
    if (otherGroups.length > 0) {
      const rows = splitIntoRows(otherGroups);
      rowCount += rows.length;
      for (const row of rows) {
        const rowEl = document.createElement('div');
        rowEl.className = 'group-row';
        rowEl.style.setProperty('--hips-cols', getGridTemplate(row));

        for (const group of row) {
          const boxEl = createBoxElement(group.typeName, group.items);
          rowEl.appendChild(boxEl);
          causedByEls.push(boxEl);
        }
        section.appendChild(rowEl);
      }
    }

    flagConduitLane(section, rowCount, causedByEls.length);
    wrapper.appendChild(section);
  }

  // === CENTER NODE ===
  const centerWrapper = document.createElement('div');
  centerWrapper.className = 'center-node-wrapper';
  const centerNode = document.createElement('div');
  centerNode.className = 'center-node';
  centerNode.textContent = `${data.name} (${data.code})`;
  centerWrapper.appendChild(centerNode);
  wrapper.appendChild(centerWrapper);

  // === CAUSES SECTION (bottom) ===
  if (data.causes.size > 0) {
    const section = document.createElement('div');
    section.className = 'section-causes';

    const label = document.createElement('div');
    label.className = 'section-label';
    label.textContent = 'Causes';
    section.appendChild(label);

    const causesGroups = [];
    for (const [typeName, items] of data.causes) {
      causesGroups.push({ typeName, items });
    }

    const rows = splitIntoRows(causesGroups);
    for (const row of rows) {
      const rowEl = document.createElement('div');
      rowEl.className = 'group-row';
      rowEl.style.setProperty('--hips-cols', getGridTemplate(row));

      for (const group of row) {
        const boxEl = createBoxElement(group.typeName, group.items);
        rowEl.appendChild(boxEl);
        causesEls.push(boxEl);
      }
      section.appendChild(rowEl);
    }

    flagConduitLane(section, rows.length, causesEls.length);
    wrapper.appendChild(section);
  }

  // === CONNECTOR OVERLAY ===
  const svgNS = 'http://www.w3.org/2000/svg';
  const svgEl = document.createElementNS(svgNS, 'svg');
  svgEl.setAttribute('class', 'connector-overlay');
  // Decorative: the section labels already say which way each group relates.
  svgEl.setAttribute('aria-hidden', 'true');
  svgEl.setAttribute('focusable', 'false');
  wrapper.appendChild(svgEl);

  container.appendChild(wrapper);

  // Draw connectors after the browser completes layout
  requestAnimationFrame(() => {
    drawConnectors(wrapper, svgEl, causedByEls, centerNode, causesEls);
  });
}

/**
 * Mark a section so CSS reserves a right-hand lane for the connector conduit.
 * @param {HTMLElement} section
 * @param {number} rowCount - Rows rendered at full width
 * @param {number} boxCount - Type boxes in the section
 */
function flagConduitLane(section, rowCount, boxCount) {
  section.classList.toggle('section--multirow', rowCount > 1);
  section.classList.toggle('section--multibox', boxCount > 1);
}
