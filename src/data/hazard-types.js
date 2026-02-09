/**
 * Hazard type definitions: prefix-to-type mapping and color palette.
 * Colors adapted from hips-multihazard parent project, adjusted for
 * the diagram's light-background context per PRD color spec.
 */

export const PREFIX_TO_TYPE = {
  BI: 'Biological',
  MH: 'Meteorological and Hydrological',
  TL: 'Technological',
  CH: 'Chemical',
  GH: 'Geological',
  EN: 'Environmental',
  ET: 'Extraterrestrial',
  SO: 'Societal',
};

export const TYPE_COLORS = {
  'Biological':                       { border: '#F44336', bg: '#FDECEA' },
  'Meteorological and Hydrological':  { border: '#00796B', bg: '#E0F2F1' },
  'Technological':                    { border: '#F9A825', bg: '#FFF8E1' },
  'Chemical':                         { border: '#1565C0', bg: '#E3F2FD' },
  'Geological':                       { border: '#8B1A1A', bg: '#F3E5E5' },
  'Environmental':                    { border: '#388E3C', bg: '#E8F5E9' },
  'Extraterrestrial':                 { border: '#9C27B0', bg: '#F3E5F5' },
  'Societal':                         { border: '#7B1FA2', bg: '#EDE7F6' },
};

const DEFAULT_COLOR = { border: '#9E9E9E', bg: '#F5F5F5' };

/**
 * Derive hazard type info from a HIP code's 2-letter prefix.
 * @param {string} code - e.g. "TL0305"
 * @returns {{ name: string, color: { border: string, bg: string } }}
 */
export function getHazardType(code) {
  const prefix = code ? code.substring(0, 2).toUpperCase() : '';
  const name = PREFIX_TO_TYPE[prefix] || 'Unknown';
  const color = TYPE_COLORS[name] || DEFAULT_COLOR;
  return { name, color };
}
