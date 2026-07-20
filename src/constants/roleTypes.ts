import { SelectOption } from '@/types/common'

export const ROLE_TYPES = {
  DEVELOPER: 'DEVELOPER',
  QA: 'QA',
  QA_LEAD: 'QA_LEAD',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  BUSINESS_ANALYST: 'BUSINESS_ANALYST',
  SUPPORT: 'SUPPORT',
} as const

export type RoleType = (typeof ROLE_TYPES)[keyof typeof ROLE_TYPES]

export const ROLE_TYPE_LABELS: Record<RoleType, string> = {
  [ROLE_TYPES.DEVELOPER]: 'Developer',
  [ROLE_TYPES.QA]: 'QA',
  [ROLE_TYPES.QA_LEAD]: 'QA Lead',
  [ROLE_TYPES.PROJECT_MANAGER]: 'Project Manager',
  [ROLE_TYPES.BUSINESS_ANALYST]: 'Business Analyst',
  [ROLE_TYPES.SUPPORT]: 'Support',
}

export const ROLE_TYPE_VALUES = Object.values(ROLE_TYPES)

export const ROLE_TYPE_OPTIONS: SelectOption[] = ROLE_TYPE_VALUES.map((value) => ({
  label: ROLE_TYPE_LABELS[value],
  value,
}))

export function formatRoleType(roleType: string | undefined): string {
  return roleType && roleType in ROLE_TYPE_LABELS ? ROLE_TYPE_LABELS[roleType as RoleType] : 'Unknown'
}
