import { ApiResponse, Page, PageRequest } from '@/types/common'
import { CreateRolePayload, RoleDetails, RoleRecord, RoleStatus, UpdateRolePayload } from '@/types/role'
import { apiRequest } from './apiClient'
import { getConfigurationItem, getConfigurationPage } from './configurationApi'

const ENDPOINT = '/configuration/roles'

export const roleService = {
  getRoles: (request: PageRequest): Promise<ApiResponse<Page<RoleRecord>>> => getConfigurationPage(ENDPOINT, request),

  getRoleById: (id: string): Promise<ApiResponse<RoleDetails>> =>
    getConfigurationItem(ENDPOINT, id),

  createRole: (payload: CreateRolePayload): Promise<ApiResponse<RoleRecord>> =>
    apiRequest(ENDPOINT, { method: 'POST', body: payload }),

  updateRole: (id: string, payload: UpdateRolePayload): Promise<ApiResponse<RoleRecord>> =>
    apiRequest(`${ENDPOINT}/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),

  updateRoleStatus: (id: string, status: RoleStatus): Promise<ApiResponse<RoleDetails>> =>
    apiRequest(`${ENDPOINT}/${encodeURIComponent(id)}`, { method: 'PUT', body: { status } }),

  deleteRole: (id: string): Promise<ApiResponse<null>> =>
    apiRequest(`${ENDPOINT}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
