import { mockProjects } from '@/mock/projects'
import { mockReleases } from '@/mock/releases'
import { mockSeverities } from '@/mock/configuration'
import { STATUS_TYPE_CODES, StatusTypeCode } from '@/constants/statusTypes'
import { DASHBOARD_DEFECT_TYPES, DASHBOARD_STATUS_MATRIX } from '@/mock/dashboardConfig'
import { ActivityType } from '@/types/dashboard'

/**
 * Deterministic pseudo-random generator (same approach as mock/generators.ts)
 * so the dashboard dataset is stable across reloads without needing a
 * database. Swap this module out for real API calls once the backend exists;
 * nothing else in the dashboard services touches Math.random directly.
 */
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(842020)
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]
const weightedPick = <T,>(entries: [T, number][]): T => {
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let roll = rand() * total
  for (const [value, weight] of entries) {
    roll -= weight
    if (roll <= 0) return value
  }
  return entries[entries.length - 1][0]
}

function daysAgoIso(days: number, from = '2026-07-17T09:00:00Z') {
  const d = new Date(from)
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export interface DashboardModule {
  id: string
  projectId: string
  name: string
}

const MODULE_NAME_POOL = [
  'Settlement Engine', 'Card Authorization', 'Wire Transfers', 'Batch Processing',
  'Document Verification', 'KYC Checks', 'Sanctions Screening', 'Onboarding Flow',
  'Account Overview', 'Bill Pay', 'Push Notifications', 'Biometric Login',
  'Transaction Scoring', 'Fraud Rules Engine', 'Case Management',
  'Regulatory Extracts', 'Report Scheduler', 'Data Reconciliation',
  'Ledger Migration', 'Data Mapping Layer',
]

export const DASHBOARD_MODULES: DashboardModule[] = mockProjects.flatMap((project, projectIndex) => {
  const moduleCount = 3 + Math.floor(rand() * 3) // 3-5 modules per project
  const startIndex = (projectIndex * 4) % MODULE_NAME_POOL.length
  return Array.from({ length: moduleCount }, (_, i) => ({
    id: `dmod-${project.id}-${i + 1}`,
    projectId: project.id,
    name: MODULE_NAME_POOL[(startIndex + i) % MODULE_NAME_POOL.length],
  }))
})

export interface DashboardDefect {
  id: string
  projectId: string
  releaseId: string | null
  moduleId: string
  moduleName: string
  severityName: string
  severityWeight: number
  statusCode: StatusTypeCode
  defectTypeName: string
  reportedAt: string
  closedAt: string | null
  daysToFind: number
  daysToFix: number | null
  reopenCount: number
}

const SEVERITY_WEIGHTS: [string, number][] = mockSeverities.map((s) => [s.name, s.name === 'Critical' ? 12 : s.name === 'High' ? 28 : s.name === 'Medium' ? 38 : 22])
const STATUS_WEIGHTS: [StatusTypeCode, number][] = DASHBOARD_STATUS_MATRIX.map((code) => {
  if (code === STATUS_TYPE_CODES.CLOSED) return [code, 30]
  if (code === STATUS_TYPE_CODES.FIXED) return [code, 12]
  if (code === STATUS_TYPE_CODES.OPEN) return [code, 14]
  if (code === STATUS_TYPE_CODES.NEW) return [code, 10]
  if (code === STATUS_TYPE_CODES.IN_PROGRESS) return [code, 10]
  if (code === STATUS_TYPE_CODES.REOPENED) return [code, 5]
  if (code === STATUS_TYPE_CODES.PENDING) return [code, 5]
  if (code === STATUS_TYPE_CODES.ON_HOLD) return [code, 3]
  if (code === STATUS_TYPE_CODES.REJECTED) return [code, 4]
  if (code === STATUS_TYPE_CODES.DUPLICATE) return [code, 3]
  if (code === STATUS_TYPE_CODES.FAILED) return [code, 3]
  return [code, 2] // CANCELLED
})
const CLOSED_LIKE: StatusTypeCode[] = [STATUS_TYPE_CODES.CLOSED, STATUS_TYPE_CODES.FIXED]
const TYPE_WEIGHTS: [string, number][] = DASHBOARD_DEFECT_TYPES.map((t) => [t.name, t.name === 'Functional' ? 24 : t.name === 'UI' ? 16 : 10])
const REOPEN_WEIGHTS: [number, number][] = [[0, 62], [1, 20], [2, 10], [3, 5], [4, 3]]

const DEFECT_COUNT_BY_PROJECT: Record<string, number> = {
  'proj-1': 620, 'proj-2': 260, 'proj-3': 840, 'proj-4': 120, 'proj-5': 18, 'proj-6': 340,
}

export const DASHBOARD_DEFECTS: DashboardDefect[] = mockProjects.flatMap((project) => {
  const count = DEFECT_COUNT_BY_PROJECT[project.id] ?? 100
  const modules = DASHBOARD_MODULES.filter((m) => m.projectId === project.id)
  const releases = mockReleases.filter((r) => r.projectId === project.id)
  return Array.from({ length: count }, (_, i) => {
    const module = pick(modules)
    const release = releases.length > 0 && rand() > 0.05 ? pick(releases) : null
    const severityName = weightedPick(SEVERITY_WEIGHTS)
    const severityWeight = mockSeverities.find((s) => s.name === severityName)?.weight ?? 10
    const statusCode = weightedPick(STATUS_WEIGHTS)
    const reportedDaysAgo = Math.floor(rand() * 360)
    const isResolved = CLOSED_LIKE.includes(statusCode)
    const daysToFind = 1 + Math.floor(rand() * 18)
    const daysToFix = isResolved ? 1 + Math.floor(rand() * 35) : null
    const closedAt = isResolved ? daysAgoIso(Math.max(0, reportedDaysAgo - (daysToFix ?? 0))) : null
    return {
      id: `ddef-${project.id}-${i + 1}`,
      projectId: project.id,
      releaseId: release?.id ?? null,
      moduleId: module.id,
      moduleName: module.name,
      severityName,
      severityWeight,
      statusCode,
      defectTypeName: weightedPick(TYPE_WEIGHTS),
      reportedAt: daysAgoIso(reportedDaysAgo),
      closedAt,
      daysToFind,
      daysToFix,
      reopenCount: weightedPick(REOPEN_WEIGHTS),
    }
  })
})

/** In-memory KLOC store, standing in for a persisted project.kloc column. */
const DEFAULT_KLOC: Record<string, number> = {
  'proj-1': 420, 'proj-2': 185, 'proj-3': 610, 'proj-4': 96, 'proj-5': 14, 'proj-6': 305,
}
export const KLOC_STORE = new Map<string, number>(Object.entries(DEFAULT_KLOC))

export interface DashboardActivity {
  id: string
  projectId: string
  type: ActivityType
  message: string
  actorName: string
  timestamp: string
}

const ACTORS = ['Priya Raghavan', 'Meera Nair', 'Arjun Mehta', 'Hana Kimura', 'Carlos Ibanez', 'Liam O\u2019Connor']
const ACTIVITY_TEMPLATES: { type: ActivityType; message: (m: string) => string }[] = [
  { type: 'DEFECT_CREATED', message: (m) => `New defect logged against ${m}` },
  { type: 'DEFECT_ASSIGNED', message: (m) => `Defect in ${m} assigned for triage` },
  { type: 'DEFECT_STATUS_CHANGED', message: (m) => `Defect status updated in ${m}` },
  { type: 'DEFECT_FIXED', message: (m) => `Defect marked fixed in ${m}` },
  { type: 'DEFECT_REOPENED', message: (m) => `Defect reopened after retest in ${m}` },
  { type: 'RELEASE_UPDATED', message: () => 'Release schedule updated' },
  { type: 'KLOC_UPDATED', message: () => 'Project KLOC recalculated from repository scan' },
  { type: 'PROJECT_RISK_RECALCULATED', message: () => 'Project risk score recalculated' },
]

export const DASHBOARD_ACTIVITY: DashboardActivity[] = mockProjects.flatMap((project, projectIndex) => {
  const modules = DASHBOARD_MODULES.filter((m) => m.projectId === project.id)
  return Array.from({ length: 14 }, (_, i) => {
    const template = pick(ACTIVITY_TEMPLATES)
    const module = modules.length ? pick(modules).name : project.name
    return {
      id: `dact-${project.id}-${i + 1}`,
      projectId: project.id,
      type: template.type,
      message: template.message(module),
      actorName: pick(ACTORS),
      timestamp: daysAgoIso(i * 1.6 + projectIndex * 0.3 + rand() * 2),
    }
  })
})
