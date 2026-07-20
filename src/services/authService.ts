import { ApiResponse } from '@/types/common'
import { AuthenticatedUser, AuthSession, LoginCredentials, Privilege } from '@/types/auth'
import { mockEmployeeRecords } from '@/mock/employees'
import { mockRoles } from '@/mock/roles'
import { mockPrivileges } from '@/mock/privileges'
import { mockDesignations } from '@/mock/designations'
import { mockDelay, ok, fail } from './apiClient'

function resolvePrivilegesForRoleIds(roleIds: string[]): Privilege[] {
  const roles = mockRoles.filter((r) => roleIds.includes(r.id))
  const privilegeIdSet = new Set(roles.flatMap((r) => r.privilegeIds))
  return mockPrivileges.filter((p) => privilegeIdSet.has(p.id))
}

function buildAuthenticatedUser(employeeId: string): AuthenticatedUser | null {
  const employee = mockEmployeeRecords.find((e) => e.id === employeeId)
  if (!employee) return null

    const roles = mockRoles.filter((r) => r.id === 'role-super-user' || r.id === 'role-system-admin') // simplified mock mapping since the new Employee doesn't track roles
    const designation = mockDesignations.find((d) => d.id === employee.designationId)
  
    return {
      id: employee.id,
      fullName: `${employee.firstName} ${employee.lastName}`,
      email: employee.email,
      avatarColor: employee.avatarColor,
      designation: designation?.title ?? 'Unknown',
      roles,
      privileges: resolvePrivilegesForRoleIds(roles.map(r => r.id)),
    }
  }
  
  export const authService = {
    /**
     * Mimics POST /api/auth/login.
     * Loads: User -> Role(s) -> Privileges, exactly as a real backend
     * would resolve them via joins, then issues a mock bearer token.
     */
    async login(credentials: LoginCredentials): Promise<ApiResponse<AuthSession>> {
      await mockDelay(500)
  
      const email = credentials.email.trim().toLowerCase()
      const employee = mockEmployeeRecords.find((e) => e.email.toLowerCase() === email)
  
      if (!employee) {
        return fail('No account found for this email address.')
      }
      if (employee.status !== 'ACTIVE') {
        return fail('This account has been deactivated. Contact your administrator.')
      }
    if (credentials.password !== 'Passw0rd!') {
      return fail('Incorrect email or password.')
    }

    const user = buildAuthenticatedUser(employee.id)
    if (!user) return fail('Unable to resolve user profile.')

    const now = Date.now()
    const session: AuthSession = {
      token: `mock-jwt.${btoa(employee.id)}.${now}`,
      issuedAt: now,
      expiresAt: now + 8 * 60 * 60 * 1000,
      user,
    }

    return ok(session, 'Login successful.')
  },

  async logout(): Promise<ApiResponse<null>> {
    await mockDelay(150)
    return ok(null, 'Logged out.')
  },

  /** Mimics GET /api/auth/me — used to rehydrate a session from a stored token. */
  async getCurrentUser(userId: string): Promise<ApiResponse<AuthenticatedUser>> {
    await mockDelay(150)
    const user = buildAuthenticatedUser(userId)
    if (!user) return fail('Session is no longer valid.')
    return ok(user)
  },
}
