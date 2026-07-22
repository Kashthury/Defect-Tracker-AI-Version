import { ApiResponse, Page, PageRequest } from '@/types/common'
import { SeverityConfig } from '@/types/defect'
import { CreateSeverityPayload, UpdateSeverityPayload } from '@/types/severity'
import { apiRequest } from './apiClient'
import { getConfigurationItem, getConfigurationPage } from './configurationApi'

const ENDPOINT = '/configuration/severities'

/**
 * Severity uses `weight` as its single ordering and business-impact value.
 * Collection reads are always requested and returned highest-weight first.
 */
export const severityService = {
  async getSeverities(request: PageRequest): Promise<ApiResponse<Page<SeverityConfig>>> {
    const response = await getConfigurationPage<SeverityConfig>(ENDPOINT, {
      ...request,
      sortBy: 'weight',
      sortDir: 'desc',
    })
    if (response.success) {
      response.data.content = [...response.data.content].sort((a, b) => b.weight - a.weight)
    }
    return response
  },

  getSeverityById: (id: string): Promise<ApiResponse<SeverityConfig>> =>
    getConfigurationItem(ENDPOINT, id),

  createSeverity: (payload: CreateSeverityPayload): Promise<ApiResponse<SeverityConfig>> =>
    apiRequest(ENDPOINT, { method: 'POST', body: payload }),

  updateSeverity: (id: string, payload: UpdateSeverityPayload): Promise<ApiResponse<SeverityConfig>> =>
    apiRequest(`${ENDPOINT}/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),

  deleteSeverity: (id: string): Promise<ApiResponse<null>> =>
    apiRequest(`${ENDPOINT}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
