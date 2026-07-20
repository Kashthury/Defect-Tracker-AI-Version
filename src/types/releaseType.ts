/**
 * Release Type Management module payloads.
 *
 * The core entity (`ReleaseTypeConfig`) lives in types/defect.ts. These payloads
 * model the create/update surface and map cleanly onto a future Spring Boot API.
 */

export interface CreateReleaseTypePayload {
  /** Release Type Name — required, unique, trimmed before validation. */
  name: string
  description?: string
}

export interface UpdateReleaseTypePayload {
  name: string
  description?: string
}
