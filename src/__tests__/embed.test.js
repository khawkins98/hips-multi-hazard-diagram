// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

const apiResponse = {
  '@graph': [{
    'skos:prefLabel': 'Fire',
    'dct:identifier': 'TL0305',
    'xkos:causes': [{ 'skos:prefLabel': 'Toxic Gases', 'dct:identifier': 'CH0300' }],
  }],
};

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('requestAnimationFrame', () => 0);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => apiResponse })));
  document.head.replaceChildren();
  document.body.innerHTML =
    '<div data-hips-diagram="TL0305"></div><div data-hips-diagram="TL0305"></div>';
});

/** Let pending fetch/render promises settle. */
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('embed script', () => {
  it('renders one diagram into each container', async () => {
    await import('../embed.js');
    await flush();
    expect(document.querySelectorAll('.hips-diagram')).toHaveLength(2);
    expect(document.querySelector('.center-node').textContent).toBe('Fire (TL0305)');
  });

  it('does not render twice or duplicate styles when included twice', async () => {
    await import('../embed.js');
    vi.resetModules();
    await import('../embed.js');
    await flush();
    expect(document.querySelectorAll('.hips-diagram')).toHaveLength(2);
    expect(document.querySelectorAll('style[data-hips-diagram-styles]')).toHaveLength(1);
  });

  it('retries a container whose load failed when the script is included again', async () => {
    fetch.mockImplementationOnce(async () => ({ ok: false, status: 503 }));
    fetch.mockImplementationOnce(async () => ({ ok: false, status: 503 }));
    await import('../embed.js');
    await flush();
    expect(document.querySelectorAll('.error-state')).toHaveLength(2);

    vi.resetModules();
    await import('../embed.js');
    await flush();
    expect(document.querySelectorAll('.error-state')).toHaveLength(0);
    expect(document.querySelectorAll('.center-node')).toHaveLength(2);
  });
});
