import { ALL_DEFECTS, ALL_TEST_CASES } from '@/mock/generators'
import { mockProjectAllocations } from '@/mock/projectAllocations'
import { mockModules, mockProjects } from '@/mock/projects'
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

let nextProjectId = mockProjects.length + 1

export const projectService = {
  async getProjects(request: PageRequest): Promise<ApiResponse<Page<Project>>> {
    return getConfigurationPage('/projects', request)
  },

  async getProjectById(projectId: string): Promise<ApiResponse<Project>> {
    return apiRequest(`/projects/${encodeURIComponent(projectId)}`)
  },

  async getAuthorizedProjectById(projectId: string): Promise<ApiResponse<Project>> {
    // Project authorization is enforced by the backend using the bearer token.
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
    effectiveCompletionDate?: string,
  ): Promise<ApiResponse<Project>> {
    if (!(['ACTIVE', 'ON_HOLD', 'COMPLETED'] as ProjectStatus[]).includes(status)) return fail('Invalid project status.')
    if (status === 'COMPLETED' && !effectiveCompletionDate) return fail('Effective Completion Date is required.')
    return apiRequest(`/projects/${encodeURIComponent(projectId)}`, {
      method: 'PUT',
      body: {
        status,
        ...(status === 'COMPLETED' ? { effectiveCompletionDate } : {}),
      },
    })
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
    return this.getProjects({ ...request, filters: { ...request.filters, status: 'ACTIVE' } })
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

  async getAuthorizedActiveProjects(): Promise<ApiResponse<SelectedProject[]>> {
    const response = await this.getProjects({
      pageNumber: 0,
      pageSize: 1000,
      filters: { status: 'ACTIVE' },
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
