export const RELEASE_STATUSES = ['ACTIVE', 'ON_HOLD', 'COMPLETED'] as const

export type ReleaseStatus = (typeof RELEASE_STATUSES)[number]

export interface ReleaseRecord {
  id: string
  projectId: string
  name: string
  version: string
  releaseTypeId: string
  releaseTypeName: string
  description: string
  releaseDate: string
  status: ReleaseStatus
  createdAt: string
  updatedAt: string
}

export interface ReleaseFormPayload {
  name: string
  version: string
  releaseTypeId: string
  description: string
  releaseDate: string
  status: ReleaseStatus
}

export type CreateReleasePayload = ReleaseFormPayload
export type UpdateReleasePayload = ReleaseFormPayload

export interface SelectedRelease {
  releaseId: string
  projectId: string
  releaseName: string
  version: string
  status: ReleaseStatus
}

export interface ReleaseOverview {
  totalReleases: number
  activeCount: number
  onHoldCount: number
  completedCount: number
  activeRelease: ReleaseRecord | null
  nextRelease: ReleaseRecord | null
}
