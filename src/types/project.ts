export type ProjectStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED'
export type AllocationDisplayStatus = 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type ProjectAllocationStatus = AllocationDisplayStatus | 'CLOSED'
export type ProjectAllocationType = 'PROJECT_MANAGER' | 'TEAM_MEMBER'

export interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  startDate: string
  endDate: string
  clientName: string
  clientPhone: string
  clientCountry: string
  clientEmail: string
  managerId: string
  managerName: string
  managerEmployeeCode?: string
  managerDesignationId: string
  managerDesignationName: string
  managerAllocationPercentage: number
  managerAllocationStartDate?: string
  managerAllocationEndDate?: string
  teamCount: number
  moduleCount: number
  openDefects: number
  currentRelease?: string
  kloc?: number
  createdAt: string
  updatedAt: string
}

export interface ProjectFormPayload {
  name: string
  description: string
  startDate: string
  endDate: string
  designationId: string
  managerId: string
  managerAllocationPercentage: number
  managerChangeEffectiveDate: string
  clientName: string
  clientPhone: string
  clientCountry: string
  clientEmail: string
}

export interface ProjectCreateRequest {
  name: string
  description?: string
  startDate: string
  endDate: string
  managerId: number
  managerAllocationPercentage: number
  managerDesignationId?: number
  clientName: string
  clientPhone?: string
  clientCountry: string
  clientEmail: string
}

export interface ProjectUpdateRequest extends ProjectCreateRequest {
  managerChangeEffectiveDate?: string
}

export type CreateProjectPayload = ProjectCreateRequest
export type UpdateProjectPayload = ProjectUpdateRequest

export interface ProjectModule {
  id: string
  projectId: string
  name: string
  description: string
  ownerName: string
}

export interface ProjectAllocation {
  id: string
  projectId: string
  employeeId: string
  designationId: string
  roleId: string
  roleName: string
  allocationType: ProjectAllocationType
  allocationPercentage: number
  startDate: string
  endDate: string
  status: ProjectAllocationStatus
  createdAt: string
  updatedAt: string
}

export type EmployeeAvailabilityBand = 'FULLY_AVAILABLE' | 'PARTIALLY_AVAILABLE'

export interface EmployeeAllocationSummary {
  allocationId: string
  projectId: string
  projectName: string
  roleId: string
  roleName: string
  allocationPercentage: number
  startDate: string
  endDate: string
  status: AllocationDisplayStatus
  managerAllocation: boolean
}

export interface AvailableEmployee {
  employeeId: string
  employeeName: string
  employeeCode?: string
  email: string
  phone?: string
  joinDate?: string
  designationId: string
  designationName: string
  allocatedPercentage: number
  availablePercentage: number
  allocations: EmployeeAllocationSummary[]
}

export interface CreateTeamMemberAllocationsPayload {
  projectId: string
  allocations: TeamMemberAllocationInput[]
}

export interface TeamMemberAllocationInput {
  employeeId: string
  roleId: string
  allocationPercentage: number
  startDate: string
  endDate: string
}

export interface EmployeeAvailability {
  employeeId: string
  allocatedPercentage: number
  availablePercentage: number
  overlappingAllocationCount: number
}

export interface AvailableProjectManager extends EmployeeAvailability {
  employeeName: string
  designationId: string
  designationName: string
}

export interface CreateProjectManagerAllocationPayload {
  projectId: string
  employeeId: string
  designationId: string
  roleId: string
  allocationPercentage: number
  startDate: string
  endDate: string
}

export interface UpdateProjectManagerAllocationPayload
  extends CreateProjectManagerAllocationPayload {}

export interface CloseProjectManagerAllocationPayload {
  projectId: string
  employeeId: string
  endDate: string
}

export interface AllocatedTeamMember {
  allocationId: string
  projectId: string
  employeeId: string
  employeeName: string
  employeeCode?: string
  email?: string
  designationId?: string
  designationName: string
  roleId: string
  roleName: string
  roleType: string
  allocationPercentage: number
  startDate: string
  endDate: string
  status: AllocationDisplayStatus
  managerAllocation: boolean
}

export interface ExtendTeamMemberAllocationPayload {
  newEndDate: string
}

export interface UpdateTeamMemberAllocationPercentagePayload {
  allocationPercentage: number
  effectiveDate: string
}

export interface UpdateTeamMemberAllocationRolePayload {
  roleId: string
  effectiveDate: string
}

export interface DeallocateTeamMemberPayload {
  effectiveDate: string
  reason?: string
}

export interface DeallocateTeamMembersPayload {
  allocationIds: string[]
  effectiveDate: string
  reason?: string
}

export interface AllocationHistoryEntry {
  id: string
  projectId: string
  employeeId: string
  employeeName: string
  projectName: string
  roleOnProject: string
  allocatedFrom: string
  allocatedTo: string | null
  allocationPercentage: number
  status: ProjectAllocationStatus
}

export interface ProjectAllocationSummary {
  projectId: string
  activeAllocationCount: number
  totalAllocatedPercentage: number
  managerAllocationPercentage: number
  averageUtilizationPercentage: number
}

export interface ProjectSummary {
  project: Project
  moduleCount: number
  releaseCount: number
  testCaseCount: number
  defectCount: number
  allocationSummary: ProjectAllocationSummary
  allocationDateWarnings: string[]
}

export interface SelectedProject {
  projectId: string
  projectName: string
  status: ProjectStatus
}
