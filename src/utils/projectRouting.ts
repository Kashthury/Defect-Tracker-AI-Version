import { ROUTES } from '@/constants/routes'

const LEGACY_PROJECT_ROUTES: Record<string, string> = {
  [ROUTES.RELEASES]: ROUTES.PROJECT_RELEASES,
  [ROUTES.TEST_CASES]: ROUTES.PROJECT_TEST_CASES,
  [ROUTES.DEFECTS]: ROUTES.PROJECT_DEFECTS,
  [ROUTES.REPORTS]: ROUTES.PROJECT_REPORTS,
  [ROUTES.MODULES]: ROUTES.PROJECT_MODULES,
  [ROUTES.ALLOCATION_HISTORY]: ROUTES.PROJECT_ALLOCATION_HISTORY,
}

const withProjectId = (route: string, projectId: string) =>
  route.replace(':projectId', projectId)

export const getProjectRouteForCurrentModule = (pathname: string, projectId: string) => {
  if (/^\/dashboard\/project\/[^/]+$/.test(pathname)) {
    return withProjectId(ROUTES.PROJECT_DASHBOARD, projectId)
  }
  if (
    pathname.endsWith('/releases/test-case-execution') ||
    pathname.endsWith('/releases/test-case-allocation')
  ) {
    return pathname.replace(/^\/projects\/[^/]+/, `/projects/${projectId}`)
  }
  const releaseRoute = pathname.match(/^\/projects\/[^/]+\/releases\/([^/]+)/)
  if (releaseRoute && releaseRoute[1] !== 'create') {
    return withProjectId(ROUTES.PROJECT_RELEASES, projectId)
  }
  if (/^\/projects\/[^/]+(?:\/|$)/.test(pathname)) {
    return pathname.replace(/^\/projects\/[^/]+/, `/projects/${projectId}`)
  }
  const projectRoute = LEGACY_PROJECT_ROUTES[pathname]
  return projectRoute ? withProjectId(projectRoute, projectId) : pathname
}

export const getProjectAwareMenuPath = (pathname: string, projectId?: string) => {
  if (!projectId) return pathname
  if (pathname.includes(':projectId')) return withProjectId(pathname, projectId)
  const projectRoute = LEGACY_PROJECT_ROUTES[pathname]
  return projectRoute ? withProjectId(projectRoute, projectId) : pathname
}
