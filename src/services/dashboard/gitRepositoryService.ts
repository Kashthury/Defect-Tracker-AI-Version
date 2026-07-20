import { KLOC_STORE } from '@/mock/dashboardData'
import { ApiResponse } from '@/types/common'
import { CalculateKlocFromRepoPayload, CalculateKlocResult } from '@/types/dashboard'
import { fail, mockDelay, ok } from '../apiClient'

const URL_PATTERN = /^https?:\/\/.+/i

/**
 * Mock stand-in for a backend Git integration. The real implementation will
 * clone/analyze the repository server-side, compute lines of code, convert to
 * KLOC, persist it for the project, and return refreshed dashboard metrics.
 * The credentials passed here are used only for this single simulated
 * request and are never written to component state, storage, or the mock
 * data layer once the call resolves.
 */
export const gitRepositoryService = {
  /** POST /api/dashboard/projects/{projectId}/calculate-kloc */
  async calculateKlocFromRepository(payload: CalculateKlocFromRepoPayload): Promise<ApiResponse<CalculateKlocResult>> {
    await mockDelay(900)

    if (!payload.repositoryUrl.trim() || !URL_PATTERN.test(payload.repositoryUrl.trim())) {
      return fail('Enter a valid repository URL, e.g. https://github.com/org/repo.git')
    }
    if (!payload.branch.trim()) {
      return fail('Branch is required.')
    }

    // Deterministic pseudo-scan result based on the URL, so repeated calls
    // for the same repository return a stable figure.
    let hash = 0
    for (const char of payload.repositoryUrl) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
    const linesOfCode = 80000 + (hash % 600000)
    const kloc = Number((linesOfCode / 1000).toFixed(1))

    KLOC_STORE.set(payload.projectId, kloc)

    return ok({ projectId: payload.projectId, kloc, linesOfCode }, 'Repository scan complete.')
  },
}
