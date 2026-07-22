export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

export interface EmployeeResponse {
  id: number
  employeeCode: string
  firstName: string
  lastName: string
  fullName: string
  gender: Gender
  email: string
  phoneNo: string
  joinDate: string
  designationId: number
  designationName: string
  active: boolean
  profileImage?: string | null
  avatarColor?: string | null
  superUser: boolean
  createdAt?: string
  updatedAt?: string
}

export interface EmployeeCreateRequest {
  firstName: string
  lastName: string
  gender: Gender
  email: string
  phoneNo: string
  joinDate: string
  designationId: number
  profileImage?: string | null
}

export interface EmployeeUpdateRequest extends EmployeeCreateRequest {
  active: boolean
}

export interface EmployeeDropdownResponse {
  id: number
  employeeCode: string
  fullName: string
  email: string
  designationId: number
  designationName: string
}

export interface EmployeeListParams {
  search?: string
  designationId?: number
  gender?: Gender
  active?: boolean
  page?: number
  size?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

/** Legacy mock-only shape retained for unrelated allocation simulations. */
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE'
export type LegacyGender = 'Male' | 'Female'
export interface Employee {
  id: string
  firstName: string
  lastName: string
  gender: LegacyGender
  designationId: string
  email: string
  phone: string
  joinDate: string
  profileImage?: string
  status: EmployeeStatus
  avatarColor: string
  createdAt: string
  updatedAt: string
}

export type CreateEmployeePayload = EmployeeCreateRequest
export type UpdateEmployeePayload = EmployeeUpdateRequest
