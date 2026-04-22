/**
 * CausalGraph — typed read model for the full causal data of a single HIP.
 *
 * This is not a mutable aggregate — it is a structured view of the data
 * returned by the PreventionWeb API, expressed in domain terms rather than
 * raw JSON-LD shapes.
 *
 * causedBy / causes are Maps keyed by type name string (a stable primitive)
 * to avoid JS reference-equality issues with object keys. Each value carries
 * both the typed HazardType object and the sorted list of Hazard entities.
 */

export class CausalGraph {
  /**
   * @param {object} params
   * @param {import('./hazard.js').Hazard} params.hazard - The focal hazard
   * @param {Map<string, { type: import('./hazard-type.js').HazardType, hazards: import('./hazard.js').Hazard[] }>} params.causedBy
   * @param {Map<string, { type: import('./hazard-type.js').HazardType, hazards: import('./hazard.js').Hazard[] }>} params.causes
   */
  constructor({ hazard, causedBy, causes }) {
    this.hazard = hazard;
    this.causedBy = causedBy;
    this.causes = causes;
  }
}
