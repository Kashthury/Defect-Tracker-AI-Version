import { ApiResponse, Page, PageRequest } from '@/types/common'
import { CreateStatusTypePayload, StatusTypeRecord, UpdateStatusTypePayload } from '@/types/statusType'
import { apiRequest } from './apiClient'
import { getConfigurationItem, getConfigurationPage } from './configurationApi'

const ENDPOINT = '/configuration/status-types'

export const statusTypeService = {
  getStatusTypes: (request: PageRequest): Promise<ApiResponse<Page<StatusTypeRecord>>> => getConfigurationPage(ENDPOINT, request),
  getStatusTypeById: (id: string): Promise<ApiResponse<StatusTypeRecord>> => getConfigurationItem(ENDPOINT, id),
  createStatusType: (payload: CreateStatusTypePayload): Promise<ApiResponse<StatusTypeRecord>> => apiRequest(ENDPOINT, { method: 'POST', body: payload }),
  updateStatusType: (id: string, payload: UpdateStatusTypePayload): Promise<ApiResponse<StatusTypeRecord>> => apiRequest(`${ENDPOINT}/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
  deleteStatusType: (id: string): Promise<ApiResponse<null>> => apiRequest(`${ENDPOINT}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
