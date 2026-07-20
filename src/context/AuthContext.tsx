import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { AuthenticatedUser, AuthSession, LoginCredentials } from '@/types/auth'
import { authService } from '@/services/authService'
import { SELECTED_PROJECT_STORAGE_KEY, SESSION_STORAGE_KEY } from '@/constants/app'

interface AuthContextValue {
  user: AuthenticatedUser | null
  isAuthenticated: boolean
  isInitializing: boolean
  loginError: string | null
  isLoggingIn: boolean
  sessionExpiredReason: string | null
  login: (credentials: LoginCredentials) => Promise<boolean>
  logout: (reason?: string) => void
  hasPrivilege: (code?: string) => boolean
  clearSessionExpiredReason: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readStoredSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed: AuthSession = JSON.parse(raw)
    if (parsed.expiresAt < Date.now()) return null
    return parsed
  } catch {
    return null
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [sessionExpiredReason, setSessionExpiredReason] = useState<string | null>(null)

  useEffect(() => {
    const stored = readStoredSession()
    if (!stored) {
      setIsInitializing(false)
      return
    }

    // Re-resolve privileges from current roles (mimics GET /auth/me) so newly
    // added privileges are reflected in an existing session without requiring
    // the user to log out and back in. Falls back to the stored snapshot if
    // the refresh fails.
    let cancelled = false
    authService
      .getCurrentUser(stored.user.id)
      .then((response) => {
        if (cancelled) return
        if (response.success) {
          const refreshed: AuthSession = { ...stored, user: response.data }
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(refreshed))
          setSession(refreshed)
        } else {
          setSession(stored)
        }
      })
      .catch(() => {
        if (!cancelled) setSession(stored)
      })
      .finally(() => {
        if (!cancelled) setIsInitializing(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoggingIn(true)
    setLoginError(null)
    try {
      const response = await authService.login(credentials)
      if (!response.success) {
        setLoginError(response.message)
        return false
      }
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(response.data))
      setSession(response.data)
      return true
    } finally {
      setIsLoggingIn(false)
    }
  }, [])

  const logout = useCallback((reason?: string) => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
    sessionStorage.removeItem(SELECTED_PROJECT_STORAGE_KEY)
    setSession(null)
    if (reason) setSessionExpiredReason(reason)
    authService.logout()
  }, [])

  const clearSessionExpiredReason = useCallback(() => setSessionExpiredReason(null), [])

  const hasPrivilege = useCallback(
    (code?: string) => {
      if (!code) return true
      if (!session) return false
      return session.user.privileges.some((p) => p.code === code)
    },
    [session],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: !!session,
      isInitializing,
      loginError,
      isLoggingIn,
      sessionExpiredReason,
      login,
      logout,
      hasPrivilege,
      clearSessionExpiredReason,
    }),
    [session, isInitializing, loginError, isLoggingIn, sessionExpiredReason, login, logout, hasPrivilege, clearSessionExpiredReason],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
