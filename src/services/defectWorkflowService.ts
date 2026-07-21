import { ApiResponse } from '@/types/common'
import { DefectWorkflow, SaveDefectWorkflowPayload } from '@/types/defectWorkflow'
import { apiRequest } from './apiClient'

const ENDPOINT = '/configuration/status-workflow'

export const defectWorkflowService = {
  getWorkflow: (): Promise<ApiResponse<DefectWorkflow>> => apiRequest(ENDPOINT),
  saveWorkflow: (payload: SaveDefectWorkflowPayload): Promise<ApiResponse<DefectWorkflow>> =>
    apiRequest(ENDPOINT, { method: 'POST', body: payload }),
  updateWorkflow: (id: string, payload: SaveDefectWorkflowPayload): Promise<ApiResponse<DefectWorkflow>> =>
    apiRequest(`${ENDPOINT}/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
  deleteWorkflow: (id: string): Promise<ApiResponse<null>> =>
    apiRequest(`${ENDPOINT}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
