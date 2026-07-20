import { SelectOption } from '@/types/common'

/**
 * Controlled status codes shared by defects, test cases, releases, and workflow setup.
 * Codes are stable API identifiers; only their user-facing names and colors are configurable.
 */
export const STATUS_TYPE_CODES = {
  NEW: 'NEW',
  OPEN: 'OPEN',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  FIXED: 'FIXED',
  RETEST: 'RETEST',
  CLOSED: 'CLOSED',
  REOPENED: 'REOPENED',
  REJECTED: 'REJECTED',
  DUPLICATE: 'DUPLICATE',
  FAILED: 'FAILED',
  PENDING: 'PENDING',
  ON_HOLD: 'ON_HOLD',
  CANCELLED: 'CANCELLED',
  NOT_EXECUTED: 'NOT_EXECUTED',
  PASSED: 'PASSED',
  BLOCKED: 'BLOCKED',
  PLANNED: 'PLANNED',
  RELEASED: 'RELEASED',
} as const

export type StatusTypeCode = (typeof STATUS_TYPE_CODES)[keyof typeof STATUS_TYPE_CODES]

export const STATUS_TYPE_LABELS: Record<StatusTypeCode, string> = {
  [STATUS_TYPE_CODES.NEW]: 'New',
  [STATUS_TYPE_CODES.OPEN]: 'Open',
  [STATUS_TYPE_CODES.ASSIGNED]: 'Assigned',
  [STATUS_TYPE_CODES.IN_PROGRESS]: 'In Progress',
  [STATUS_TYPE_CODES.FIXED]: 'Fixed',
  [STATUS_TYPE_CODES.RETEST]: 'Retest',
  [STATUS_TYPE_CODES.CLOSED]: 'Closed',
  [STATUS_TYPE_CODES.REOPENED]: 'Reopened',
  [STATUS_TYPE_CODES.REJECTED]: 'Rejected',
  [STATUS_TYPE_CODES.DUPLICATE]: 'Duplicate',
  [STATUS_TYPE_CODES.FAILED]: 'Failed',
  [STATUS_TYPE_CODES.PENDING]: 'Pending',
  [STATUS_TYPE_CODES.ON_HOLD]: 'On Hold',
  [STATUS_TYPE_CODES.CANCELLED]: 'Cancelled',
  [STATUS_TYPE_CODES.NOT_EXECUTED]: 'Not Executed',
  [STATUS_TYPE_CODES.PASSED]: 'Passed',
  [STATUS_TYPE_CODES.BLOCKED]: 'Blocked',
  [STATUS_TYPE_CODES.PLANNED]: 'Planned',
  [STATUS_TYPE_CODES.RELEASED]: 'Released',
}

export const STATUS_TYPE_VALUES = Object.values(STATUS_TYPE_CODES)

export const STATUS_TYPE_OPTIONS: SelectOption[] = STATUS_TYPE_VALUES.map((code) => ({
  label: STATUS_TYPE_LABELS[code],
  value: code,
}))

/** Options for configuration forms where the immutable enum code is selected explicitly. */
export const STATUS_TYPE_CODE_OPTIONS: SelectOption[] = STATUS_TYPE_VALUES.map((code) => ({
  label: code,
  value: code,
}))

/** Status codes that are valid choices for a defect lifecycle. */
export const DEFECT_STATUS_CODES: readonly StatusTypeCode[] = [
  STATUS_TYPE_CODES.NEW,
  STATUS_TYPE_CODES.OPEN,
  STATUS_TYPE_CODES.ASSIGNED,
  STATUS_TYPE_CODES.IN_PROGRESS,
  STATUS_TYPE_CODES.FIXED,
  STATUS_TYPE_CODES.RETEST,
  STATUS_TYPE_CODES.CLOSED,
  STATUS_TYPE_CODES.REOPENED,
  STATUS_TYPE_CODES.REJECTED,
  STATUS_TYPE_CODES.DUPLICATE,
  STATUS_TYPE_CODES.FAILED,
  STATUS_TYPE_CODES.PENDING,
  STATUS_TYPE_CODES.ON_HOLD,
  STATUS_TYPE_CODES.CANCELLED,
]

export const isStatusTypeCode = (value: string): value is StatusTypeCode =>
  STATUS_TYPE_VALUES.some((code) => code === value)

export const formatStatusTypeCode = (code: string | undefined): string =>
  code && isStatusTypeCode(code) ? STATUS_TYPE_LABELS[code] : 'Unknown'
