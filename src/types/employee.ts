/**
 * Employee Management module types.
 *
 * Separate from the lightweight `Employee` type in auth.ts which drives
 * login / session concerns. This richer type models the full employee
 * record managed via User Management → Employees.
 */

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE'
export type Gender = 'Male' | 'Female'

export interface Employee {
  id: string
  firstName: string
  lastName: string
  gender: Gender
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

export interface CreateEmployeePayload {
  firstName: string
  lastName: string
  gender: Gender | ''
  designationId: string
  email: string
  phone: string
  joinDate: string
  profileImage?: string
}

export interface UpdateEmployeePayload {
  firstName: string
  lastName: string
  gender: Gender | ''
  designationId: string
  email: string
  phone: string
  joinDate: string
  profileImage?: string
}
