export const APP_NAME = 'DefectTrack'

/** Inactivity timeout, in milliseconds, before the session is auto-terminated. */
export const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

export const DEFAULT_PAGE_SIZE = 10

export const SESSION_STORAGE_KEY = 'defecttrack.session'

export const SELECTED_PROJECT_STORAGE_KEY = 'defect-tracker-selected-project'
