/**
 * SVG connector overlay for the causal diagram.
 *
 * Draws orthogonal bus-pattern lines between type-group boxes and the
 * center node. All positions are read from the live DOM after CSS grid
 * layout, so connectors always match the actual box positions.
 *
 * Topology (causedBy example):
 *
 *   [Box A]  [Box B]       [Box C]
 *      |        |             |
 *   ===bus======+===bus=======+========conduit (right edge)
 *                                        |
 *   [Full-width banner]                  |
 *      |                                 |
 *   ===bus===============================+
 *      |
 *      ▼
 *   [Center]
 *
 * Single-row sections use a simple bus + trunk to center.
 * Multi-row sections route via a right-side vertical conduit placed
 * outside all boxes, so connector lines never cross through a box.
 *
 * A ResizeObserver redraws the connectors whenever the container
 * changes size (e.g. browser resize, font load shift).
 */

/** Distance (px) from a box edge to its row's horizontal bus line. */
const STUB = 22;
const STROKE_COLOR = '#555';
const STROKE_WIDTH = 1.5;
/** Side length of the downward-pointing arrowhead triangle. */
const ARROW_SIZE = 7;
/** Horizontal gap (px) between the rightmost box edge and the vertical conduit. */
const CONDUIT_MARGIN = 24;
const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Draw orthogonal bus-pattern connectors as an SVG overlay.
 *
 * Called once after initial render (via requestAnimationFrame) and
 * again on each resize via ResizeObserver.
 *
 * @param {HTMLElement} wrapper - .diagram-wrapper element (position: relative)
 * @param {SVGSVGElement} svgEl - The overlay <svg> element
 * @param {HTMLElement[]} causedByEls - Type-box elements in the causedBy section
 * @param {HTMLElement} centerEl - The center-node element
 * @param {HTMLElement[]} causesEls - Type-box elements in the causes section
 */
export function drawConnectors(wrapper, svgEl, causedByEls, centerEl, causesEls) {
  const wrapperRect = wrapper.getBoundingClientRect();

  /** Get an element's rect relative to the wrapper (not the viewport). */
  function rel(el) {
    const r = el.getBoundingClientRect();
    return {
      x: r.left - wrapperRect.left,
      y: r.top - wrapperRect.top,
      width: r.width,
      height: r.height,
    };
  }

  // Size the SVG to cover the full wrapper area
  svgEl.setAttribute('width', wrapperRect.width);
  svgEl.setAttribute('height', wrapperRect.height);
  svgEl.setAttribute('viewBox', `0 0 ${wrapperRect.width} ${wrapperRect.height}`);

  // Clear any previous draw
  svgEl.innerHTML = '';

  const centerRect = rel(centerEl);
  const cx = centerRect.x + centerRect.width / 2;

  if (causedByEls.length > 0) {
    const g = createSvgGroup(svgEl, 'connectors connectors-causedby');
    const boxes = causedByEls.map(rel);
    const rows = groupIntoRows(boxes);
    rows.reverse(); // process bottom-to-top (closest to center first)
    drawSectionConnectors(g, rows, centerRect, cx, 'up');
  }

  if (causesEls.length > 0) {
    const g = createSvgGroup(svgEl, 'connectors connectors-causes');
    const boxes = causesEls.map(rel);
    const rows = groupIntoRows(boxes);
    // already top-to-bottom (closest to center first)
    drawSectionConnectors(g, rows, centerRect, cx, 'down');
  }

  // Attach a ResizeObserver (once) to redraw when the wrapper resizes
  if (!wrapper._resizeObserver) {
    wrapper._resizeObserver = new ResizeObserver(() => {
      drawConnectors(wrapper, svgEl, causedByEls, centerEl, causesEls);
    });
    wrapper._resizeObserver.observe(wrapper);
  }
}

/**
 * Draw connectors for one section (causedBy or causes).
 *
 * Each row of boxes gets a horizontal bus line in the gap between that
 * row and the next element toward center. The bus Y is clamped to
 * `min(STUB, gap/2)` so it never overlaps adjacent rows.
 *
 * For multi-row sections, all buses extend to a shared conduitX on the
 * right side, connected by a single vertical conduit line.
 *
 * @param {SVGGElement} g - SVG group to draw into
 * @param {Array<Array<{x,y,width,height}>>} rows - Rows of box rects, rows[0] closest to center
 * @param {{x,y,width,height}} centerRect - Center node rect relative to wrapper
 * @param {number} cx - Horizontal center X coordinate
 * @param {'up'|'down'} direction - 'up' for causedBy (boxes above center), 'down' for causes
 */
function drawSectionConnectors(g, rows, centerRect, cx, direction) {
  const allBoxes = rows.flat();

  // Compute bus Y for each row, placing it in the gap between this
  // row and the next element toward center (never overlapping boxes).
  const busData = rows.map((row, i) => {
    let busY;
    if (direction === 'up') {
      const rowBottom = Math.max(...row.map(b => b.y + b.height));
      const nextTop = i === 0
        ? centerRect.y                                    // gap to center node
        : Math.min(...rows[i - 1].map(b => b.y));         // gap to row below
      const gap = nextTop - rowBottom;
      busY = rowBottom + Math.min(STUB, gap / 2);
    } else {
      const rowTop = Math.min(...row.map(b => b.y));
      const nextBottom = i === 0
        ? centerRect.y + centerRect.height                 // gap to center node
        : Math.max(...rows[i - 1].map(b => b.y + b.height)); // gap to row above
      const gap = rowTop - nextBottom;
      busY = rowTop - Math.min(STUB, gap / 2);
    }
    return { row, busY };
  });

  const needsConduit = busData.length > 1;
  // Place conduit to the right of every box so no line crosses a box
  const conduitX = needsConduit
    ? Math.max(...allBoxes.map(b => b.x + b.width)) + CONDUIT_MARGIN
    : 0;

  // Draw each row's horizontal bus and vertical stubs to boxes
  for (let i = 0; i < busData.length; i++) {
    const { row, busY } = busData[i];
    const boxCenters = row.map(b => b.x + b.width / 2);

    // Bus extent: spans all box centers in this row,
    // plus cx (for the closest row's trunk) and conduitX (for multi-row routing)
    const busExtents = [...boxCenters];
    if (i === 0) busExtents.push(cx);
    if (needsConduit) busExtents.push(conduitX);
    busExtents.sort((a, b) => a - b);

    drawLine(g, busExtents[0], busY, busExtents[busExtents.length - 1], busY);

    // Vertical stubs from bus to each box edge
    for (const box of row) {
      const bx = box.x + box.width / 2;
      if (direction === 'up') {
        drawLine(g, bx, busY, bx, box.y + box.height);
      } else {
        drawLine(g, bx, busY, bx, box.y);
        drawArrow(g, bx, box.y);
      }
    }
  }

  // Vertical conduit connecting all buses on the right side
  if (needsConduit) {
    const busYs = busData.map(d => d.busY);
    drawLine(g, conduitX, Math.min(...busYs), conduitX, Math.max(...busYs));
  }

  // Trunk: straight vertical line from closest bus to center node
  if (direction === 'up') {
    drawLine(g, cx, busData[0].busY, cx, centerRect.y);
  } else {
    const centerBottom = centerRect.y + centerRect.height;
    drawLine(g, cx, centerBottom, cx, busData[0].busY);
  }
}

/**
 * Group box rects into rows by similar Y position (within 20px tolerance).
 * Returns rows sorted top-to-bottom, each row sorted left-to-right.
 *
 * @param {Array<{x,y,width,height}>} boxes
 * @returns {Array<Array<{x,y,width,height}>>}
 */
function groupIntoRows(boxes) {
  if (!boxes.length) return [];

  const sorted = [...boxes].sort((a, b) => a.y - b.y);
  const rows = [];
  let currentRow = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = currentRow[0];
    const curr = sorted[i];
    if (Math.abs(curr.y - prev.y) < 20) {
      currentRow.push(curr);
    } else {
      rows.push(currentRow.sort((a, b) => a.x - b.x));
      currentRow = [curr];
    }
  }
  rows.push(currentRow.sort((a, b) => a.x - b.x));
  return rows;
}

/** Create an SVG <g> element with the given class and append it to parent. */
function createSvgGroup(parent, className) {
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('class', className);
  parent.appendChild(g);
  return g;
}

/** Draw a straight line between two points. */
function drawLine(g, x1, y1, x2, y2) {
  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
  line.setAttribute('stroke', STROKE_COLOR);
  line.setAttribute('stroke-width', STROKE_WIDTH);
  g.appendChild(line);
}

/** Draw a downward-pointing filled arrowhead with tip at (x, y). */
function drawArrow(g, x, y) {
  const s = ARROW_SIZE;
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', `M${x - s},${y - s * 1.2} L${x},${y} L${x + s},${y - s * 1.2} Z`);
  path.setAttribute('fill', STROKE_COLOR);
  path.setAttribute('stroke', 'none');
  g.appendChild(path);
}
