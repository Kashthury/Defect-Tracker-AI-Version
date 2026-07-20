/**
 * Privilege Management (RBAC) module types.
 *
 * Permission model:
 *   Role -> Role Privileges -> Privileges
 *   Employee -> Assigned Role Privileges + Extra Privileges - Restricted Privileges
 *
 * Privileges are the smallest, system-controlled permission units. They are
 * NOT user-creatable; the catalogue is a fixed, controlled set defined in
 * mock/privilegeCatalog.ts (the single source of truth). These types are
 * shaped to map cleanly onto a future Spring Boot API.
 */

export type PrivilegeStatus = 'ACTIVE' | 'INACTIVE'

/** A single, system-controlled permission unit. */
export interface PrivilegeDefinition {
  id: string
  /** Human-friendly label, e.g. "View Employees". */
  name: string
  /** Stable machine code, e.g. "EMPLOYEE_VIEW". */
  code: string
  /** Owning functional module, e.g. "Employee Management". */
  module: string
  /** The action this privilege grants, e.g. "VIEW", "CREATE". */
  action: string
  description: string
  status: PrivilegeStatus
}

/** Privilege codes currently granted to a role. */
export interface RolePrivilegeAssignment {
  roleId: string
  roleName: string
  privilegeCodes: string[]
}

/** Payload used when saving a role's privilege selection. */
export interface AssignRolePrivilegesPayload {
  roleId: string
  privilegeCodes: string[]
}

/** Per-user permission overrides layered on top of the assigned role. */
export interface UserPermissionOverride {
  employeeId: string
  extraPrivilegeCodes: string[]
  restrictedPrivilegeCodes: string[]
}

/** Payload used when saving a user's permission override. */
export interface UpdateUserPermissionsPayload {
  employeeId: string
  extraPrivilegeCodes: string[]
  restrictedPrivilegeCodes: string[]
}

/**
 * Fully-resolved permission picture for an employee.
 *
 * Effective = (Role Privileges) + (Extra Privileges) - (Restricted Privileges)
 */
export interface UserPermissionSummary {
  employeeId: string
  employeeName: string
  employeeEmail: string
  avatarColor: string
  roleId: string
  roleName: string
  rolePrivileges: PrivilegeDefinition[]
  extraPrivileges: PrivilegeDefinition[]
  restrictedPrivileges: PrivilegeDefinition[]
  effectivePrivileges: PrivilegeDefinition[]
}

/** Lightweight employee row for the User Permission Override picker. */
export interface OverrideEmployeeRow {
  id: string
  fullName: string
  email: string
  avatarColor: string
  roleId: string
  roleName: string
  status: 'ACTIVE' | 'INACTIVE'
}
