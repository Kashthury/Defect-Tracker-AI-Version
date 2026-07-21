import { ApiResponse, Page, PageRequest } from '@/types/common'
import { DefectTypeConfig } from '@/types/defect'
import { CreateDefectTypePayload, UpdateDefectTypePayload } from '@/types/defectType'
import { apiRequest } from './apiClient'
import { getConfigurationItem, getConfigurationPage } from './configurationApi'

const ENDPOINT = '/configuration/defect-types'

export const defectTypeService = {
  getDefectTypes: (request: PageRequest): Promise<ApiResponse<Page<DefectTypeConfig>>> =>
    getConfigurationPage(ENDPOINT, request),
  getDefectTypeById: (id: string): Promise<ApiResponse<DefectTypeConfig>> =>
    getConfigurationItem(ENDPOINT, id),
  createDefectType: (payload: CreateDefectTypePayload): Promise<ApiResponse<DefectTypeConfig>> =>
    apiRequest(ENDPOINT, { method: 'POST', body: payload }),
  updateDefectType: (id: string, payload: UpdateDefectTypePayload): Promise<ApiResponse<DefectTypeConfig>> =>
    apiRequest(`${ENDPOINT}/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
  deleteDefectType: (id: string): Promise<ApiResponse<null>> =>
    apiRequest(`${ENDPOINT}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
