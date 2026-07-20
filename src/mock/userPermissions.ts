import { UserPermissionOverride } from '@/types/privilege'

/**
 * Employee -> assigned role mapping for the User Permission Override screen.
 *
 * The rich Employee record (mock/employees.ts) does not itself track roles,
 * so this stand-in map models the User -> Role edge that a real backend would
 * store on the employee/user table. Employees not listed here fall back to
 * DEFAULT_EMPLOYEE_ROLE_ID.
 */
export const employeeRoleMap: Record<string, string> = {
  'emp-0001': 'role-system-admin',
  'emp-0002': 'role-project-manager',
  'emp-0003': 'role-qa-engineer',
  'emp-0004': 'role-developer',
  'emp-0005': 'role-system-admin',
  'emp-0006': 'role-developer',
  'emp-0007': 'role-qa-lead',
  'emp-0008': 'role-developer',
  'emp-0009': 'role-business-analyst',
  'emp-0010': 'role-project-manager',
  'emp-0011': 'role-qa-engineer',
  'emp-0012': 'role-developer',
  'emp-0013': 'role-business-analyst',
  'emp-0014': 'role-developer',
  'emp-0015': 'role-qa-lead',
  'emp-0016': 'role-business-analyst',
  'emp-0017': 'role-developer',
  'emp-0018': 'role-qa-engineer',
  'emp-0019': 'role-project-manager',
  'emp-0020': 'role-project-manager',
  'emp-0021': 'role-developer',
  'emp-0022': 'role-qa-engineer',
  'emp-0023': 'role-business-analyst',
  'emp-0024': 'role-developer',
  'emp-0025': 'role-qa-lead',
  'emp-0026': 'role-developer',
  'emp-0027': 'role-project-manager',
  'emp-0028': 'role-system-admin',
}

export const DEFAULT_EMPLOYEE_ROLE_ID = 'role-developer'

/**
 * Per-employee permission overrides.
 *
 * Effective = (Role Privileges) + (Extra Privileges) - (Restricted Privileges)
 *
 * Mutable so the mock service can persist edits made on the User Permission
 * Override screen within the session. Maps to a future `user_privilege_override`
 * table keyed by employee id and grant/deny flag.
 */
export const mockUserOverrides: UserPermissionOverride[] = [
  {
    // Hana Kimura (QA Lead) — granted an exceptional extra, denied a risky delete.
    employeeId: 'emp-0007',
    extraPrivilegeCodes: ['APPROVE_TEST_CASE'],
    restrictedPrivilegeCodes: ['DELETE_DEFECT'],
  },
  {
    // Arjun Mehta (QA Engineer) — allowed to approve test cases as an exception.
    employeeId: 'emp-0003',
    extraPrivilegeCodes: ['APPROVE_TEST_CASE'],
    restrictedPrivilegeCodes: [],
  },
  {
    // David Chen (Developer) — restricted from updating defects temporarily.
    employeeId: 'emp-0008',
    extraPrivilegeCodes: [],
    restrictedPrivilegeCodes: ['DEFECT_UPDATE'],
  },
]
