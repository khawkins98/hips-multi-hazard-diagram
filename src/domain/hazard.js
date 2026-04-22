/**
 * Hazard — entity representing a single UNDRR HIP entry.
 *
 * Combines a typed code (HazardCode), a display name, and a
 * classification type (HazardType) into a single cohesive object.
 */

import { HazardCode } from './hazard-code.js';
import { HazardType } from './hazard-type.js';

export class Hazard {
  /**
   * @param {{ code: string|HazardCode, name: string, type?: HazardType }} params
   */
  constructor({ code, name, type }) {
    this.code = code instanceof HazardCode ? code : new HazardCode(String(code));
    this.name = String(name);
    this.type = type instanceof HazardType ? type : HazardType.fromCode(String(code));
  }

  toString() {
    return `${this.name} (${this.code.raw})`;
  }
}
