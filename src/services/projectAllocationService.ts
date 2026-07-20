import { mockDesignations } from '@/mock/designations'
import { mockEmployeeRecords } from '@/mock/employees'
import { mockProjectAllocations } from '@/mock/projectAllocations'
import { mockProjects } from '@/mock/projects'
import { mockRoles } from '@/mock/roles'
import { ApiResponse, Page, PageRequest } from '@/types/common'
import {
  AllocatedTeamMember,
  AllocationHistoryEntry,
  AvailableEmployee,
  AvailableProjectManager,
  CloseProjectManagerAllocationPayload,
  CreateProjectManagerAllocationPayload,
  CreateTeamMemberAllocationsPayload,
  DeallocateTeamMembersPayload,
  EmployeeAvailability,
  ExtendTeamMemberAllocationPayload,
  ProjectAllocation,
  ProjectAllocationSummary,
  UpdateProjectManagerAllocationPayload,
  UpdateTeamMemberAllocationPercentagePayload,
} from '@/types/project'
import { fail, mockDelay, ok, paginate } from './apiClient'

let nextAllocationId = mockProjectAllocations.length + 1

const datesOverlap = (startA: string, endA: string, startB: string, endB: string) =>
  startA <= endB && endA >= startB

const overlappingAllocations = (
  employeeId: string,
  startDate: string,
  endDate: string,
  excludeProjectId?: string,
) =>
  mockProjectAllocations.filter(
    (allocation) =>
      allocation.employeeId === employeeId &&
      allocation.status === 'ACTIVE' &&
      allocation.projectId !== excludeProjectId &&
      datesOverlap(allocation.startDate, allocation.endDate, startDate, endDate),
  )

const availabilityFor = (
  employeeId: string,
  startDate: string,
  endDate: string,
  excludeProjectId?: string,
): EmployeeAvailability => {
  const overlaps = overlappingAllocations(employeeId, startDate, endDate, excludeProjectId)
  const currentAllocationPercentage = overlaps.reduce(
    (total, allocation) => total + allocation.allocationPercentage,
    0,
  )
  return {
    employeeId,
    currentAllocationPercentage,
    availablePercentage: Math.max(0, 100 - currentAllocationPercentage),
    overlappingAllocationCount: overlaps.length,
  }
}

const validateAllocation = (
  payload: CreateProjectManagerAllocationPayload,
  excludeProjectId?: string,
): string | null => {
  if (!payload.employeeId) return 'Project Manager is required.'
  if (!payload.designationId) return 'Designation is required.'
  if (!payload.roleId) return 'Project Role is required.'
  if (!payload.startDate || !payload.endDate) return 'Allocation dates are required.'
  if (payload.endDate < payload.startDate) return 'Allocation End Date cannot be earlier than Allocation Start Date.'
  if (!Number.isFinite(payload.allocationPercentage) || payload.allocationPercentage <= 0) {
    return 'Allocation Percentage must be greater than 0.'
  }
  if (payload.allocationPercentage > 100) return 'Allocation Percentage cannot exceed 100%.'

  const employee = mockEmployeeRecords.find(
    (item) => item.id === payload.employeeId && item.status === 'ACTIVE',
  )
  if (!employee) return 'Select an active Project Manager.'
  if (employee.designationId !== payload.designationId) {
    return 'The selected employee does not match the selected Designation.'
  }

  const role = mockRoles.find((item) => item.id === payload.roleId && item.status === 'ACTIVE')
  if (!role) return 'Select an active Project Role.'

  const availability = availabilityFor(
    payload.employeeId,
    payload.startDate,
    payload.endDate,
    excludeProjectId,
  )
  if (payload.allocationPercentage > availability.availablePercentage) {
    return `Current allocation is ${availability.currentAllocationPercentage}%. Available capacity is ${availability.availablePercentage}%.`
  }
  return null
}

const allocationHistoryRows = (): AllocationHistoryEntry[] =>
  mockProjectAllocations.map((allocation) => {
    const employee = mockEmployeeRecords.find((item) => item.id === allocation.employeeId)
    const project = mockProjects.find((item) => item.id === allocation.projectId)
    return {
      id: allocation.id,
      projectId: allocation.projectId,
      employeeId: allocation.employeeId,
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee',
      projectName: project?.name ?? 'Unknown Project',
      roleOnProject: allocation.roleName,
      allocatedFrom: allocation.startDate,
      allocatedTo: allocation.status === 'ACTIVE' ? null : allocation.endDate,
      allocationPercent: allocation.allocationPercentage,
      status: allocation.status,
    }
  })

export const projectAllocationService = {
  async getEmployeeAvailability(
    employeeId: string,
    startDate: string,
    endDate: string,
    excludeProjectId?: string,
  ): Promise<ApiResponse<EmployeeAvailability>> {
    await mockDelay(250)
    const employee = mockEmployeeRecords.find((item) => item.id === employeeId)
    if (!employee) return fail('Employee not found.')
    return ok(availabilityFor(employeeId, startDate, endDate, excludeProjectId))
  },

  async getAvailableProjectManagers(
    designationId: string,
    startDate: string,
    endDate: string,
    allocationPercentage: number,
    excludeProjectId?: string,
  ): Promise<ApiResponse<AvailableProjectManager[]>> {
    await mockDelay()
    if (!designationId || !startDate || !endDate || endDate < startDate) return ok([])

    const designation = mockDesignations.find((item) => item.id === designationId)
    if (!designation) return fail('Designation not found.')

    const requested = Number.isFinite(allocationPercentage) ? Math.max(0, allocationPercentage) : 0
    const managers = mockEmployeeRecords
      .filter((employee) => employee.status === 'ACTIVE' && employee.designationId === designationId)
      .map((employee) => {
        const availability = availabilityFor(employee.id, startDate, endDate, excludeProjectId)
        return {
          ...availability,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          designationId,
          designationName: designation.title,
        }
      })
      .filter((employee) => requested <= employee.availablePercentage)
      .sort((a, b) => b.availablePercentage - a.availablePercentage || a.employeeName.localeCompare(b.employeeName))

    return ok(managers)
  },

  async getAvailableEmployees(
    request: PageRequest,
    startDate = new Date().toISOString().slice(0, 10),
    endDate = startDate,
  ): Promise<ApiResponse<Page<AvailableEmployee>>> {
    await mockDelay()

    const rows = mockEmployeeRecords
      .filter((employee) => employee.status === 'ACTIVE')
      .map((employee): AvailableEmployee => {
        const availability = availabilityFor(employee.id, startDate, endDate)
        const allocations = overlappingAllocations(employee.id, startDate, endDate)
        const designation = mockDesignations.find((item) => item.id === employee.designationId)
        const currentProjects = Array.from(new Set(allocations.map((allocation) =>
          mockProjects.find((project) => project.id === allocation.projectId)?.name ?? 'Unknown Project',
        )))
        const currentRoles = Array.from(new Set(allocations.map((allocation) => allocation.roleName)))

        return {
          ...availability,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          email: employee.email,
          phone: employee.phone,
          joinDate: employee.joinDate,
          designationId: employee.designationId,
          designationName: designation?.title ?? 'Unassigned',
          currentProjects,
          currentRoles,
          availabilityBand:
            availability.availablePercentage === 100
              ? 'AVAILABLE'
              : availability.availablePercentage > 0
                ? 'PARTIAL'
                : 'FULL',
        }
      })
      .filter((employee) => employee.availablePercentage > 0)

    return ok(
      paginate(rows, request, [
        'employeeName',
        'email',
        'designationName',
        'currentProjects',
        'currentRoles',
      ]),
    )
  },

  async createTeamMemberAllocations(
    payload: CreateTeamMemberAllocationsPayload,
  ): Promise<ApiResponse<ProjectAllocation[]>> {
    await mockDelay(500)

    const project = mockProjects.find(
      (item) => item.id === payload.projectId && item.status === 'ACTIVE',
    )
    if (!project) return fail('Select an active project before allocating employees.')
    if (payload.allocations.length === 0) return fail('Select at least one employee to allocate.')
    if (new Set(payload.allocations.map((item) => item.employeeId)).size !== payload.allocations.length) {
      return fail('Each employee can only appear once in an allocation request.')
    }

    for (const item of payload.allocations) {
      const employee = mockEmployeeRecords.find((record) => record.id === item.employeeId)
      if (!employee) return fail('One of the selected employees could not be found.')
      const validationError = validateAllocation({
        projectId: payload.projectId,
        employeeId: item.employeeId,
        designationId: employee.designationId,
        roleId: item.roleId,
        allocationPercentage: item.allocationPercentage,
        startDate: item.startDate,
        endDate: item.endDate,
      })
      if (validationError) {
        return fail(`${employee.firstName} ${employee.lastName}: ${validationError}`)
      }
    }

    const now = new Date().toISOString()
    const allocations = payload.allocations.map((item): ProjectAllocation => {
      const employee = mockEmployeeRecords.find((record) => record.id === item.employeeId)!
      const role = mockRoles.find((record) => record.id === item.roleId)!
      return {
        id: `pa-${nextAllocationId++}`,
        projectId: payload.projectId,
        employeeId: item.employeeId,
        designationId: employee.designationId,
        roleId: item.roleId,
        roleName: role.name,
        allocationType: 'TEAM_MEMBER',
        allocationPercentage: item.allocationPercentage,
        startDate: item.startDate,
        endDate: item.endDate,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      }
    })

    mockProjectAllocations.push(...allocations)
    project.teamCount += allocations.length
    project.updatedAt = now
    return ok(
      allocations,
      `${allocations.length} employee${allocations.length === 1 ? '' : 's'} allocated successfully.`,
    )
  },

  async getProjectTeamAllocations(
    projectId: string,
    request: PageRequest,
  ): Promise<ApiResponse<Page<AllocatedTeamMember>>> {
    await mockDelay()

    const rows = mockProjectAllocations
      .filter(
        (allocation) =>
          allocation.projectId === projectId &&
          allocation.allocationType === 'TEAM_MEMBER' &&
          allocation.status === 'ACTIVE',
      )
      .map((allocation): AllocatedTeamMember => {
        const employee = mockEmployeeRecords.find((item) => item.id === allocation.employeeId)
        const designation = mockDesignations.find((item) => item.id === allocation.designationId)
        const availability = availabilityFor(allocation.employeeId, allocation.startDate, allocation.endDate)
        return {
          id: allocation.id,
          projectId: allocation.projectId,
          employeeId: allocation.employeeId,
          employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee',
          email: employee?.email ?? '',
          designationName: designation?.title ?? 'Unassigned',
          roleId: allocation.roleId,
          roleName: allocation.roleName,
          allocationPercentage: allocation.allocationPercentage,
          startDate: allocation.startDate,
          endDate: allocation.endDate,
          status: allocation.status,
          currentAllocationPercentage: availability.currentAllocationPercentage,
          availablePercentage: availability.availablePercentage,
          availabilityBand: availability.availablePercentage === 100 ? 'AVAILABLE' : availability.availablePercentage > 0 ? 'PARTIAL' : 'FULL',
        }
      })

    return ok(paginate(rows, request, ['employeeName', 'roleName', 'designationName']))
  },

  async extendTeamMemberAllocation(
    payload: ExtendTeamMemberAllocationPayload,
  ): Promise<ApiResponse<ProjectAllocation>> {
    await mockDelay(350)
    const index = mockProjectAllocations.findIndex(
      (item) => item.id === payload.allocationId && item.allocationType === 'TEAM_MEMBER' && item.status === 'ACTIVE',
    )
    if (index === -1) return fail('Active allocation not found.')
    const allocation = mockProjectAllocations[index]

    if (!payload.endDate) return fail('End Date is required.')
    if (payload.endDate < allocation.startDate) return fail('End Date cannot be earlier than Start Date.')

    const availability = availabilityFor(allocation.employeeId, allocation.startDate, payload.endDate, allocation.projectId)
    if (allocation.allocationPercentage > availability.availablePercentage) {
      return fail(
        `Extending would exceed available capacity. Current allocation elsewhere is ${availability.currentAllocationPercentage}%; available capacity is ${availability.availablePercentage}%.`,
      )
    }

    const updated: ProjectAllocation = {
      ...allocation,
      endDate: payload.endDate,
      updatedAt: new Date().toISOString(),
    }
    mockProjectAllocations[index] = updated
    return ok(updated, 'Allocation End Date extended successfully.')
  },

  async updateTeamMemberAllocationPercentage(
    payload: UpdateTeamMemberAllocationPercentagePayload,
  ): Promise<ApiResponse<ProjectAllocation>> {
    await mockDelay(350)
    const index = mockProjectAllocations.findIndex(
      (item) => item.id === payload.allocationId && item.allocationType === 'TEAM_MEMBER' && item.status === 'ACTIVE',
    )
    if (index === -1) return fail('Active allocation not found.')
    const allocation = mockProjectAllocations[index]

    if (!Number.isFinite(payload.allocationPercentage) || payload.allocationPercentage <= 0) {
      return fail('Allocation Percentage must be greater than 0.')
    }
    if (payload.allocationPercentage > 100) return fail('Allocation Percentage cannot exceed 100%.')

    const availability = availabilityFor(allocation.employeeId, allocation.startDate, allocation.endDate, allocation.projectId)
    if (payload.allocationPercentage > availability.availablePercentage) {
      return fail(
        `Current allocation elsewhere is ${availability.currentAllocationPercentage}%. Available capacity is ${availability.availablePercentage}%.`,
      )
    }

    const updated: ProjectAllocation = {
      ...allocation,
      allocationPercentage: payload.allocationPercentage,
      updatedAt: new Date().toISOString(),
    }
    mockProjectAllocations[index] = updated
    return ok(updated, 'Allocation Percentage updated successfully.')
  },

  async deallocateTeamMembers(
    payload: DeallocateTeamMembersPayload,
  ): Promise<ApiResponse<number>> {
    await mockDelay(400)
    if (payload.allocationIds.length === 0) return fail('Select at least one employee to deallocate.')

    const now = new Date().toISOString()
    const today = now.slice(0, 10)
    let deallocatedCount = 0

    payload.allocationIds.forEach((allocationId) => {
      const index = mockProjectAllocations.findIndex(
        (item) => item.id === allocationId && item.allocationType === 'TEAM_MEMBER' && item.status === 'ACTIVE',
      )
      if (index === -1) return
      const allocation = mockProjectAllocations[index]
      const closingDate = payload.endDate ?? (allocation.endDate < today ? allocation.endDate : today)
      mockProjectAllocations[index] = {
        ...allocation,
        endDate: closingDate,
        status: 'CLOSED',
        updatedAt: now,
      }
      const project = mockProjects.find((item) => item.id === allocation.projectId)
      if (project) project.teamCount = Math.max(0, project.teamCount - 1)
      deallocatedCount += 1
    })

    if (deallocatedCount === 0) return fail('Selected allocations could not be found.')
    return ok(
      deallocatedCount,
      `${deallocatedCount} employee${deallocatedCount === 1 ? '' : 's'} deallocated successfully.`,
    )
  },

  async createProjectManagerAllocation(
    payload: CreateProjectManagerAllocationPayload,
    excludeProjectId?: string,
  ): Promise<ApiResponse<ProjectAllocation>> {
    await mockDelay(400)
    const validationError = validateAllocation(payload, excludeProjectId)
    if (validationError) return fail(validationError)

    const existing = mockProjectAllocations.find(
      (item) => item.projectId === payload.projectId && item.allocationType === 'PROJECT_MANAGER' && item.status === 'ACTIVE',
    )
    if (existing) return fail('This project already has an active Project Manager allocation.')

    const role = mockRoles.find((item) => item.id === payload.roleId)!
    const now = new Date().toISOString()
    const allocation: ProjectAllocation = {
      id: `pa-${nextAllocationId++}`,
      ...payload,
      roleName: role.name,
      allocationType: 'PROJECT_MANAGER',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    }
    mockProjectAllocations.push(allocation)
    return ok(allocation, 'Project Manager allocation created successfully.')
  },

  async updateProjectManagerAllocation(
    payload: UpdateProjectManagerAllocationPayload,
  ): Promise<ApiResponse<ProjectAllocation>> {
    await mockDelay(400)
    const validationError = validateAllocation(payload, payload.projectId)
    if (validationError) return fail(validationError)

    const index = mockProjectAllocations.findIndex(
      (item) =>
        item.projectId === payload.projectId &&
        item.employeeId === payload.employeeId &&
        item.allocationType === 'PROJECT_MANAGER' &&
        item.status === 'ACTIVE',
    )
    if (index === -1) return fail('Active Project Manager allocation not found.')

    const role = mockRoles.find((item) => item.id === payload.roleId)!
    const updated: ProjectAllocation = {
      ...mockProjectAllocations[index],
      designationId: payload.designationId,
      roleId: payload.roleId,
      roleName: role.name,
      allocationPercentage: payload.allocationPercentage,
      startDate: payload.startDate,
      endDate: payload.endDate,
      updatedAt: new Date().toISOString(),
    }
    mockProjectAllocations[index] = updated
    return ok(updated, 'Project Manager allocation updated successfully.')
  },

  async closePreviousProjectManagerAllocation(
    payload: CloseProjectManagerAllocationPayload,
  ): Promise<ApiResponse<ProjectAllocation>> {
    await mockDelay(350)
    const index = mockProjectAllocations.findIndex(
      (item) =>
        item.projectId === payload.projectId &&
        item.employeeId === payload.employeeId &&
        item.allocationType === 'PROJECT_MANAGER' &&
        item.status === 'ACTIVE',
    )
    if (index === -1) return fail('Previous Project Manager allocation not found.')

    const updated: ProjectAllocation = {
      ...mockProjectAllocations[index],
      endDate: payload.endDate,
      status: 'CLOSED',
      updatedAt: new Date().toISOString(),
    }
    mockProjectAllocations[index] = updated
    return ok(updated, 'Previous Project Manager allocation closed successfully.')
  },

  async getProjectAllocationSummary(
    projectId: string,
  ): Promise<ApiResponse<ProjectAllocationSummary>> {
    await mockDelay(250)
    const allocations = mockProjectAllocations.filter(
      (item) => item.projectId === projectId && item.status === 'ACTIVE',
    )
    const totalAllocatedPercentage = allocations.reduce(
      (total, allocation) => total + allocation.allocationPercentage,
      0,
    )
    const managerAllocationPercentage =
      allocations.find((item) => item.allocationType === 'PROJECT_MANAGER')?.allocationPercentage ?? 0
    return ok({
      projectId,
      activeAllocationCount: allocations.length,
      totalAllocatedPercentage,
      managerAllocationPercentage,
      averageUtilizationPercentage:
        allocations.length > 0 ? Math.round(totalAllocatedPercentage / allocations.length) : 0,
    })
  },

  async getAllocationHistory(
    projectId?: string,
    request: PageRequest = { pageNumber: 0, pageSize: 10 },
  ): Promise<ApiResponse<Page<AllocationHistoryEntry>>> {
    await mockDelay()
    const rows = projectId
      ? allocationHistoryRows().filter((item) => item.projectId === projectId)
      : allocationHistoryRows()
    return ok(paginate(rows, request, ['employeeName', 'projectName', 'roleOnProject']))
  },

  async getProjectDateWarnings(
    projectId: string,
    projectStartDate: string,
    projectEndDate: string,
  ): Promise<ApiResponse<string[]>> {
    await mockDelay(200)
    const warnings = mockProjectAllocations
      .filter((item) => item.projectId === projectId && item.status === 'ACTIVE')
      .filter((item) => item.startDate < projectStartDate || item.endDate > projectEndDate)
      .map((item) => {
        const employee = mockEmployeeRecords.find((record) => record.id === item.employeeId)
        const name = employee ? `${employee.firstName} ${employee.lastName}` : 'An employee'
        return `${name}'s allocation (${item.startDate} to ${item.endDate}) falls outside the project period.`
      })
    return ok(warnings)
  },
}
