/**
 * Embed entry point for the HIPs causal diagram.
 *
 * Site owners include this script and add container elements with
 * `data-hips-diagram="{CODE}"` attributes. The script auto-discovers
 * all containers and renders a diagram into each one.
 *
 * Usage:
 *   <div data-hips-diagram="TL0305"></div>
 *   <script src="https://khawkins98.github.io/hips-multi-hazard-diagram/hips-diagram.js"></script>
 */

import { fetchHip } from './data/fetch-hip.js';
import { render } from './diagram/render.js';
import embedStyles from './diagram-styles.css?inline';

/**
 * Inject scoped CSS into <head> once per page. Checked through the DOM
 * rather than a module flag, so including the script twice is harmless.
 */
function injectStyles() {
  if (document.querySelector('style[data-hips-diagram-styles]')) return;
  const style = document.createElement('style');
  style.setAttribute('data-hips-diagram-styles', '');
  style.textContent = embedStyles;
  document.head.appendChild(style);
}

/**
 * Escape a string for safe insertion into HTML.
 * @param {string} str
 * @returns {string}
 */
function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Initialize a single diagram container.
 * @param {HTMLElement} container - Element with data-hips-diagram attribute
 */
async function initDiagram(container) {
  const code = container.getAttribute('data-hips-diagram');
  if (!code) return;

  // Skip containers already claimed (e.g. the script was included twice)
  if (container.hasAttribute('data-hips-diagram-ready')) return;
  container.setAttribute('data-hips-diagram-ready', '');

  // Clear the error panel left by an earlier failed attempt
  for (const old of container.querySelectorAll(':scope > .hips-diagram')) old.remove();

  // Create scoped wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'hips-diagram';

  // Show loading state
  wrapper.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading hazard <strong>${sanitize(code)}</strong>...</p>
    </div>
  `;
  container.appendChild(wrapper);

  try {
    const data = await fetchHip(code);
    wrapper.innerHTML = '';
    render(wrapper, data);
  } catch (err) {
    // Let a later include of the script retry this container
    container.removeAttribute('data-hips-diagram-ready');
    wrapper.innerHTML = `
      <div class="error-state">
        <h2>Failed to load hazard "${sanitize(code)}"</h2>
        <p>${sanitize(err.message)}</p>
      </div>
    `;
  }
}

/** Discover all containers and initialize diagrams. */
function init() {
  injectStyles();
  const containers = document.querySelectorAll('[data-hips-diagram]');
  containers.forEach(initDiagram);
}

// Auto-initialize when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
