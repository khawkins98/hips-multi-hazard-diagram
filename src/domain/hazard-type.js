/**
 * HazardType — value object for a UNDRR-ISC hazard classification type.
 *
 * Instances are flyweights: HazardType.fromCode('TL0305') always returns
 * the same object as HazardType.fromCode('TL0201'), so instances can be
 * compared by reference equality (===) as well as by .equals().
 */

import { PREFIX_TO_TYPE, TYPE_COLORS } from '../data/hazard-types.js';

const DEFAULT_COLOR = { border: '#9E9E9E', bg: '#F5F5F5' };

const _cache = new Map();

export class HazardType {
  /**
   * @param {string} name - Display name, e.g. "Technological"
   * @param {{ border: string, bg: string }} color
   */
  constructor(name, color) {
    this.name = name;
    this.color = color;
    Object.freeze(this);
  }

  /**
   * Derive a HazardType from a HIP code's 2-letter prefix.
   * Returns a cached (flyweight) instance — same type name → same object.
   *
   * @param {string} code - e.g. "TL0305"
   * @returns {HazardType}
   */
  static fromCode(code) {
    const prefix = code ? String(code).substring(0, 2).toUpperCase() : '';
    const name = PREFIX_TO_TYPE[prefix] || 'Unknown';
    return HazardType._get(name);
  }

  /**
   * Look up a HazardType by its exact display name.
   * @param {string} name - e.g. "Technological"
   * @returns {HazardType}
   */
  static fromName(name) {
    return HazardType._get(name);
  }

  static _get(name) {
    if (_cache.has(name)) return _cache.get(name);
    const color = TYPE_COLORS[name] || DEFAULT_COLOR;
    const instance = new HazardType(name, color);
    _cache.set(name, instance);
    return instance;
  }

  /** True when both represent the same classification type. */
  equals(other) {
    return other instanceof HazardType && this.name === other.name;
  }

  toString() {
    return this.name;
  }
}
