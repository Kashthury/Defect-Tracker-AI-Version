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
import { fail, mockDelay, ok, paginate } from './apiClient'
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
    await mockDelay()
    const filters = request.filters ?? {}
    let rows = [...mockProjects]

    if (filters.status && filters.status !== 'All') {
      rows = rows.filter((project) => project.status === filters.status)
    }
    if (filters.managerId && filters.managerId !== 'All') {
      rows = rows.filter((project) => project.managerId === filters.managerId)
    }
    const rangeStart = String(filters.startDateFrom ?? '')
    const rangeEnd = String(filters.endDateTo ?? '')
    if (rangeStart) rows = rows.filter((project) => project.endDate >= rangeStart)
    if (rangeEnd) rows = rows.filter((project) => project.startDate <= rangeEnd)

    return ok(
      paginate(rows, { ...request, filters: undefined }, ['name', 'clientName', 'managerName']),
    )
  },

  async getProjectById(projectId: string): Promise<ApiResponse<Project>> {
    await mockDelay()
    const project = mockProjects.find((item) => item.id === projectId)
    if (!project) return fail('Project not found.')
    return ok({ ...project })
  },

  async getAuthorizedProjectById(
    projectId: string,
    userId: string,
    canViewAllProjects = false,
  ): Promise<ApiResponse<Project>> {
    await mockDelay()
    const project = mockProjects.find((item) => item.id === projectId)
    if (!project) return fail('Project not found.')
    const hasAllocation = mockProjectAllocations.some(
      (allocation) => allocation.projectId === projectId && allocation.employeeId === userId,
    )
    if (!canViewAllProjects && !hasAllocation) {
      return fail('You are not authorized to access this project.')
    }
    return ok({ ...project })
  },

  async createProject(payload: CreateProjectPayload): Promise<ApiResponse<Project>> {
    await mockDelay(500)
    const validationError = validatePayload(payload)
    if (validationError) return fail(validationError)

    const name = normalizeText(payload.name)
    if (mockProjects.some((project) => project.name.toLowerCase() === name.toLowerCase())) {
      return fail('A project with this name already exists.')
    }

    const availability = await projectAllocationService.getEmployeeAvailability(
      payload.managerId,
      payload.allocationStartDate,
      payload.allocationEndDate,
    )
    if (!availability.success) return fail(availability.message)
    if (payload.allocationPercentage > availability.data.availablePercentage) {
      return fail(
        `Current allocation is ${availability.data.currentAllocationPercentage}%. Available capacity is ${availability.data.availablePercentage}%.`,
      )
    }

    const id = `proj-${nextProjectId++}`
    const now = new Date().toISOString()
    const manager = resolveManagerFields(payload)
    const project: Project = {
      id,
      code: projectCode(name),
      name,
      description: payload.description.trim(),
      status: 'ACTIVE',
      startDate: payload.startDate,
      endDate: payload.endDate,
      clientName: normalizeText(payload.clientName),
      clientPhone: payload.clientPhone.trim(),
      clientCountry: normalizeText(payload.clientCountry),
      clientEmail: payload.clientEmail.trim().toLowerCase(),
      managerId: payload.managerId,
      managerName: manager.managerName,
      managerDesignationId: payload.designationId,
      managerDesignationName: manager.managerDesignationName,
      managerRoleId: payload.projectRoleId,
      managerRoleName: manager.managerRoleName,
      managerAllocationPercentage: payload.allocationPercentage,
      managerAllocationStartDate: payload.allocationStartDate,
      managerAllocationEndDate: payload.allocationEndDate,
      teamCount: 1,
      moduleCount: 0,
      openDefects: 0,
      createdAt: now,
      updatedAt: now,
    }
    mockProjects.unshift(project)

    const allocation = await projectAllocationService.createProjectManagerAllocation({
      projectId: id,
      employeeId: payload.managerId,
      designationId: payload.designationId,
      roleId: payload.projectRoleId,
      allocationPercentage: payload.allocationPercentage,
      startDate: payload.allocationStartDate,
      endDate: payload.allocationEndDate,
    })
    if (!allocation.success) {
      mockProjects.splice(mockProjects.findIndex((item) => item.id === id), 1)
      return fail(allocation.message)
    }
    return ok({ ...project }, 'Project and Project Manager allocation created successfully.')
  },

  async updateProject(
    projectId: string,
    payload: UpdateProjectPayload,
  ): Promise<ApiResponse<Project>> {
    await mockDelay(500)
    const index = mockProjects.findIndex((item) => item.id === projectId)
    if (index === -1) return fail('Project not found.')

    const current = mockProjects[index]
    const allocationStartDate = current.managerAllocationStartDate
    const effectivePayload: UpdateProjectPayload = {
      ...payload,
      allocationStartDate,
    }

    const validationError = validatePayload(effectivePayload)
    if (validationError) return fail(validationError)
    const name = normalizeText(effectivePayload.name)
    if (
      mockProjects.some(
        (project) => project.id !== projectId && project.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      return fail('A project with this name already exists.')
    }

    const availability = await projectAllocationService.getEmployeeAvailability(
      effectivePayload.managerId,
      allocationStartDate,
      effectivePayload.allocationEndDate,
      projectId,
    )
    if (!availability.success) return fail(availability.message)
    if (effectivePayload.allocationPercentage > availability.data.availablePercentage) {
      return fail(
        `Current allocation is ${availability.data.currentAllocationPercentage}%. Available capacity is ${availability.data.availablePercentage}%.`,
      )
    }

    const managerChanged = current.managerId !== effectivePayload.managerId
    if (managerChanged) {
      const today = new Date().toISOString().slice(0, 10)
      const closeDate = today < allocationStartDate ? allocationStartDate : today
      const closed = await projectAllocationService.closePreviousProjectManagerAllocation({
        projectId,
        employeeId: current.managerId,
        endDate: closeDate > current.managerAllocationEndDate ? current.managerAllocationEndDate : closeDate,
      })
      if (!closed.success) return fail(closed.message)

      const created = await projectAllocationService.createProjectManagerAllocation({
        projectId,
        employeeId: effectivePayload.managerId,
        designationId: effectivePayload.designationId,
        roleId: effectivePayload.projectRoleId,
        allocationPercentage: effectivePayload.allocationPercentage,
        startDate: allocationStartDate,
        endDate: effectivePayload.allocationEndDate,
      }, projectId)
      if (!created.success) return fail(created.message)
    } else {
      const updatedAllocation = await projectAllocationService.updateProjectManagerAllocation({
        projectId,
        employeeId: effectivePayload.managerId,
        designationId: effectivePayload.designationId,
        roleId: effectivePayload.projectRoleId,
        allocationPercentage: effectivePayload.allocationPercentage,
        startDate: allocationStartDate,
        endDate: effectivePayload.allocationEndDate,
      })
      if (!updatedAllocation.success) return fail(updatedAllocation.message)
    }

    const manager = resolveManagerFields(effectivePayload)
    const updated: Project = {
      ...current,
      name,
      description: effectivePayload.description.trim(),
      startDate: effectivePayload.startDate,
      endDate: effectivePayload.endDate,
      clientName: normalizeText(effectivePayload.clientName),
      clientPhone: effectivePayload.clientPhone.trim(),
      clientCountry: normalizeText(effectivePayload.clientCountry),
      clientEmail: effectivePayload.clientEmail.trim().toLowerCase(),
      managerId: effectivePayload.managerId,
      managerName: manager.managerName,
      managerDesignationId: effectivePayload.designationId,
      managerDesignationName: manager.managerDesignationName,
      managerRoleId: effectivePayload.projectRoleId,
      managerRoleName: manager.managerRoleName,
      managerAllocationPercentage: effectivePayload.allocationPercentage,
      managerAllocationStartDate: allocationStartDate,
      managerAllocationEndDate: effectivePayload.allocationEndDate,
      updatedAt: new Date().toISOString(),
    }
    mockProjects[index] = updated

    const warningResult = await projectAllocationService.getProjectDateWarnings(
      projectId,
      effectivePayload.startDate,
      effectivePayload.endDate,
    )
    const warningSuffix =
      warningResult.success && warningResult.data.length > 0
        ? ` ${warningResult.data.length} allocation date warning${warningResult.data.length === 1 ? '' : 's'} require review.`
        : ''
    return ok({ ...updated }, `Project updated successfully.${warningSuffix}`)
  },

  async updateProjectStatus(
    projectId: string,
    status: ProjectStatus,
  ): Promise<ApiResponse<Project>> {
    await mockDelay(400)
    const index = mockProjects.findIndex((item) => item.id === projectId)
    if (index === -1) return fail('Project not found.')
    if (!(['ACTIVE', 'ON_HOLD', 'COMPLETED'] as ProjectStatus[]).includes(status)) return fail('Invalid project status.')
    const updated = { ...mockProjects[index], status, updatedAt: new Date().toISOString() }
    mockProjects[index] = updated
    return ok({ ...updated }, `Project status changed to ${status}.`)
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
    await mockDelay()
    return ok(paginate(mockProjects.filter((project) => project.status === 'ACTIVE'), request, ['name', 'code', 'managerName']))
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
    await mockDelay(200)
    const managers = Array.from(
      new Map(mockProjects.map((project) => [project.managerId, project.managerName])).entries(),
      ([id, name]) => ({ id, name }),
    ).sort((a, b) => a.name.localeCompare(b.name))
    return ok(managers)
  },

  async getActiveProjects(): Promise<ApiResponse<Project[]>> {
    await mockDelay(200)
    return ok(mockProjects.filter((project) => project.status === 'ACTIVE').map((project) => ({ ...project })))
  },

  async getAuthorizedActiveProjects(
    userId: string,
    canViewAllProjects = false,
  ): Promise<ApiResponse<SelectedProject[]>> {
    await mockDelay(250)
    if (!userId) return fail('A logged-in user is required to load projects.')

    const allocatedProjectIds = new Set(
      mockProjectAllocations
        .filter((allocation) => allocation.employeeId === userId && allocation.status === 'ACTIVE')
        .map((allocation) => allocation.projectId),
    )
    const projects = mockProjects
      .filter(
        (project) =>
          project.status === 'ACTIVE' &&
          (canViewAllProjects || allocatedProjectIds.has(project.id)),
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((project) => ({
        projectId: project.id,
        projectName: project.name,
        status: project.status,
      }))

    return ok(projects)
  },
}
