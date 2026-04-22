import { str, toArray } from './jsonld.js';
import { Hazard } from '../domain/hazard.js';
import { HazardType } from '../domain/hazard-type.js';
import { CausalGraph } from '../domain/causal-graph.js';

const API_BASE = 'https://www.preventionweb.net/api/terms/hips/';

/**
 * Fetch a single HIP and return a typed CausalGraph read model.
 *
 * @param {string} code - HIP code, e.g. "TL0305"
 * @returns {Promise<CausalGraph>}
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
  const type = HazardType.fromCode(identifier);
  const hazard = new Hazard({ code: identifier, name, type });

  const causedBy = groupByType(toArray(concept['xkos:causedBy']));
  const causes = groupByType(toArray(concept['xkos:causes']));

  return new CausalGraph({ hazard, causedBy, causes });
}

/**
 * Extract name/code from a causedBy/causes entry and group by hazard type.
 *
 * @param {Array} entries - JSON-LD entries from xkos:causedBy or xkos:causes
 * @returns {Map<string, { type: HazardType, hazards: Hazard[] }>}
 */
function groupByType(entries) {
  const groups = new Map();

  for (const entry of entries) {
    const code = str(entry['dct:identifier']);
    const name = str(entry['skos:prefLabel']);
    if (!code) continue;

    const type = HazardType.fromCode(code);
    if (!groups.has(type.name)) {
      groups.set(type.name, { type, hazards: [] });
    }
    groups.get(type.name).hazards.push(new Hazard({ code, name, type }));
  }

  // Sort hazards within each group by code ascending
  for (const { hazards } of groups.values()) {
    hazards.sort((a, b) => a.code.raw.localeCompare(b.code.raw));
  }

  return groups;
}
