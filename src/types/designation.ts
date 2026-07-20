/**
 * Designation Management module types.
 *
 * The core entity (`Designation`) lives in types/auth.ts as `{ id, title }`
 * and is referenced by employee records. These payloads model the
 * create/update surface and map cleanly onto a future Spring Boot API.
 */

export interface CreateDesignationPayload {
  /** Designation Name — required, unique, trimmed before validation. */
  title: string
}

export interface UpdateDesignationPayload {
  title: string
}
