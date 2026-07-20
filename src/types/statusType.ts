import { StatusTypeCode } from '@/constants/statusTypes'

export interface StatusTypeRecord {
  id: string
  code: StatusTypeCode
  name: string
  color: string
  createdAt: string
}

export interface CreateStatusTypePayload {
  code: string
  name: string
  color: string
}

export interface UpdateStatusTypePayload {
  name: string
  color: string
}

