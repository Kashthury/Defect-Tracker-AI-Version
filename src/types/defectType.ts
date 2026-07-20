/**
 * Defect Type Management module payloads.
 *
 * The core entity (`DefectTypeConfig`) lives in types/defect.ts. These payloads
 * model the create/update surface and map cleanly onto a future Spring Boot API.
 */

export interface CreateDefectTypePayload {
  /** Defect Type Name — required, unique, trimmed before validation. */
  name: string
  description?: string
}

export interface UpdateDefectTypePayload {
  name: string
  description?: string
}
