/**
 * Application entry point.
 *
 * Reads the `?hip={CODE}` query parameter, fetches the corresponding
 * HIP from the PreventionWeb API, and renders the causal diagram into
 * the #app container. Shows loading/error states as appropriate.
 */

import { fetchHip } from './data/fetch-hip.js';
import { render } from './diagram/render.js';
import './styles.css';

const app = document.getElementById('app');

async function init() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('hip');

  if (!code) {
    showError(
      'No hazard code specified',
      'Add a <code>?hip=CODE</code> parameter to the URL.<br>' +
      'Example: <a href="?hip=TL0305">?hip=TL0305</a> (Fire) or ' +
      '<a href="?hip=MH0607">?hip=MH0607</a> (Glacial Lake Outburst Flooding)'
    );
    return;
  }

  showLoading(code);

  try {
    const graph = await fetchHip(code);
    document.title = `${graph.hazard.name} (${graph.hazard.code}) — HIPs Causal Diagram`;
    app.innerHTML = '';
    render(app, graph);
  } catch (err) {
    showError(
      `Failed to load hazard "${code}"`,
      `${sanitize(err.message)}<br><br>` +
      'Check the code and try again. ' +
      'Example: <a href="?hip=TL0305">?hip=TL0305</a> (Fire)'
    );
  }
}

/** Show a spinner while the API request is in flight. */
function showLoading(code) {
  app.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading hazard <strong>${sanitize(code)}</strong>...</p>
    </div>
  `;
}

/** Replace #app contents with an error banner. */
function showError(title, message) {
  app.innerHTML = `
    <div class="error-state">
      <h2>${sanitize(title)}</h2>
      <p>${message}</p>
    </div>
  `;
}

/**
 * Escape a string for safe insertion into HTML.
 * Uses the browser's own text-node escaping to handle &, <, >, etc.
 * @param {string} str
 * @returns {string} HTML-safe string
 */
function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

init();
