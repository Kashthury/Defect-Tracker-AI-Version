export type ProjectStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED'
export type ProjectAllocationStatus = 'ACTIVE' | 'CLOSED'
export type ProjectAllocationType = 'PROJECT_MANAGER' | 'TEAM_MEMBER'

export interface Project {
  id: string
  code: string
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
  managerDesignationId: string
  managerDesignationName: string
  managerRoleId: string
  managerRoleName: string
  managerAllocationPercentage: number
  managerAllocationStartDate: string
  managerAllocationEndDate: string
  teamCount: number
  moduleCount: number
  openDefects: number
  currentRelease?: string
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
  projectRoleId: string
  allocationPercentage: number
  allocationStartDate: string
  allocationEndDate: string
  clientName: string
  clientPhone: string
  clientCountry: string
  clientEmail: string
}

export type CreateProjectPayload = ProjectFormPayload
export type UpdateProjectPayload = ProjectFormPayload

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

export interface EmployeeAvailability {
  employeeId: string
  currentAllocationPercentage: number
  availablePercentage: number
  overlappingAllocationCount: number
}

export type EmployeeAvailabilityBand = 'AVAILABLE' | 'PARTIAL' | 'FULL'

export interface AvailableEmployee extends EmployeeAvailability {
  employeeName: string
  email: string
  phone: string
  joinDate: string
  designationId: string
  designationName: string
  currentProjects: string[]
  currentRoles: string[]
  availabilityBand: EmployeeAvailabilityBand
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
  id: string
  projectId: string
  employeeId: string
  employeeName: string
  email: string
  designationName: string
  roleId: string
  roleName: string
  allocationPercentage: number
  startDate: string
  endDate: string
  status: ProjectAllocationStatus
  currentAllocationPercentage: number
  availablePercentage: number
  availabilityBand: EmployeeAvailabilityBand
}

export interface ExtendTeamMemberAllocationPayload {
  allocationId: string
  endDate: string
}

export interface UpdateTeamMemberAllocationPercentagePayload {
  allocationId: string
  allocationPercentage: number
}

export interface DeallocateTeamMembersPayload {
  allocationIds: string[]
  endDate?: string
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
  allocationPercent: number
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
