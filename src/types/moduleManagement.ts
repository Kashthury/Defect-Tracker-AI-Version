export interface ModuleRecord {
  id: string
  projectId: string
  name: string
  description: string
  active?: boolean
  qaEmployeeIds: string[]
  submoduleCount: number
  testCaseCount: number
  defectCount: number
}

export interface SubmoduleRecord {
  id: string
  projectId: string
  moduleId: string
  name: string
  description: string
  active?: boolean
  developerEmployeeIds: string[]
  testCaseCount: number
  defectCount: number
}

export interface AssignedProjectMember {
  employeeId: string
  employeeName: string
  roleName: string
  roleType: string
  allocationPercentage: number
  startDate: string
  endDate: string
}
