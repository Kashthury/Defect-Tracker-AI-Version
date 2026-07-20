/**
 * Priority Management module payloads.
 *
 * The core entity (`PriorityConfig`) lives in types/defect.ts. These payloads
 * model the create/update surface and map cleanly onto a future Spring Boot API.
 */

export interface CreatePriorityPayload {
  /** Priority Name — required, unique, trimmed before validation. */
  name: string
  description?: string
  /** Hex color chosen via the color picker, e.g. "#C13B3B". */
  color: string
}

export interface UpdatePriorityPayload {
  name: string
  description?: string
  color: string
}
