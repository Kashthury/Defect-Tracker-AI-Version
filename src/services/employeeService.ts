import { ApiResponse, Page } from '@/types/common'
import {
  EmployeeCreateRequest,
  EmployeeDropdownResponse,
  EmployeeListParams,
  EmployeeResponse,
  EmployeeUpdateRequest,
  Gender,
} from '@/types/employee'
import { apiRequest, fail, ok, resolveApiAssetUrl } from './apiClient'

const ENDPOINT = '/employees'

type BackendPage<T> = {
  content?: T[]
  page?: number
  pageNumber?: number
  number?: number
  size?: number
  pageSize?: number
  totalElements?: number
  totalPages?: number
}

type BackendEmployee = Partial<EmployeeResponse> & { phone?: string; status?: string }

const mapEmployee = (item: BackendEmployee): EmployeeResponse => ({
  id: Number(item.id ?? 0),
  employeeCode: String(item.employeeCode ?? ''),
  firstName: String(item.firstName ?? ''),
  lastName: String(item.lastName ?? ''),
  fullName: String(item.fullName ?? `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim()),
  gender: (item.gender ?? 'OTHER') as Gender,
  email: String(item.email ?? ''),
  phoneNo: String(item.phoneNo ?? item.phone ?? ''),
  joinDate: String(item.joinDate ?? ''),
  designationId: Number(item.designationId ?? 0),
  designationName: String(item.designationName ?? ''),
  active: item.active ?? item.status === 'ACTIVE',
  profileImage: resolveApiAssetUrl(item.profileImage),
  avatarColor: item.avatarColor ?? null,
  superUser: Boolean(item.superUser),
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
})

const employeeFormData = (payload: EmployeeCreateRequest | EmployeeUpdateRequest) => {
  const formData = new FormData()
  formData.append('firstName', payload.firstName.trim())
  formData.append('lastName', payload.lastName.trim())
  formData.append('gender', payload.gender)
  formData.append('email', payload.email.trim().toLowerCase())
  formData.append('phoneNo', payload.phoneNo.trim())
  formData.append('joinDate', payload.joinDate)
  formData.append('designationId', String(Number(payload.designationId)))
  if (payload.profileImage) formData.append('profileImage', payload.profileImage, payload.profileImage.name)
  if ('active' in payload) formData.append('active', String(payload.active))
  if ('removeProfileImage' in payload && payload.removeProfileImage) formData.append('removeProfileImage', 'true')
  return formData
}

const mapResponse = (response: ApiResponse<BackendEmployee>): ApiResponse<EmployeeResponse> =>
  response.success ? ok(mapEmployee(response.data), response.message) : fail(response.message)

const asRows = <T,>(data: T[] | { content?: T[] }) => Array.isArray(data) ? data : data.content ?? []

export const employeeService = {
  async getEmployees(params: EmployeeListParams): Promise<ApiResponse<Page<EmployeeResponse>>> {
    const response = await apiRequest<BackendPage<BackendEmployee>>(ENDPOINT, {
      query: {
        search: params.search?.trim() || undefined,
        designationId: params.designationId,
        gender: params.gender,
        active: params.active,
        page: params.page ?? 0,
        size: Math.min(params.size ?? 10, 100),
        sortBy: params.sortBy ?? 'firstName',
        sortDir: params.sortDir ?? 'asc',
      },
    })
    if (!response.success) return fail(response.message)
    const pageNumber = response.data.page ?? response.data.pageNumber ?? response.data.number ?? params.page ?? 0
    const pageSize = response.data.size ?? response.data.pageSize ?? params.size ?? 10
    return ok({
      content: (response.data.content ?? []).map(mapEmployee),
      pageNumber,
      pageSize,
      totalElements: response.data.totalElements ?? 0,
      totalPages: response.data.totalPages ?? 0,
    }, response.message)
  },

  async getEmployeeById(id: string | number): Promise<ApiResponse<EmployeeResponse>> {
    return mapResponse(await apiRequest<BackendEmployee>(`${ENDPOINT}/${encodeURIComponent(id)}`))
  },

  async createEmployee(payload: EmployeeCreateRequest): Promise<ApiResponse<EmployeeResponse>> {
    return mapResponse(await apiRequest<BackendEmployee>(ENDPOINT, { method: 'POST', body: employeeFormData(payload) }))
  },

  async updateEmployee(id: string | number, payload: EmployeeUpdateRequest): Promise<ApiResponse<EmployeeResponse>> {
    return mapResponse(await apiRequest<BackendEmployee>(`${ENDPOINT}/${encodeURIComponent(id)}`, { method: 'PUT', body: employeeFormData(payload) }))
  },

  async updateEmployeeStatus(id: string | number, active: boolean): Promise<ApiResponse<EmployeeResponse>> {
    return mapResponse(await apiRequest<BackendEmployee>(`${ENDPOINT}/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: { active },
    }))
  },

  async getEmployeeDropdown(): Promise<ApiResponse<EmployeeDropdownResponse[]>> {
    return apiRequest(`${ENDPOINT}/dropdown`)
  },

  async getEmployeesByDesignation(designationId: string | number): Promise<ApiResponse<EmployeeDropdownResponse[]>> {
    const response = await apiRequest<EmployeeDropdownResponse[] | { content?: EmployeeDropdownResponse[] }>(
      `${ENDPOINT}/designation/${encodeURIComponent(designationId)}`,
    )
    return response.success ? ok(asRows(response.data), response.message) : fail(response.message)
  },

  async getProjectDevelopers(projectId: string | number, date?: string): Promise<ApiResponse<EmployeeDropdownResponse[]>> {
    const response = await apiRequest<EmployeeDropdownResponse[] | { content?: EmployeeDropdownResponse[] }>(
      `${ENDPOINT}/project/${encodeURIComponent(projectId)}/developers`, { query: { date } },
    )
    return response.success ? ok(asRows(response.data), response.message) : fail(response.message)
  },

  async getProjectQaEmployees(projectId: string | number, date?: string): Promise<ApiResponse<EmployeeDropdownResponse[]>> {
    const response = await apiRequest<EmployeeDropdownResponse[] | { content?: EmployeeDropdownResponse[] }>(
      `${ENDPOINT}/project/${encodeURIComponent(projectId)}/qa`, { query: { date } },
    )
    return response.success ? ok(asRows(response.data), response.message) : fail(response.message)
  },

  async getProjectEmployeesByRole(projectId: string | number, roleType: string, date?: string): Promise<ApiResponse<EmployeeDropdownResponse[]>> {
    const response = await apiRequest<EmployeeDropdownResponse[] | { content?: EmployeeDropdownResponse[] }>(
      `${ENDPOINT}/project/${encodeURIComponent(projectId)}/role/${encodeURIComponent(roleType)}`, { query: { date } },
    )
    return response.success ? ok(asRows(response.data), response.message) : fail(response.message)
  },
}
