import { ApiResponse } from '@/types/common'
import { AuthenticatedUser, AuthSession, LoginCredentials, Privilege, Role } from '@/types/auth'
import { apiRequest, fail, ok } from './apiClient'

type JsonObject = Record<string, unknown>

const asObject = (value: unknown): JsonObject =>
  typeof value === 'object' && value !== null ? value as JsonObject : {}

const asString = (...values: unknown[]) => {
  const value = values.find((item) => typeof item === 'string' && item.length > 0)
  return typeof value === 'string' ? value : ''
}

const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : []

const mapPrivilege = (value: unknown): Privilege => {
  const item = asObject(value)
  const code = asString(item.code, item.privilegeCode, item.name, value)
  return {
    id: asString(item.id, item.privilegeId, code),
    code,
    module: asString(item.module, item.moduleName),
    action: asString(item.action, item.actionName),
    description: asString(item.description),
  }
}

const mapRole = (value: unknown): Role => {
  const item = asObject(value)
  const privileges = asArray(item.privileges).map(mapPrivilege)
  return {
    id: asString(item.id, item.roleId, item.code, item.name, value),
    name: asString(item.name, item.roleName, item.code, value),
    description: asString(item.description),
    privilegeIds: privileges.map((privilege) => privilege.id),
  }
}

const mapUser = (value: unknown): AuthenticatedUser | null => {
  const user = asObject(value)
  if (Object.keys(user).length === 0) return null
  const rolesSource = asArray(user.roles ?? user.authorities)
  const roles = rolesSource.map(mapRole)
  const directPrivileges = asArray(user.privileges ?? user.permissions).map(mapPrivilege)
  const rolePrivileges = rolesSource.flatMap((role) => asArray(asObject(role).privileges).map(mapPrivilege))
  const privileges = [...directPrivileges, ...rolePrivileges].filter(
    (privilege, index, all) => privilege.code && all.findIndex((item) => item.code === privilege.code) === index,
  )
  const firstName = asString(user.firstName)
  const lastName = asString(user.lastName)
  return {
    id: asString(user.id, user.userId, user.employeeId),
    fullName: asString(user.fullName, user.name, `${firstName} ${lastName}`.trim(), user.email),
    email: asString(user.email, user.username),
    avatarColor: asString(user.avatarColor) || '#2563eb',
    designation: asString(user.designationName, asObject(user.designation).title, asObject(user.designation).name),
    roles,
    privileges,
  }
}

const jwtExpiry = (token: string): number | undefined => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number }
    return payload.exp ? payload.exp * 1000 : undefined
  } catch {
    return undefined
  }
}

const mapSession = (value: unknown): AuthSession | null => {
  const data = asObject(value)
  const token = asString(data.token, data.accessToken, data.access_token, data.jwtToken, data.jwt)
  const user = mapUser(data.user ?? data.employee ?? data.profile)
  if (!token || !user) return null
  const issuedAt = Date.now()
  const expiresIn = Number(data.expiresIn ?? data.expires_in ?? 0)
  return {
    token,
    user,
    issuedAt,
    expiresAt: jwtExpiry(token) ?? (expiresIn > 0 ? issuedAt + expiresIn * 1000 : issuedAt + 8 * 60 * 60 * 1000),
  }
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthSession>> {
    const response = await apiRequest<unknown>('/auth/login', {
      method: 'POST',
      body: { email: credentials.email.trim(), password: credentials.password.trim() },
    })
    if (!response.success) return fail(response.message)
    const session = mapSession(response.data)
    return session
      ? ok(session, response.message || 'Login successful.')
      : fail('The login response did not contain a valid access token and user profile.')
  },

}
