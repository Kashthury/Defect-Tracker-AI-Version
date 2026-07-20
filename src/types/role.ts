import { Role as AuthRole, Privilege } from '@/types/auth'
import { RoleType } from '@/constants/roleTypes'

export type RoleStatus = 'ACTIVE' | 'INACTIVE'

export interface RoleRecord extends AuthRole {
  roleType: RoleType
  status: RoleStatus
  createdAt: string
  updatedAt: string
}

export interface RoleDetails extends RoleRecord {
  assignedPrivileges: Privilege[]
}

export interface CreateRolePayload {
  name: string
  roleType: RoleType | ''
  description?: string
}

export interface UpdateRolePayload {
  name: string
  roleType: RoleType | ''
  description?: string
  status: RoleStatus
}
