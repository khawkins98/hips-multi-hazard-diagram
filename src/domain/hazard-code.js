/**
 * HazardCode — value object for a UNDRR HIP code string.
 *
 * Encapsulates prefix/numeric parsing and the "is consecutive"
 * predicate used by range-collapse formatting logic.
 *
 * Examples of valid codes: "TL0305", "EN0101", "MH0607"
 * Format: two uppercase letters + one or more digits.
 */

const CODE_RE = /^([A-Z]{2})(\d+)$/;

export class HazardCode {
  /**
   * @param {string} raw - The raw code string, e.g. "TL0305"
   */
  constructor(raw) {
    this.raw = String(raw);
    const m = this.raw.match(CODE_RE);
    this.prefix = m ? m[1] : null;
    this.numericPart = m ? parseInt(m[2], 10) : NaN;
    /** True when the code matches the expected HIP format. */
    this.isValid = m !== null;
  }

  /**
   * Returns true if this code immediately precedes `other` in sequence.
   * Requires the same 2-letter prefix and a numeric part that differs by exactly 1.
   *
   * Used by collapseToRanges() to identify runs of consecutive codes.
   *
   * @param {HazardCode} other
   * @returns {boolean}
   */
  isConsecutiveTo(other) {
    return (
      this.isValid &&
      other.isValid &&
      this.prefix === other.prefix &&
      other.numericPart === this.numericPart + 1
    );
  }

  toString() {
    return this.raw;
  }
}
