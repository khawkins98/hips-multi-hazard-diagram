/**
 * Hazard type definitions: prefix-to-type mapping and color palette.
 * Colors sourced from the UNDRR-ISC Hazard Definition & Classification
 * Review Technical Report wheel diagram (page 5).
 * Border = circle color from the wheel; bg = light tint for diagram boxes.
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
  'Biological':                       { border: '#1A1A1A', bg: '#E8E8E8' },
  'Meteorological and Hydrological':  { border: '#3AAE2B', bg: '#E8F5E5' },
  'Technological':                    { border: '#B8860B', bg: '#F5EDD6' },
  'Chemical':                         { border: '#5B92C5', bg: '#ECF2F9' },
  'Geological':                       { border: '#C21E2C', bg: '#F9E6E8' },
  'Environmental':                    { border: '#1B355F', bg: '#E3E8EF' },
  'Extraterrestrial':                 { border: '#E8792B', bg: '#FCF0E8' },
  'Societal':                         { border: '#8B3FA0', bg: '#F2E8F6' },
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
