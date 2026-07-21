import { ApiResponse, Page, PageRequest } from '@/types/common'
import { SeverityConfig } from '@/types/defect'
import { CreateSeverityPayload, UpdateSeverityPayload } from '@/types/severity'
import { apiRequest, fail, ok } from './apiClient'
import { getConfigurationItem, getConfigurationPage } from './configurationApi'

const ENDPOINT = '/configuration/severities'

type BackendSeverity = Omit<Partial<SeverityConfig>, 'id' | 'weight'> & {
  id: string
  /** Backend name for the value presented as Weight in the UI. */
  sortOrder?: number
  weight?: number
}

const colorTone = (name: string): SeverityConfig['colorTone'] => {
  const normalized = name.trim().toLowerCase()
  if (normalized === 'critical' || normalized === 'high' || normalized === 'medium' || normalized === 'low') {
    return normalized
  }
  return 'medium'
}

const mapSeverity = (item: BackendSeverity): SeverityConfig => ({
  id: String(item.id),
  name: String(item.name ?? ''),
  description: String(item.description ?? ''),
  weight: Number(item.sortOrder ?? item.weight ?? 1),
  color: String(item.color ?? '#C13B3B'),
  colorTone: item.colorTone ?? colorTone(String(item.name ?? '')),
  active: item.active ?? true,
  createdAt: String(item.createdAt ?? ''),
})

const backendPayload = (payload: CreateSeverityPayload | UpdateSeverityPayload) => ({
  name: payload.name,
  description: payload.description,
  sortOrder: payload.weight,
  color: payload.color,
})

const mapResponse = (response: ApiResponse<BackendSeverity>): ApiResponse<SeverityConfig> =>
  response.success
    ? ok(mapSeverity(response.data), response.message)
    : fail(response.message)

export const severityService = {
  async getSeverities(request: PageRequest): Promise<ApiResponse<Page<SeverityConfig>>> {
    const response = await getConfigurationPage<BackendSeverity>(ENDPOINT, request)
    if (!response.success) return fail(response.message)
    return ok({ ...response.data, content: response.data.content.map(mapSeverity) }, response.message)
  },

  async getSeverityById(id: string): Promise<ApiResponse<SeverityConfig>> {
    return mapResponse(await getConfigurationItem<BackendSeverity>(ENDPOINT, id))
  },

  async createSeverity(payload: CreateSeverityPayload): Promise<ApiResponse<SeverityConfig>> {
    const response = await apiRequest<BackendSeverity>(ENDPOINT, {
      method: 'POST',
      body: backendPayload(payload),
    })
    return mapResponse(response)
  },

  async updateSeverity(id: string, payload: UpdateSeverityPayload): Promise<ApiResponse<SeverityConfig>> {
    const response = await apiRequest<BackendSeverity>(`${ENDPOINT}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: backendPayload(payload),
    })
    return mapResponse(response)
  },

  deleteSeverity: (id: string): Promise<ApiResponse<null>> =>
    apiRequest(`${ENDPOINT}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
