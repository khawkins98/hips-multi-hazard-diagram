import { describe, it, expect } from 'vitest';
import { computeConduitX, CONDUIT_MARGIN } from '../diagram/connectors.js';

describe('computeConduitX', () => {
  const box = (x, width) => ({ x, y: 0, width, height: 40 });

  it('sits CONDUIT_MARGIN to the right of the rightmost box', () => {
    expect(computeConduitX([box(0, 100), box(120, 200)], 1000)).toBe(320 + CONDUIT_MARGIN);
  });

  it('is clamped inside the wrapper as a safety net (CSS normally reserves a lane)', () => {
    // Boxes fill the full 400px wrapper width
    expect(computeConduitX([box(0, 400)], 400)).toBeLessThanOrEqual(400);
  });
});
