import { RolePrivilegeAssignment } from '@/types/privilege'
import { allActivePrivilegeCodes } from './privilegeCatalog'

/**
 * Role -> privilege-code assignments for the Privilege Management module.
 *
 * Kept separate from the app-level `mockRoles.privilegeIds` (which drives
 * menu/route access) so this RBAC configuration surface can evolve
 * independently and map cleanly to a future `role_privilege` join table.
 *
 * Mutable so the mock service can persist "Save Role Permissions" in-session.
 * roleId values reference the roles defined in mock/roles.ts.
 */
export const mockRolePrivileges: RolePrivilegeAssignment[] = [
  {
    roleId: 'role-super-user',
    roleName: 'Super User',
    // Super User references the full active catalogue.
    privilegeCodes: allActivePrivilegeCodes(),
  },
  {
    roleId: 'role-project-manager',
    roleName: 'Project Manager',
    privilegeCodes: [
      'PROJECT_VIEW',
      'PROJECT_CREATE',
      'PROJECT_UPDATE',
      'EMPLOYEE_VIEW',
      'TESTCASE_VIEW',
      'DEFECT_VIEW',
      'DEFECT_UPDATE',
      'DEFECT_CLOSE',
      'REPORT_VIEW',
    ],
  },
  {
    roleId: 'role-qa-engineer',
    roleName: 'QA Engineer',
    privilegeCodes: ['TESTCASE_VIEW', 'TESTCASE_EXECUTE', 'DEFECT_VIEW', 'DEFECT_CREATE', 'DEFECT_UPDATE'],
  },
  {
    roleId: 'role-developer',
    roleName: 'Developer',
    privilegeCodes: ['PROJECT_VIEW', 'TESTCASE_VIEW', 'DEFECT_VIEW', 'DEFECT_UPDATE'],
  },
  {
    roleId: 'role-system-admin',
    roleName: 'System Administrator',
    privilegeCodes: [
      'EMPLOYEE_VIEW',
      'EMPLOYEE_CREATE',
      'EMPLOYEE_UPDATE',
      'EMPLOYEE_DELETE',
      'ROLE_VIEW',
      'ROLE_CREATE',
      'ROLE_UPDATE',
      'PROJECT_VIEW',
      'REPORT_VIEW',
    ],
  },
  {
    roleId: 'role-qa-lead',
    roleName: 'QA Lead',
    privilegeCodes: [
      'TESTCASE_VIEW',
      'TESTCASE_CREATE',
      'TESTCASE_EXECUTE',
      'APPROVE_TEST_CASE',
      'DEFECT_VIEW',
      'DEFECT_CREATE',
      'DEFECT_UPDATE',
      'DEFECT_CLOSE',
      'REPORT_VIEW',
    ],
  },
  {
    roleId: 'role-business-analyst',
    roleName: 'Business Analyst',
    privilegeCodes: ['PROJECT_VIEW', 'TESTCASE_VIEW', 'DEFECT_VIEW', 'REPORT_VIEW'],
  },
  {
    roleId: 'role-support-analyst',
    roleName: 'Support Analyst',
    privilegeCodes: ['DEFECT_VIEW', 'DEFECT_CREATE'],
  },
]
