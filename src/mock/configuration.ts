import {
  DefectTypeConfig,
  ReleaseTypeConfig,
  SeverityConfig,
  PriorityConfig,
} from '@/types/defect'
import { STATUS_TYPE_CODES } from '@/constants/statusTypes'
import { StatusTypeRecord } from '@/types/statusType'

export const mockDefectTypes: DefectTypeConfig[] = [
  { id: 'dt-1', name: 'Functional', description: 'Behavior does not match requirements.', active: true, createdAt: '2024-01-05T08:00:00Z' },
  { id: 'dt-2', name: 'UI/UX', description: 'Visual, layout, or usability issue.', active: true, createdAt: '2024-01-08T09:30:00Z' },
  { id: 'dt-3', name: 'Performance', description: 'Latency, throughput, or resource issue.', active: true, createdAt: '2024-01-12T10:15:00Z' },
  { id: 'dt-4', name: 'Security', description: 'Vulnerability or access-control issue.', active: true, createdAt: '2024-02-01T11:00:00Z' },
  { id: 'dt-5', name: 'Data', description: 'Incorrect, missing, or corrupted data.', active: true, createdAt: '2024-02-18T13:45:00Z' },
  { id: 'dt-6', name: 'Integration', description: 'Failure between two integrated systems.', active: true, createdAt: '2024-03-03T14:20:00Z' },
]

export const mockReleaseTypes: ReleaseTypeConfig[] = [
  { id: 'rt-1', name: 'Major', description: 'Significant feature or breaking release.', active: true, createdAt: '2024-01-06T08:00:00Z' },
  { id: 'rt-2', name: 'Minor', description: 'Incremental feature release.', active: true, createdAt: '2024-01-09T09:30:00Z' },
  { id: 'rt-3', name: 'Patch', description: 'Small fixes, no new features.', active: true, createdAt: '2024-01-15T10:15:00Z' },
  { id: 'rt-4', name: 'Hotfix', description: 'Urgent out-of-band production fix.', active: true, createdAt: '2024-02-02T11:00:00Z' },
]

export const mockSeverities: SeverityConfig[] = [
  {
    id: 'sev-1',
    name: 'Critical',
    description: 'Production outage, data loss, or blocker with no workaround.',
    weight: 100,
    color: '#C13B3B',
    colorTone: 'critical',
    active: true,
    createdAt: '2024-01-06T08:00:00Z',
  },
  {
    id: 'sev-2',
    name: 'High',
    description: 'Major business impact with limited workaround.',
    weight: 75,
    color: '#D97A3F',
    colorTone: 'high',
    active: true,
    createdAt: '2024-01-06T08:05:00Z',
  },
  {
    id: 'sev-3',
    name: 'Medium',
    description: 'Moderate impact that should be planned into an upcoming fix cycle.',
    weight: 40,
    color: '#C99A2E',
    colorTone: 'medium',
    active: true,
    createdAt: '2024-01-06T08:10:00Z',
  },
  {
    id: 'sev-4',
    name: 'Low',
    description: 'Minor issue or cosmetic problem with low business impact.',
    weight: 10,
    color: '#3E8E64',
    colorTone: 'low',
    active: true,
    createdAt: '2024-01-06T08:15:00Z',
  },
]

export const mockPriorities: PriorityConfig[] = [
  { id: 'pr-1', name: 'P1', description: 'Blocks release, fix immediately.', color: '#C13B3B', active: true, createdAt: '2024-01-06T08:00:00Z' },
  { id: 'pr-2', name: 'P2', description: 'High impact, fix before release.', color: '#D97A3F', active: true, createdAt: '2024-01-06T08:05:00Z' },
  { id: 'pr-3', name: 'P3', description: 'Moderate impact, schedule fix.', color: '#C99A2E', active: true, createdAt: '2024-01-06T08:10:00Z' },
  { id: 'pr-4', name: 'P4', description: 'Low impact, fix when convenient.', color: '#3E8E64', active: true, createdAt: '2024-01-06T08:15:00Z' },
]

export const mockStatusTypes: StatusTypeRecord[] = [
  { id: 'st-1', code: STATUS_TYPE_CODES.NEW, name: 'New', color: '#3E6FBF', createdAt: '2024-01-06T08:00:00Z' },
  { id: 'st-2', code: STATUS_TYPE_CODES.ASSIGNED, name: 'Assigned', color: '#6B4FA0', createdAt: '2024-01-06T08:05:00Z' },
  { id: 'st-3', code: STATUS_TYPE_CODES.IN_PROGRESS, name: 'In Progress', color: '#D97A3F', createdAt: '2024-01-06T08:10:00Z' },
  { id: 'st-4', code: STATUS_TYPE_CODES.FIXED, name: 'Fixed', color: '#3E8E64', createdAt: '2024-01-06T08:15:00Z' },
  { id: 'st-5', code: STATUS_TYPE_CODES.RETEST, name: 'Retest', color: '#C99A2E', createdAt: '2024-01-06T08:20:00Z' },
  { id: 'st-6', code: STATUS_TYPE_CODES.CLOSED, name: 'Closed', color: '#586582', createdAt: '2024-01-06T08:25:00Z' },
  { id: 'st-7', code: STATUS_TYPE_CODES.REOPENED, name: 'Reopened', color: '#C13B3B', createdAt: '2024-01-06T08:30:00Z' },
  { id: 'st-8', code: STATUS_TYPE_CODES.OPEN, name: 'Open', color: '#2E8FC9', createdAt: '2024-01-06T08:35:00Z' },
  { id: 'st-9', code: STATUS_TYPE_CODES.ON_HOLD, name: 'On Hold', color: '#C99A2E', createdAt: '2024-01-06T08:40:00Z' },
  { id: 'st-10', code: STATUS_TYPE_CODES.REJECTED, name: 'Rejected', color: '#8B96AC', createdAt: '2024-01-06T08:45:00Z' },
  { id: 'st-11', code: STATUS_TYPE_CODES.DUPLICATE, name: 'Duplicate', color: '#64748B', createdAt: '2024-01-06T08:50:00Z' },
  { id: 'st-12', code: STATUS_TYPE_CODES.FAILED, name: 'Failed', color: '#C13B3B', createdAt: '2024-01-06T08:55:00Z' },
  { id: 'st-13', code: STATUS_TYPE_CODES.PENDING, name: 'Pending', color: '#C99A2E', createdAt: '2024-01-06T09:00:00Z' },
  { id: 'st-14', code: STATUS_TYPE_CODES.CANCELLED, name: 'Cancelled', color: '#475569', createdAt: '2024-01-06T09:05:00Z' },
]
