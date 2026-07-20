import { ApiResponse, Page, PageRequest } from '@/types/common'
import { Role, Privilege, Designation } from '@/types/auth'
import { Employee } from '@/types/employee'
import { mockEmployeeRecords } from '@/mock/employees'
import { mockRoles } from '@/mock/roles'
import { mockPrivileges } from '@/mock/privileges'
import { mockDesignations } from '@/mock/designations'
import { mockDelay, ok, paginate } from './apiClient'

export const userService = {
  async getEmployees(request: PageRequest): Promise<ApiResponse<Page<Employee>>> {
    await mockDelay()
    return ok(paginate(mockEmployeeRecords, request, ['firstName', 'lastName', 'email']))
  },

  async getRoles(request: PageRequest): Promise<ApiResponse<Page<Role>>> {
    await mockDelay()
    return ok(paginate(mockRoles, request, ['name', 'description']))
  },

  async getPrivileges(request: PageRequest): Promise<ApiResponse<Page<Privilege>>> {
    await mockDelay()
    return ok(paginate(mockPrivileges, request, ['code', 'module', 'action']))
  },

  async getDesignations(request: PageRequest): Promise<ApiResponse<Page<Designation>>> {
    await mockDelay()
    return ok(paginate(mockDesignations, request, ['title']))
  },
}
