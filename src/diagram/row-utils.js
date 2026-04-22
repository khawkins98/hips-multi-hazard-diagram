/**
 * Row-grouping utility for the SVG connector overlay.
 *
 * Extracted from connectors.js so it can be unit-tested independently.
 */

/**
 * Y-position tolerance (px) for considering two boxes to be in the same row.
 *
 * CSS grid aligns all items in a row to the same top edge, so same-row boxes
 * should have near-identical Y values. The tolerance comfortably covers
 * sub-pixel rendering differences while staying well below the 32px
 * inter-row margin used in .group-row.
 */
export const ROW_Y_TOLERANCE = 20;

/**
 * Group box rects into rows by similar Y position.
 *
 * Boxes are sorted by Y ascending, then walked in order. Each box joins
 * the current row if its Y is within `tolerance` of the row's first
 * (minimum) Y — which is stable because the input is pre-sorted.
 *
 * Returns rows sorted top-to-bottom; each row is sorted left-to-right.
 *
 * @param {Array<{x: number, y: number, width: number, height: number}>} boxes
 * @param {number} [tolerance=ROW_Y_TOLERANCE]
 * @returns {Array<Array<{x: number, y: number, width: number, height: number}>>}
 */
export function groupIntoRows(boxes, tolerance = ROW_Y_TOLERANCE) {
  if (!boxes.length) return [];

  const sorted = [...boxes].sort((a, b) => a.y - b.y);
  const rows = [];
  let currentRow = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const rowMinY = currentRow[0].y; // stable minimum (list is sorted)
    const curr = sorted[i];
    if (curr.y - rowMinY < tolerance) {
      currentRow.push(curr);
    } else {
      rows.push(currentRow.sort((a, b) => a.x - b.x));
      currentRow = [curr];
    }
  }
  rows.push(currentRow.sort((a, b) => a.x - b.x));
  return rows;
}
