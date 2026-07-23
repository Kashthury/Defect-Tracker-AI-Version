import { BadgeTone } from '@/types/common'
import { AllocationDisplayStatus } from '@/types/project'

export const getAllocationStatusTone = (status: AllocationDisplayStatus): BadgeTone => {
  if (status === 'SCHEDULED') return 'info'
  if (status === 'ACTIVE') return 'success'
  return 'neutral'
}

export const isMutableAllocation = (managerAllocation: boolean, status: AllocationDisplayStatus) =>
  !managerAllocation && status !== 'COMPLETED' && status !== 'CANCELLED'
