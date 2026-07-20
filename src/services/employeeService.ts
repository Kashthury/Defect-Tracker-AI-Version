import { ApiResponse, Page, PageRequest } from '@/types/common'
import { Employee, EmployeeStatus, CreateEmployeePayload, UpdateEmployeePayload } from '@/types/employee'
import { mockEmployeeRecords } from '@/mock/employees'
import { mockDelay, ok, fail, paginate } from './apiClient'

const colors = ['#12507F', '#3E8E64', '#C99A2E', '#C13B3B', '#6B4FA0', '#0D3B66', '#2E8FC9', '#8B5A2B', '#2D6A4F', '#7B2D8E']

let nextId = mockEmployeeRecords.length + 1

export const employeeService = {
  async getEmployees(request: PageRequest): Promise<ApiResponse<Page<Employee>>> {
    await mockDelay()
    return ok(
      paginate(mockEmployeeRecords, request, ['firstName', 'lastName', 'email', 'phone']),
    )
  },

  async getEmployeeById(id: string): Promise<ApiResponse<Employee>> {
    await mockDelay()
    const employee = mockEmployeeRecords.find((e) => e.id === id)
    if (!employee) return fail('Employee not found.')
    return ok(employee)
  },

  async createEmployee(payload: CreateEmployeePayload): Promise<ApiResponse<Employee>> {
    await mockDelay(500)
    const duplicate = mockEmployeeRecords.find(
      (e) => e.email.toLowerCase() === payload.email.trim().toLowerCase(),
    )
    if (duplicate) return fail('An employee with this email already exists.')

    const now = new Date().toISOString()
    const newEmployee: Employee = {
      id: `emp-${String(nextId++).padStart(4, '0')}`,
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      gender: payload.gender as Employee['gender'],
      designationId: payload.designationId,
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone.trim(),
      joinDate: payload.joinDate,
      profileImage: payload.profileImage,
      status: 'ACTIVE',
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      createdAt: now,
      updatedAt: now,
    }
    mockEmployeeRecords.unshift(newEmployee)
    return ok(newEmployee, 'Employee created successfully.')
  },

  async updateEmployee(id: string, payload: UpdateEmployeePayload): Promise<ApiResponse<Employee>> {
    await mockDelay(500)
    const index = mockEmployeeRecords.findIndex((e) => e.id === id)
    if (index === -1) return fail('Employee not found.')

    const emailDuplicate = mockEmployeeRecords.find(
      (e) => e.id !== id && e.email.toLowerCase() === payload.email.trim().toLowerCase(),
    )
    if (emailDuplicate) return fail('An employee with this email already exists.')

    const updated: Employee = {
      ...mockEmployeeRecords[index],
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      gender: payload.gender as Employee['gender'],
      designationId: payload.designationId,
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone.trim(),
      joinDate: payload.joinDate,
      profileImage: payload.profileImage,
      updatedAt: new Date().toISOString(),
    }
    mockEmployeeRecords[index] = updated
    return ok(updated, 'Employee updated successfully.')
  },

  async updateEmployeeStatus(id: string, status: EmployeeStatus): Promise<ApiResponse<Employee>> {
    await mockDelay(400)
    const index = mockEmployeeRecords.findIndex((e) => e.id === id)
    if (index === -1) return fail('Employee not found.')

    const updated: Employee = {
      ...mockEmployeeRecords[index],
      status,
      updatedAt: new Date().toISOString(),
    }
    mockEmployeeRecords[index] = updated
    return ok(updated, `Employee status changed to ${status}.`)
  },

  async deleteEmployee(id: string): Promise<ApiResponse<null>> {
    await mockDelay(400)
    const index = mockEmployeeRecords.findIndex((e) => e.id === id)
    if (index === -1) return fail('Employee not found.')
    mockEmployeeRecords.splice(index, 1)
    return ok(null, 'Employee deleted successfully.')
  },
}
