/**
 * Permission model: User -> Role -> Privileges -> Modules/Actions
 * Nothing here is hardcoded to a specific role name anywhere in the app;
 * access is always resolved by checking whether the current privilege set
 * contains the code a page/menu item declares it needs.
 */

export interface Privilege {
  id: string
  code: string // e.g. "DEFECT_VIEW", "DEFECT_CREATE"
  module: string // e.g. "Defects"
  action: string // e.g. "View", "Create", "Update", "Delete"
  description: string
}

export interface Role {
  id: string
  name: string
  description: string
  privilegeIds: string[]
}

export interface Designation {
  id: string
  title: string
  active?: boolean
  employeeCount?: number
}

export interface Employee {
  id: string
  employeeCode: string
  fullName: string
  email: string
  designationId: string
  roleIds: string[]
  active: boolean
  avatarColor: string
  createdAt: string
}

export interface AuthenticatedUser {
  id: string
  fullName: string
  email: string
  avatarColor: string
  designation: string
  roles: Role[]
  privileges: Privilege[] // flattened, de-duplicated set resolved from all assigned roles
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthSession {
  token: string
  issuedAt: number
  expiresAt: number
  user: AuthenticatedUser
}
