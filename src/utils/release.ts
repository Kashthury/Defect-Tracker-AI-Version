import { BadgeTone, SelectOption } from '@/types/common'
import { ReleaseRecord, ReleaseStatus, SelectedRelease } from '@/types/release'

export const RELEASE_STATUS_OPTIONS: SelectOption[] = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'On Hold', value: 'ON_HOLD' },
  { label: 'Completed', value: 'COMPLETED' },
]

export const releaseStatusLabel = (status: ReleaseStatus) =>
  RELEASE_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status

export const releaseStatusTone = (status: ReleaseStatus): BadgeTone => {
  if (status === 'ACTIVE') return 'success'
  if (status === 'ON_HOLD') return 'medium'
  return 'neutral'
}

export const toSelectedRelease = (release: ReleaseRecord): SelectedRelease => ({
  releaseId: release.id,
  projectId: release.projectId,
  releaseName: release.name,
  version: release.version,
  status: release.status,
})
