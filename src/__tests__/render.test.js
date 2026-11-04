// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '../diagram/render.js';

/** Build the shape fetchHip() returns. */
function hip({ causedBy = {}, causes = {} } = {}) {
  const toMap = obj =>
    new Map(Object.entries(obj).map(([type, n]) =>
      [type, Array.from({ length: n }, (_, i) => ({ name: `${type} ${i}`, code: `XX${i}` }))]));
  return {
    name: 'Fire',
    code: 'TL0305',
    type: { name: 'Technological' },
    causedBy: toMap(causedBy),
    causes: toMap(causes),
  };
}

let container;

beforeEach(() => {
  // Connectors are drawn on the next frame; layout isn't available in jsdom.
  vi.stubGlobal('requestAnimationFrame', () => 0);
  container = document.createElement('div');
  document.body.replaceChildren(container);
});

describe('render', () => {
  it('uses sentence-case section labels', () => {
    render(container, hip({ causedBy: { Geological: 1 }, causes: { Chemical: 1 } }));
    const labels = [...container.querySelectorAll('.section-label')].map(l => l.textContent);
    expect(labels).toEqual(['Caused by', 'Causes']);
  });

  it('hides the decorative connector overlay from assistive tech', () => {
    render(container, hip({ causes: { Chemical: 1 } }));
    expect(container.querySelector('svg.connector-overlay').getAttribute('aria-hidden')).toBe('true');
  });

  it('sets grid columns through a custom property so CSS can reflow narrow layouts', () => {
    render(container, hip({ causes: { Chemical: 3, Geological: 1 } }));
    const row = container.querySelector('.section-causes .group-row');
    expect(row.style.gridTemplateColumns).toBe('');
    expect(row.style.getPropertyValue('--hips-cols'))
      .toBe('minmax(140px, 3fr) minmax(140px, 1fr)');
  });

  it('flags sections that need a conduit lane', () => {
    render(container, hip({
      // Banner (4 same-type items) + another group → two rows
      causedBy: { Technological: 4, Geological: 1 },
      // One group only → never needs a conduit
      causes: { Chemical: 2 },
    }));
    const causedBy = container.querySelector('.section-causedby');
    const causes = container.querySelector('.section-causes');
    expect(causedBy.classList.contains('section--multirow')).toBe(true);
    expect(causedBy.classList.contains('section--multibox')).toBe(true);
    expect(causes.classList.contains('section--multirow')).toBe(false);
    expect(causes.classList.contains('section--multibox')).toBe(false);
  });

  it('marks multibox sections that fit on one row', () => {
    render(container, hip({ causes: { Chemical: 1, Geological: 1 } }));
    const causes = container.querySelector('.section-causes');
    expect(causes.classList.contains('section--multirow')).toBe(false);
    expect(causes.classList.contains('section--multibox')).toBe(true);
  });

  it('passes each box its item-count weight for the narrow wrapping layout', () => {
    render(container, hip({ causes: { Chemical: 16, Geological: 1 } }));
    const weights = [...container.querySelectorAll('.type-box')]
      .map(b => b.style.getPropertyValue('--hips-weight'));
    expect(weights).toEqual(['16', '1']);
  });

  it('passes an accessible header colour to each box', () => {
    render(container, hip({ causes: { 'Meteorological and Hydrological': 1 } }));
    const box = container.querySelector('.type-box');
    expect(box.style.getPropertyValue('--type-text')).toMatch(/^#[0-9A-F]{6}$/i);
  });
});
