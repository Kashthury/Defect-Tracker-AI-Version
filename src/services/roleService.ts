import { ApiResponse, Page, PageRequest } from '@/types/common'
import { mockRoles } from '@/mock/roles'
import { mockPrivileges } from '@/mock/privileges'
import { ROLE_TYPE_VALUES, RoleType } from '@/constants/roleTypes'
import { CreateRolePayload, RoleDetails, RoleRecord, RoleStatus, UpdateRolePayload } from '@/types/role'
import { fail, mockDelay, ok, paginate } from './apiClient'

let nextRoleNumber = mockRoles.length + 1

const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ')

const isValidRoleType = (value: string): value is RoleType =>
  ROLE_TYPE_VALUES.includes(value as RoleType)

const withAssignedPrivileges = (role: RoleRecord): RoleDetails => ({
  ...role,
  assignedPrivileges: mockPrivileges.filter((privilege) => role.privilegeIds.includes(privilege.id)),
})

const findDuplicateName = (name: string, excludeId?: string) =>
  mockRoles.find((role) => role.id !== excludeId && role.name.toLowerCase() === name.toLowerCase())

export const roleService = {
  async getRoles(request: PageRequest): Promise<ApiResponse<Page<RoleRecord>>> {
    await mockDelay()
    return ok(paginate(mockRoles, request, ['name']))
  },

  async getRoleById(id: string): Promise<ApiResponse<RoleDetails>> {
    await mockDelay()
    const role = mockRoles.find((item) => item.id === id)
    if (!role) return fail('Role not found.')
    return ok(withAssignedPrivileges(role))
  },

  async createRole(payload: CreateRolePayload): Promise<ApiResponse<RoleRecord>> {
    await mockDelay(500)

    const name = normalizeName(payload.name)
    if (!name) return fail('Role Name is required.')
    if (!payload.roleType || !isValidRoleType(payload.roleType)) return fail('Role Type is required.')
    if (findDuplicateName(name)) return fail('A role with this name already exists.')

    const now = new Date().toISOString()
    const role: RoleRecord = {
      id: `role-custom-${String(nextRoleNumber++).padStart(3, '0')}`,
      name,
      roleType: payload.roleType,
      description: payload.description?.trim() ?? '',
      status: 'ACTIVE',
      privilegeIds: [],
      createdAt: now,
      updatedAt: now,
    }

    mockRoles.unshift(role)
    return ok(role, 'Role created successfully.')
  },

  async updateRole(id: string, payload: UpdateRolePayload): Promise<ApiResponse<RoleRecord>> {
    await mockDelay(500)

    const index = mockRoles.findIndex((item) => item.id === id)
    if (index === -1) return fail('Role not found.')

    const name = normalizeName(payload.name)
    if (!name) return fail('Role Name is required.')
    if (!payload.roleType || !isValidRoleType(payload.roleType)) return fail('Role Type is required.')
    if (findDuplicateName(name, id)) return fail('A role with this name already exists.')

    const updated: RoleRecord = {
      ...mockRoles[index],
      name,
      roleType: payload.roleType,
      description: payload.description?.trim() ?? '',
      status: payload.status,
      updatedAt: new Date().toISOString(),
    }

    mockRoles[index] = updated
    return ok(updated, 'Role updated successfully.')
  },

  async updateRoleStatus(id: string, status: RoleStatus): Promise<ApiResponse<RoleDetails>> {
    await mockDelay(400)

    const index = mockRoles.findIndex((item) => item.id === id)
    if (index === -1) return fail('Role not found.')

    const updated: RoleRecord = {
      ...mockRoles[index],
      status,
      updatedAt: new Date().toISOString(),
    }

    mockRoles[index] = updated
    return ok(withAssignedPrivileges(updated), `Role status changed to ${status}.`)
  },

  async deleteRole(id: string): Promise<ApiResponse<null>> {
    await mockDelay(400)

    const index = mockRoles.findIndex((item) => item.id === id)
    if (index === -1) return fail('Role not found.')

    mockRoles.splice(index, 1)
    return ok(null, 'Role deleted successfully.')
  },
}
