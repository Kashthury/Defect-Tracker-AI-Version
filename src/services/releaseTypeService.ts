import { ApiResponse, Page, PageRequest } from '@/types/common'
import { ReleaseTypeConfig } from '@/types/defect'
import { CreateReleaseTypePayload, UpdateReleaseTypePayload } from '@/types/releaseType'
import { apiRequest } from './apiClient'
import { getConfigurationItem, getConfigurationPage } from './configurationApi'

const ENDPOINT = '/configuration/release-types'

export const releaseTypeService = {
  getReleaseTypes: (request: PageRequest): Promise<ApiResponse<Page<ReleaseTypeConfig>>> => getConfigurationPage(ENDPOINT, request),
  getReleaseTypeById: (id: string): Promise<ApiResponse<ReleaseTypeConfig>> => getConfigurationItem(ENDPOINT, id),
  createReleaseType: (payload: CreateReleaseTypePayload): Promise<ApiResponse<ReleaseTypeConfig>> => apiRequest(ENDPOINT, { method: 'POST', body: payload }),
  updateReleaseType: (id: string, payload: UpdateReleaseTypePayload): Promise<ApiResponse<ReleaseTypeConfig>> => apiRequest(`${ENDPOINT}/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
  deleteReleaseType: (id: string): Promise<ApiResponse<null>> => apiRequest(`${ENDPOINT}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
