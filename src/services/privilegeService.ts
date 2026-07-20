import { ApiResponse, Page, PageRequest } from '@/types/common'
import {
  AssignRolePrivilegesPayload,
  OverrideEmployeeRow,
  PrivilegeDefinition,
  RolePrivilegeAssignment,
  UpdateUserPermissionsPayload,
  UserPermissionSummary,
} from '@/types/privilege'
import {
  activePrivileges,
  findPrivilegesByCode,
  mockPrivilegeCatalog,
} from '@/mock/privilegeCatalog'
import { mockRolePrivileges } from '@/mock/rolePrivileges'
import { DEFAULT_EMPLOYEE_ROLE_ID, employeeRoleMap, mockUserOverrides } from '@/mock/userPermissions'
import { mockRoles } from '@/mock/roles'
import { mockEmployeeRecords } from '@/mock/employees'
import { fail, mockDelay, ok, paginate } from './apiClient'

const roleName = (roleId: string): string =>
  mockRoles.find((r) => r.id === roleId)?.name ?? 'Unassigned'

/** Preserves catalogue order when resolving a set of codes to definitions. */
const orderedByCatalog = (codes: string[]): PrivilegeDefinition[] => {
  const set = new Set(codes)
  return mockPrivilegeCatalog.filter((p) => set.has(p.code))
}

/**
 * Mock implementation of the Privilege Management API surface.
 *
 * Every method returns the same ApiResponse<T> / Page<T> envelope a Spring Boot
 * backend would, and reads/writes only in-memory mock data. Swapping these
 * bodies for real fetch() calls later requires no change to the pages.
 */
export const privilegeService = {
  /**
   * Paginated privilege catalogue.
   * Supports search (name, code) and filters (module, status) via `paginate`.
   */
  async getPrivileges(request: PageRequest): Promise<ApiResponse<Page<PrivilegeDefinition>>> {
    await mockDelay()
    return ok(paginate(mockPrivilegeCatalog, request, ['name', 'code']))
  },

  /** Single privilege by id — used by the read-only detail modal. */
  async getPrivilegeById(id: string): Promise<ApiResponse<PrivilegeDefinition>> {
    await mockDelay(200)
    const found = mockPrivilegeCatalog.find((p) => p.id === id)
    if (!found) return fail('Privilege not found.')
    return ok(found)
  },

  /** Full active catalogue (unpaginated) for building assignment trees. */
  async getAssignablePrivileges(): Promise<ApiResponse<PrivilegeDefinition[]>> {
    await mockDelay(200)
    return ok(activePrivileges())
  },

  /** Roles available for privilege assignment (active + inactive, for reference). */
  async getAssignableRoles(): Promise<ApiResponse<{ id: string; name: string }[]>> {
    await mockDelay(200)
    return ok(mockRoles.map((r) => ({ id: r.id, name: r.name })))
  },

  /** Currently-assigned privilege codes for a role. */
  async getPrivilegesByRole(roleId: string): Promise<ApiResponse<RolePrivilegeAssignment>> {
    await mockDelay()
    const existing = mockRolePrivileges.find((r) => r.roleId === roleId)
    if (existing) return ok({ ...existing, privilegeCodes: [...existing.privilegeCodes] })
    // Unconfigured role: return an empty, valid assignment.
    return ok({ roleId, roleName: roleName(roleId), privilegeCodes: [] })
  },

  /** Persist a role's privilege selection (Save Role Permissions). */
  async assignRolePrivileges(
    payload: AssignRolePrivilegesPayload,
  ): Promise<ApiResponse<RolePrivilegeAssignment>> {
    await mockDelay(500)

    const role = mockRoles.find((r) => r.id === payload.roleId)
    if (!role) return fail('Role not found.')

    // Only accept codes that exist and are currently active — no uncontrolled codes.
    const validCodes = new Set(activePrivileges().map((p) => p.code))
    const cleaned = Array.from(new Set(payload.privilegeCodes.filter((c) => validCodes.has(c))))

    const index = mockRolePrivileges.findIndex((r) => r.roleId === payload.roleId)
    const record: RolePrivilegeAssignment = {
      roleId: payload.roleId,
      roleName: role.name,
      privilegeCodes: cleaned,
    }
    if (index === -1) mockRolePrivileges.push(record)
    else mockRolePrivileges[index] = record

    return ok(record, 'Role permissions saved successfully.')
  },

  /** Employees for the override picker, joined with their assigned role. */
  async getOverrideEmployees(request: PageRequest): Promise<ApiResponse<Page<OverrideEmployeeRow>>> {
    await mockDelay()
    const rows: OverrideEmployeeRow[] = mockEmployeeRecords.map((e) => {
      const roleId = employeeRoleMap[e.id] ?? DEFAULT_EMPLOYEE_ROLE_ID
      return {
        id: e.id,
        fullName: `${e.firstName} ${e.lastName}`,
        email: e.email,
        avatarColor: e.avatarColor,
        roleId,
        roleName: roleName(roleId),
        status: e.status,
      }
    })
    return ok(paginate(rows, request, ['fullName', 'email']))
  },

  /**
   * Full effective-permission picture for an employee:
   *   Effective = (Role Privileges) + (Extra) - (Restricted)
   */
  async getUserPermissions(employeeId: string): Promise<ApiResponse<UserPermissionSummary>> {
    await mockDelay()

    const employee = mockEmployeeRecords.find((e) => e.id === employeeId)
    if (!employee) return fail('Employee not found.')

    const roleId = employeeRoleMap[employeeId] ?? DEFAULT_EMPLOYEE_ROLE_ID
    const roleAssignment = mockRolePrivileges.find((r) => r.roleId === roleId)
    const roleCodes = roleAssignment?.privilegeCodes ?? []

    const override = mockUserOverrides.find((o) => o.employeeId === employeeId)
    const extraCodes = override?.extraPrivilegeCodes ?? []
    const restrictedCodes = override?.restrictedPrivilegeCodes ?? []

    const restrictedSet = new Set(restrictedCodes)
    const effectiveCodes = Array.from(new Set([...roleCodes, ...extraCodes])).filter(
      (c) => !restrictedSet.has(c),
    )

    return ok({
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      employeeEmail: employee.email,
      avatarColor: employee.avatarColor,
      roleId,
      roleName: roleName(roleId),
      rolePrivileges: orderedByCatalog(roleCodes),
      extraPrivileges: orderedByCatalog(extraCodes),
      restrictedPrivileges: orderedByCatalog(restrictedCodes),
      effectivePrivileges: orderedByCatalog(effectiveCodes),
    })
  },

  /** Add extra (granted) privileges for a user, merging with existing extras. */
  async addUserExtraPrivileges(
    employeeId: string,
    codes: string[],
  ): Promise<ApiResponse<UserPermissionSummary>> {
    await mockDelay(400)
    const override = ensureOverride(employeeId)
    if (!override) return fail('Employee not found.')

    const validCodes = new Set(activePrivileges().map((p) => p.code))
    const merged = new Set(override.extraPrivilegeCodes)
    codes.filter((c) => validCodes.has(c)).forEach((c) => merged.add(c))
    override.extraPrivilegeCodes = Array.from(merged)
    // A granted privilege cannot also be restricted.
    override.restrictedPrivilegeCodes = override.restrictedPrivilegeCodes.filter(
      (c) => !merged.has(c),
    )

    return this.getUserPermissions(employeeId)
  },

  /** Add restricted (denied) privileges for a user, merging with existing restrictions. */
  async addUserRestrictedPrivileges(
    employeeId: string,
    codes: string[],
  ): Promise<ApiResponse<UserPermissionSummary>> {
    await mockDelay(400)
    const override = ensureOverride(employeeId)
    if (!override) return fail('Employee not found.')

    const validCodes = new Set(activePrivileges().map((p) => p.code))
    const merged = new Set(override.restrictedPrivilegeCodes)
    codes.filter((c) => validCodes.has(c)).forEach((c) => merged.add(c))
    override.restrictedPrivilegeCodes = Array.from(merged)
    // A restricted privilege cannot also be granted as extra.
    override.extraPrivilegeCodes = override.extraPrivilegeCodes.filter((c) => !merged.has(c))

    return this.getUserPermissions(employeeId)
  },

  /**
   * Replace a user's full override (extra + restricted) in one save.
   * Used by the "Save" action on the User Permission Override screen.
   */
  async updateUserPermissions(
    payload: UpdateUserPermissionsPayload,
  ): Promise<ApiResponse<UserPermissionSummary>> {
    await mockDelay(500)

    const employee = mockEmployeeRecords.find((e) => e.id === payload.employeeId)
    if (!employee) return fail('Employee not found.')

    const validCodes = new Set(activePrivileges().map((p) => p.code))
    const extra = Array.from(new Set(payload.extraPrivilegeCodes.filter((c) => validCodes.has(c))))
    const extraSet = new Set(extra)
    // Restricted wins are mutually exclusive with extras; drop any overlap from restricted.
    const restricted = Array.from(
      new Set(payload.restrictedPrivilegeCodes.filter((c) => validCodes.has(c) && !extraSet.has(c))),
    )

    const index = mockUserOverrides.findIndex((o) => o.employeeId === payload.employeeId)
    const record = {
      employeeId: payload.employeeId,
      extraPrivilegeCodes: extra,
      restrictedPrivilegeCodes: restricted,
    }
    if (index === -1) mockUserOverrides.push(record)
    else mockUserOverrides[index] = record

    const summary = await this.getUserPermissions(payload.employeeId)
    if (!summary.success) return summary
    return ok(summary.data, 'User permissions saved successfully.')
  },
}

/** Returns the mutable override record for an employee, creating one if needed. */
function ensureOverride(employeeId: string) {
  const employee = mockEmployeeRecords.find((e) => e.id === employeeId)
  if (!employee) return null
  let override = mockUserOverrides.find((o) => o.employeeId === employeeId)
  if (!override) {
    override = { employeeId, extraPrivilegeCodes: [], restrictedPrivilegeCodes: [] }
    mockUserOverrides.push(override)
  }
  return override
}

export { findPrivilegesByCode }
