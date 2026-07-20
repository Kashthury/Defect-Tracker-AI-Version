import { PrivilegeDefinition } from '@/types/privilege'

/**
 * PRIVILEGE CATALOGUE — the single, controlled source of truth for every
 * grantable permission managed by the Privilege Management module.
 *
 * Privileges are the smallest permission units in the system. They are
 * system-controlled: the UI intentionally offers NO create / update / delete.
 * New privileges are only ever introduced here (and, in a real system, via a
 * backed migration) — never through uncontrolled user input.
 *
 * Codes map 1:1 to future Spring Boot `@PreAuthorize("hasAuthority('...')")`
 * checks, so keep them stable.
 */

const priv = (
  code: string,
  module: string,
  action: string,
  name: string,
  description: string,
  status: PrivilegeDefinition['status'] = 'ACTIVE',
): PrivilegeDefinition => ({
  id: `priv-${code.toLowerCase().replace(/_/g, '-')}`,
  code,
  module,
  action,
  name,
  description,
  status,
})

/** Module labels used for grouping in the privilege tree. Order is display order. */
export const PRIVILEGE_MODULES = [
  'Employee Management',
  'Project Management',
  'Release Management',
  'Test Case Management',
  'Defect Management',
  'Role Management',
  'Report Management',
] as const

export const mockPrivilegeCatalog: PrivilegeDefinition[] = [
  // Employee Management
  priv('EMPLOYEE_VIEW', 'Employee Management', 'VIEW', 'View Employees', 'View the employee directory and employee details.'),
  priv('EMPLOYEE_CREATE', 'Employee Management', 'CREATE', 'Create Employee', 'Add new employee records to the system.'),
  priv('EMPLOYEE_UPDATE', 'Employee Management', 'UPDATE', 'Update Employee', 'Edit details of existing employee records.'),
  priv('EMPLOYEE_DELETE', 'Employee Management', 'DELETE', 'Delete Employee', 'Permanently remove employee records.'),

  // Project Management
  priv('PROJECT_VIEW', 'Project Management', 'VIEW', 'View Projects', 'View projects and their configuration.'),
  priv('PROJECT_CREATE', 'Project Management', 'CREATE', 'Create Project', 'Create new projects.'),
  priv('PROJECT_UPDATE', 'Project Management', 'UPDATE', 'Update Project', 'Edit existing project details and settings.'),
  priv('PROJECT_DELETE', 'Project Management', 'DELETE', 'Delete Project', 'Archive or delete projects.', 'INACTIVE'),

  // Release Management
  priv('RELEASE_VIEW', 'Release Management', 'VIEW', 'View Releases', 'View project releases and release details.'),
  priv('RELEASE_CREATE', 'Release Management', 'CREATE', 'Create Release', 'Create releases within an authorized project.'),
  priv('RELEASE_UPDATE', 'Release Management', 'UPDATE', 'Update Release', 'Edit release details and schedules.'),
  priv('RELEASE_DELETE', 'Release Management', 'DELETE', 'Delete Release', 'Delete eligible on-hold releases.'),
  priv('RELEASE_STATUS_CHANGE', 'Release Management', 'MANAGE', 'Change Release Status', 'Manage the controlled release lifecycle.'),

  // Test Case Management
  priv('TESTCASE_VIEW', 'Test Case Management', 'VIEW', 'View Test Cases', 'View test cases and their steps.'),
  priv('TESTCASE_CREATE', 'Test Case Management', 'CREATE', 'Create Test Case', 'Author new test cases.'),
  priv('TESTCASE_EXECUTE', 'Test Case Management', 'EXECUTE', 'Execute Test Cases', 'Run test cases and record execution results.'),
  priv('APPROVE_TEST_CASE', 'Test Case Management', 'APPROVE', 'Approve Test Case', 'Review and approve authored test cases.'),

  // Defect Management
  priv('DEFECT_VIEW', 'Defect Management', 'VIEW', 'View Defects', 'View logged defects and their history.'),
  priv('DEFECT_CREATE', 'Defect Management', 'CREATE', 'Create Defect', 'Log new defects.'),
  priv('DEFECT_UPDATE', 'Defect Management', 'UPDATE', 'Update Defect', 'Update defect fields, status, and assignment.'),
  priv('DEFECT_CLOSE', 'Defect Management', 'CLOSE', 'Close Defect', 'Close or resolve defects.'),
  priv('DELETE_DEFECT', 'Defect Management', 'DELETE', 'Delete Defect', 'Permanently delete defect records.'),

  // Role Management
  priv('ROLE_VIEW', 'Role Management', 'VIEW', 'View Roles', 'View RBAC roles and their assigned privileges.'),
  priv('ROLE_CREATE', 'Role Management', 'CREATE', 'Create Role', 'Create new RBAC roles.'),
  priv('ROLE_UPDATE', 'Role Management', 'UPDATE', 'Update Role', 'Edit role details and privilege assignments.'),

  // Report Management
  priv('REPORT_VIEW', 'Report Management', 'VIEW', 'View Reports', 'View analytics dashboards and reports.'),
  priv('REPORT_EXPORT', 'Report Management', 'EXPORT', 'Export Reports', 'Export reports to external formats.', 'INACTIVE'),
]

/** Only privileges that can currently be assigned (INACTIVE ones are hidden from trees). */
export const activePrivileges = (): PrivilegeDefinition[] =>
  mockPrivilegeCatalog.filter((p) => p.status === 'ACTIVE')

export const findPrivilegesByCode = (codes: string[]): PrivilegeDefinition[] => {
  const set = new Set(codes)
  return mockPrivilegeCatalog.filter((p) => set.has(p.code))
}

export const allActivePrivilegeCodes = (): string[] => activePrivileges().map((p) => p.code)
