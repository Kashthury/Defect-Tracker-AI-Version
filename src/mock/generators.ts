import { Defect, DefectStatusName, PriorityLevel, SeverityLevel, TestCase } from '@/types/defect'
import { STATUS_TYPE_CODES, StatusTypeCode } from '@/constants/statusTypes'

// Small deterministic pseudo-random generator so the dataset is stable across reloads.
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20260715)
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]

const PROJECTS = [
  { id: 'proj-1', name: 'Payments Platform' },
  { id: 'proj-2', name: 'Customer Onboarding' },
  { id: 'proj-3', name: 'Mobile Banking App' },
  { id: 'proj-4', name: 'Risk & Fraud Engine' },
  { id: 'proj-5', name: 'Regulatory Reporting' },
  { id: 'proj-6', name: 'Legacy Ledger Migration' },
] as const
const MODULES = ['Settlement Engine', 'Card Authorization', 'Wire Transfers', 'Document Verification', 'KYC Checks', 'Account Overview', 'Bill Pay', 'Push Notifications', 'Transaction Scoring'] as const
const SEVERITIES: SeverityLevel[] = ['Critical', 'High', 'Medium', 'Low']
const PRIORITIES: PriorityLevel[] = ['P1', 'P2', 'P3', 'P4']
const STATUSES: { code: StatusTypeCode; name: DefectStatusName }[] = [
  { code: STATUS_TYPE_CODES.NEW, name: 'New' },
  { code: STATUS_TYPE_CODES.ASSIGNED, name: 'Assigned' },
  { code: STATUS_TYPE_CODES.IN_PROGRESS, name: 'In Progress' },
  { code: STATUS_TYPE_CODES.FIXED, name: 'Fixed' },
  { code: STATUS_TYPE_CODES.RETEST, name: 'Retest' },
  { code: STATUS_TYPE_CODES.CLOSED, name: 'Closed' },
  { code: STATUS_TYPE_CODES.REOPENED, name: 'Reopened' },
]
const DEFECT_TYPES = ['Functional', 'UI/UX', 'Performance', 'Security', 'Data', 'Integration']
const PEOPLE = ['Arjun Mehta', 'Liam O\u2019Connor', 'Carlos Ibanez', 'Hana Kimura', 'Priya Raghavan', 'Meera Nair', 'Ada Fernando']
const TITLES = [
  'Timeout when submitting form under load',
  'Incorrect rounding on settlement amount',
  'Push notification not delivered on Android 14',
  'Session expires prematurely after idle 2 min',
  'Duplicate wire transfer created on retry',
  'KYC document upload fails for PDFs > 5MB',
  'Balance not refreshed after bill payment',
  'Fraud score not recalculated after address change',
  'Pagination breaks on last page of report',
  'Currency symbol missing for EUR accounts',
  'Race condition on concurrent card auth requests',
  'Export to CSV truncates long merchant names',
  'Dark mode contrast fails accessibility check',
  'Retry logic causes duplicate email notifications',
  'Incorrect timezone applied to statement dates',
]

function pad(n: number, width: number) {
  return String(n).padStart(width, '0')
}

function daysAgoIso(days: number) {
  const d = new Date('2026-07-15T09:00:00Z')
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export const ALL_DEFECTS: Defect[] = Array.from({ length: 10000 }, (_, i) => {
  const createdDaysAgo = Math.floor(rand() * 420)
  const updatedDaysAgo = Math.max(0, createdDaysAgo - Math.floor(rand() * 30))
  const status = pick(STATUSES)
  const project = pick(PROJECTS)
  return {
    id: `defect-${i + 1}`,
    defectKey: `DFX-${pad(10000 + i, 5)}`,
    title: pick(TITLES),
    projectId: project.id,
    projectName: project.name,
    releaseName: `R${1 + Math.floor(rand() * 12)}.${Math.floor(rand() * 9)}`,
    moduleName: pick(MODULES),
    severity: pick(SEVERITIES),
    priority: pick(PRIORITIES),
    statusCode: status.code,
    status: status.name,
    defectType: pick(DEFECT_TYPES),
    reportedBy: pick(PEOPLE),
    assignedTo: pick(PEOPLE),
    createdAt: daysAgoIso(createdDaysAgo),
    updatedAt: daysAgoIso(updatedDaysAgo),
  }
})

export const ALL_TEST_CASES: TestCase[] = Array.from({ length: 3000 }, (_, i) => {
  const executed = rand() > 0.15
  const execDaysAgo = Math.floor(rand() * 200)
  const project = pick(PROJECTS)
  return {
    id: `tc-${i + 1}`,
    testCaseKey: `TC-${pad(4000 + i, 5)}`,
    title: `Verify ${pick(MODULES).toLowerCase()} - ${pick(['happy path', 'edge case', 'negative flow', 'boundary values', 'regression'])}`,
    projectId: project.id,
    projectName: project.name,
    moduleName: pick(MODULES),
    priority: pick(PRIORITIES),
    status: executed ? pick(['Passed', 'Failed', 'Blocked'] as const) : 'Not Executed',
    lastExecutedBy: executed ? pick(PEOPLE) : '\u2014',
    lastExecutedAt: executed ? daysAgoIso(execDaysAgo) : null,
  }
})
