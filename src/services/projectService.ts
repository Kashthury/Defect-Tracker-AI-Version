import { mockDesignations } from '@/mock/designations'
import { ALL_DEFECTS, ALL_TEST_CASES } from '@/mock/generators'
import { mockProjectAllocations } from '@/mock/projectAllocations'
import { mockModules, mockProjects } from '@/mock/projects'
import { mockRoles } from '@/mock/roles'
import { mockReleases } from '@/mock/releases'
import { ApiResponse, Page, PageRequest } from '@/types/common'
import {
  AllocationHistoryEntry,
  CreateProjectPayload,
  Project,
  ProjectModule,
  ProjectStatus,
  ProjectSummary,
  SelectedProject,
  UpdateProjectPayload,
} from '@/types/project'
import { apiRequest, fail, mockDelay, ok, paginate } from './apiClient'
import { getConfigurationPage } from './configurationApi'
import { projectAllocationService } from './projectAllocationService'
import { mockEmployeeRecords } from '@/mock/employees'

let nextProjectId = mockProjects.length + 1

const normalizeText = (value: string) => value.trim().replace(/\s+/g, ' ')
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const projectCode = (name: string) => {
  const base = normalizeText(name)
    .split(' ')
    .map((part) => part[0])
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, 'X')
  let code = base
  let suffix = 2
  while (mockProjects.some((project) => project.code === code)) code = `${base}${suffix++}`
  return code
}

const validatePayload = (payload: CreateProjectPayload): string | null => {
  if (!normalizeText(payload.name)) return 'Project Name is required.'
  if (!payload.startDate) return 'Start Date is required.'
  if (!payload.endDate) return 'End Date is required.'
  if (payload.endDate < payload.startDate) return 'End Date cannot be earlier than Start Date.'
  if (!payload.designationId) return 'Designation is required.'
  if (!payload.managerId) return 'Project Manager is required.'
  if (!payload.projectRoleId) return 'Project Role is required.'
  if (!Number.isFinite(payload.allocationPercentage) || payload.allocationPercentage <= 0) {
    return 'Allocation Percentage must be greater than 0.'
  }
  if (payload.allocationPercentage > 100) return 'Allocation Percentage cannot exceed 100%.'
  if (!payload.allocationStartDate) return 'Allocation Start Date is required.'
  if (!payload.allocationEndDate) return 'Allocation End Date is required.'
  if (payload.allocationEndDate < payload.allocationStartDate) {
    return 'Allocation End Date cannot be earlier than Allocation Start Date.'
  }
  if (
    payload.allocationStartDate < payload.startDate ||
    payload.allocationEndDate > payload.endDate
  ) {
    return 'Project Manager allocation dates must be within the project period.'
  }
  if (!normalizeText(payload.clientName)) return 'Client Name is required.'
  if (!normalizeText(payload.clientCountry)) return 'Client Country is required.'
  if (!payload.clientEmail.trim()) return 'Client Email Address is required.'
  if (!EMAIL_PATTERN.test(payload.clientEmail.trim())) return 'Client Email Address must be valid.'

  const employee = mockEmployeeRecords.find(
    (item) => item.id === payload.managerId && item.status === 'ACTIVE',
  )
  if (!employee) return 'Select an active Project Manager.'
  if (employee.designationId !== payload.designationId) {
    return 'The selected Project Manager does not match the selected Designation.'
  }
  if (!mockRoles.some((item) => item.id === payload.projectRoleId && item.status === 'ACTIVE')) {
    return 'Select an active Project Role.'
  }
  return null
}

const resolveManagerFields = (payload: CreateProjectPayload) => {
  const employee = mockEmployeeRecords.find((item) => item.id === payload.managerId)!
  const designation = mockDesignations.find((item) => item.id === payload.designationId)!
  const role = mockRoles.find((item) => item.id === payload.projectRoleId)!
  return {
    managerName: `${employee.firstName} ${employee.lastName}`,
    managerDesignationName: designation.title,
    managerRoleName: role.name,
  }
}

export const projectService = {
  async getProjects(request: PageRequest): Promise<ApiResponse<Page<Project>>> {
    return getConfigurationPage('/projects', request)
  },

  async getProjectById(projectId: string): Promise<ApiResponse<Project>> {
    return apiRequest(`/projects/${encodeURIComponent(projectId)}`)
  },

  async getAuthorizedProjectById(
    projectId: string,
    userId: string,
    canViewAllProjects = false,
  ): Promise<ApiResponse<Project>> {
    // Project authorization is enforced by the backend using the bearer token.
    void userId
    void canViewAllProjects
    return this.getProjectById(projectId)
  },

  async createProject(payload: CreateProjectPayload): Promise<ApiResponse<Project>> {
    return apiRequest('/projects', { method: 'POST', body: payload })
  },

  async updateProject(
    projectId: string,
    payload: UpdateProjectPayload,
  ): Promise<ApiResponse<Project>> {
    return apiRequest(`/projects/${encodeURIComponent(projectId)}`, {
      method: 'PUT',
      body: payload,
    })
  },

  async updateProjectKloc(projectId: string, kloc: number): Promise<ApiResponse<Project>> {
    if (!Number.isFinite(kloc) || kloc <= 0) return fail('KLOC must be a positive number.')
    return apiRequest(`/projects/${encodeURIComponent(projectId)}/kloc`, {
      method: 'PUT',
      body: { kloc },
    })
  },

  async updateProjectStatus(
    projectId: string,
    status: ProjectStatus,
  ): Promise<ApiResponse<Project>> {
    if (!(['ACTIVE', 'ON_HOLD', 'COMPLETED'] as ProjectStatus[]).includes(status)) return fail('Invalid project status.')
    return apiRequest(`/projects/${encodeURIComponent(projectId)}`, { method: 'PUT', body: { status } })
  },

  async deleteProject(projectId: string): Promise<ApiResponse<null>> {
    await mockDelay(400)
    const index = mockProjects.findIndex((item) => item.id === projectId)
    if (index === -1) return fail('Project not found.')

    const dependencies = {
      modules: mockModules.filter((item) => item.projectId === projectId).length,
      releases: mockReleases.filter((item) => item.projectId === projectId).length,
      testCases: ALL_TEST_CASES.filter((item) => item.projectId === projectId).length,
      defects: ALL_DEFECTS.filter((item) => item.projectId === projectId).length,
      allocations: mockProjectAllocations.filter((item) => item.projectId === projectId).length,
    }
    if (Object.values(dependencies).some((count) => count > 0)) {
      return fail(
        'This project has dependent modules, releases, test cases, defects, or allocations and cannot be deleted. Change the project status to Completed instead.',
      )
    }

    mockProjects.splice(index, 1)
    return ok(null, 'Project deleted successfully.')
  },

  async getProjectSummary(projectId: string): Promise<ApiResponse<ProjectSummary>> {
    await mockDelay()
    const project = mockProjects.find((item) => item.id === projectId)
    if (!project) return fail('Project not found.')
    const [allocationSummary, warnings] = await Promise.all([
      projectAllocationService.getProjectAllocationSummary(projectId),
      projectAllocationService.getProjectDateWarnings(projectId, project.startDate, project.endDate),
    ])
    if (!allocationSummary.success) return fail(allocationSummary.message)
    return ok({
      project: { ...project },
      moduleCount: mockModules.filter((item) => item.projectId === projectId).length,
      releaseCount: mockReleases.filter((item) => item.projectId === projectId).length,
      testCaseCount: ALL_TEST_CASES.filter((item) => item.projectId === projectId).length,
      defectCount: ALL_DEFECTS.filter((item) => item.projectId === projectId).length,
      allocationSummary: allocationSummary.data,
      allocationDateWarnings: warnings.success ? warnings.data : [],
    })
  },

  async getMyProjects(request: PageRequest): Promise<ApiResponse<Page<Project>>> {
    return this.getProjects({ ...request, filters: { ...request.filters, status: 'ACTIVE', mine: true } })
  },

  async getModules(request: PageRequest): Promise<ApiResponse<Page<ProjectModule>>> {
    await mockDelay()
    return ok(paginate(mockModules, request, ['name', 'ownerName']))
  },

  async getAllocationHistory(request: PageRequest): Promise<ApiResponse<Page<AllocationHistoryEntry>>> {
    const projectId = String(request.filters?.projectId ?? '') || undefined
    return projectAllocationService.getAllocationHistory(projectId, request)
  },

  async getProjectManagerOptions(): Promise<ApiResponse<{ id: string; name: string }[]>> {
    const response = await this.getProjects({ pageNumber: 0, pageSize: 1000 })
    if (!response.success) return fail(response.message)
    const managers = Array.from(
      new Map(response.data.content.map((project) => [project.managerId, project.managerName])).entries(),
      ([id, name]) => ({ id, name }),
    ).sort((a, b) => a.name.localeCompare(b.name))
    return ok(managers)
  },

  async getActiveProjects(): Promise<ApiResponse<Project[]>> {
    const response = await this.getProjects({ pageNumber: 0, pageSize: 1000, filters: { status: 'ACTIVE' } })
    return response.success ? ok(response.data.content, response.message) : fail(response.message)
  },

  async getAuthorizedActiveProjects(
    userId: string,
    canViewAllProjects = false,
  ): Promise<ApiResponse<SelectedProject[]>> {
    if (!userId) return fail('A logged-in user is required to load projects.')
    const response = await this.getProjects({
      pageNumber: 0,
      pageSize: 1000,
      filters: { status: 'ACTIVE', userId: canViewAllProjects ? undefined : userId },
    })
    if (!response.success) return fail(response.message)
    const projects = response.data.content
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((project) => ({
        projectId: project.id,
        projectName: project.name,
        status: project.status,
      }))

    return ok(projects, response.message)
  },
}
