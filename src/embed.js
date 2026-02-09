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
import embedStyles from './embed-styles.css?inline';

let stylesInjected = false;

/** Inject scoped CSS into <head> once. */
function injectStyles() {
  if (stylesInjected) return;
  const style = document.createElement('style');
  style.textContent = embedStyles;
  document.head.appendChild(style);
  stylesInjected = true;
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
