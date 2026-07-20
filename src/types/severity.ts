/**
 * Severity Management module payloads.
 *
 * `weight` is the numeric impact factor used by Dashboard to calculate
 * severity defect index values from defect counts.
 */

export interface CreateSeverityPayload {
  /** Severity Name - required, unique, trimmed before validation. */
  name: string
  description?: string
  /** Dashboard impact factor. Higher values produce a higher severity defect index. */
  weight: number
  /** Hex color chosen via the color picker, e.g. "#C13B3B". */
  color: string
}

export interface UpdateSeverityPayload {
  name: string
  description?: string
  weight: number
  color: string
}
