import { str, toArray } from './jsonld.js';
import { getHazardType } from './hazard-types.js';

const API_BASE = 'https://www.preventionweb.net/api/terms/hips/';

/**
 * Fetch a single HIP and return structured causal data.
 * @param {string} code - HIP code, e.g. "TL0305"
 * @returns {Promise<{
 *   name: string,
 *   code: string,
 *   type: { name: string, color: { border: string, bg: string } },
 *   causedBy: Map<string, Array<{ name: string, code: string }>>,
 *   causes: Map<string, Array<{ name: string, code: string }>>
 * }>}
 */
export async function fetchHip(code) {
  const res = await fetch(`${API_BASE}${encodeURIComponent(code)}`);
  if (!res.ok) {
    throw new Error(`API returned ${res.status} for code "${code}"`);
  }

  const json = await res.json();
  const graph = json['@graph'];
  if (!graph || !graph[0]) {
    throw new Error(`No data found for code "${code}"`);
  }

  const concept = graph[0];
  const name = str(concept['skos:prefLabel']);
  const identifier = str(concept['dct:identifier']);
  const type = getHazardType(identifier);

  const causedBy = groupByType(toArray(concept['xkos:causedBy']));
  const causes = groupByType(toArray(concept['xkos:causes']));

  return { name, code: identifier, type, causedBy, causes };
}

/**
 * Extract name/code from a causedBy/causes entry and group by hazard type.
 * @param {Array} entries - JSON-LD entries from xkos:causedBy or xkos:causes
 * @returns {Map<string, Array<{ name: string, code: string }>>}
 */
function groupByType(entries) {
  const groups = new Map();

  for (const entry of entries) {
    const code = str(entry['dct:identifier']);
    const name = str(entry['skos:prefLabel']);
    if (!code) continue;

    const { name: typeName } = getHazardType(code);

    if (!groups.has(typeName)) {
      groups.set(typeName, []);
    }
    groups.get(typeName).push({ name, code });
  }

  // Sort items within each group by code ascending
  for (const items of groups.values()) {
    items.sort((a, b) => a.code.localeCompare(b.code));
  }

  return groups;
}
