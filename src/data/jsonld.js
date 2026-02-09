/**
 * JSON-LD value extraction helpers for SKOS/XKOS data.
 * Adapted from hips-multihazard parent project.
 */

/** Extract a plain string from a JSON-LD value. */
export function str(val) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val['@value']) return val['@value'];
  return '';
}

/** Extract the @id URI from a JSON-LD reference. */
export function refId(val) {
  if (!val) return null;
  if (typeof val === 'string') return val;
  return val['@id'] || null;
}

/** Normalize a value to an array. */
export function toArray(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}
