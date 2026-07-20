import { STATUS_TYPE_CODES, StatusTypeCode } from '@/constants/statusTypes'

/**
 * Dashboard defect-type catalog. Kept separate from Configuration > Defect Type
 * management (which drives defect entry forms) because the analytics
 * dashboard must always report against this fixed classification set,
 * independent of how a given project labels its own defect types. A future
 * backend would serve this from GET /api/dashboard/defect-type-catalog.
 */
export interface DashboardDefectTypeConfig {
  id: string
  name: string
  color: string
}

export const DASHBOARD_DEFECT_TYPES: DashboardDefectTypeConfig[] = [
  { id: 'ddt-1', name: 'Functional', color: '#2E8FC9' },
  { id: 'ddt-2', name: 'UI', color: '#6FB6DE' },
  { id: 'ddt-3', name: 'Performance', color: '#D97A3F' },
  { id: 'ddt-4', name: 'Security', color: '#C13B3B' },
  { id: 'ddt-5', name: 'Database', color: '#8B5CF6' },
  { id: 'ddt-6', name: 'Integration', color: '#3E8E64' },
  { id: 'ddt-7', name: 'Configuration', color: '#C99A2E' },
  { id: 'ddt-8', name: 'API', color: '#0D3B66' },
]

/** Confirmed defect statuses used by the Defect-to-Remark Ratio calculation. */
export const CONFIRMED_DEFECT_STATUSES: StatusTypeCode[] = [
  STATUS_TYPE_CODES.NEW,
  STATUS_TYPE_CODES.OPEN,
  STATUS_TYPE_CODES.IN_PROGRESS,
  STATUS_TYPE_CODES.CLOSED,
  STATUS_TYPE_CODES.REOPENED,
  STATUS_TYPE_CODES.FIXED,
  STATUS_TYPE_CODES.FAILED,
  STATUS_TYPE_CODES.PENDING,
  STATUS_TYPE_CODES.ON_HOLD,
]

/** Non-confirmed remark statuses excluded from Defect-to-Remark calculations. */
export const NON_CONFIRMED_DEFECT_STATUSES: StatusTypeCode[] = [
  STATUS_TYPE_CODES.REJECTED,
  STATUS_TYPE_CODES.DUPLICATE,
  STATUS_TYPE_CODES.CANCELLED,
]

/** Full set of statuses tracked by the Defect Severity Breakdown grid. */
export const DASHBOARD_STATUS_MATRIX: StatusTypeCode[] = [
  ...CONFIRMED_DEFECT_STATUSES,
  ...NON_CONFIRMED_DEFECT_STATUSES,
]
