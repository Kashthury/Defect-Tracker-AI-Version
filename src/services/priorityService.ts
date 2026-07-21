import { ApiResponse, Page, PageRequest } from '@/types/common'
import { PriorityConfig } from '@/types/defect'
import { CreatePriorityPayload, UpdatePriorityPayload } from '@/types/priority'
import { apiRequest } from './apiClient'
import { getConfigurationItem, getConfigurationPage } from './configurationApi'

const ENDPOINT = '/configuration/priorities'

export const priorityService = {
  getPriorities: (request: PageRequest): Promise<ApiResponse<Page<PriorityConfig>>> => getConfigurationPage(ENDPOINT, request),
  getPriorityById: (id: string): Promise<ApiResponse<PriorityConfig>> => getConfigurationItem(ENDPOINT, id),
  createPriority: (payload: CreatePriorityPayload): Promise<ApiResponse<PriorityConfig>> => apiRequest(ENDPOINT, { method: 'POST', body: payload }),
  updatePriority: (id: string, payload: UpdatePriorityPayload): Promise<ApiResponse<PriorityConfig>> => apiRequest(`${ENDPOINT}/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
  deletePriority: (id: string): Promise<ApiResponse<null>> => apiRequest(`${ENDPOINT}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
