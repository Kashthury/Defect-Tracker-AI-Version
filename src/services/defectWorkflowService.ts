import { mockStatusTypes } from '@/mock/configuration'
import { mockDefectWorkflowStore } from '@/mock/defectWorkflow'
import { ApiResponse } from '@/types/common'
import { DefectWorkflow, SaveDefectWorkflowPayload } from '@/types/defectWorkflow'
import { fail, mockDelay, ok } from './apiClient'

const cloneWorkflow = (workflow: DefectWorkflow): DefectWorkflow => ({
  ...workflow,
  nodes: workflow.nodes.map((node) => ({ ...node })),
  transitions: workflow.transitions.map((transition) => ({ ...transition })),
})

const validateWorkflow = (payload: SaveDefectWorkflowPayload): string | null => {
  if (payload.nodes.length === 0) return 'Add at least one status node before saving the workflow.'

  const configuredStatusIds = new Set(mockStatusTypes.map((status) => status.id))
  const nodeStatusIds = new Set<string>()
  for (const node of payload.nodes) {
    if (!configuredStatusIds.has(node.statusId)) {
      return 'One or more workflow nodes reference an invalid Status Type.'
    }
    if (nodeStatusIds.has(node.statusId)) {
      return 'Each Status Type can appear only once in the defect workflow.'
    }
    nodeStatusIds.add(node.statusId)
  }

  const transitionKeys = new Set<string>()
  for (const transition of payload.transitions) {
    if (!nodeStatusIds.has(transition.fromStatusId) || !nodeStatusIds.has(transition.toStatusId)) {
      return 'Every connection must have a valid source and target status.'
    }
    if (transition.fromStatusId === transition.toStatusId) {
      return 'A status cannot connect to itself.'
    }

    const key = `${transition.fromStatusId}->${transition.toStatusId}`
    if (transitionKeys.has(key)) return 'Duplicate status transitions are not allowed.'
    transitionKeys.add(key)
  }

  return null
}

const persistWorkflow = (
  id: string,
  payload: SaveDefectWorkflowPayload,
): ApiResponse<DefectWorkflow> => {
  const validationError = validateWorkflow(payload)
  if (validationError) return fail(validationError)

  const workflow: DefectWorkflow = {
    id,
    name: payload.name.trim() || 'Defect Workflow',
    nodes: payload.nodes.map((node) => ({ ...node, workflowId: id })),
    transitions: payload.transitions.map((transition) => ({ ...transition, workflowId: id })),
    updatedAt: new Date().toISOString(),
  }
  mockDefectWorkflowStore.current = workflow
  return ok(cloneWorkflow(workflow), 'Defect workflow saved successfully.')
}

/** Mock API for the single configurable Defect Management workflow. */
export const defectWorkflowService = {
  async getWorkflow(): Promise<ApiResponse<DefectWorkflow>> {
    await mockDelay()
    if (!mockDefectWorkflowStore.current) return fail('Defect workflow is not configured.')
    return ok(cloneWorkflow(mockDefectWorkflowStore.current))
  },

  async saveWorkflow(payload: SaveDefectWorkflowPayload): Promise<ApiResponse<DefectWorkflow>> {
    await mockDelay(500)
    if (mockDefectWorkflowStore.current) return fail('The defect workflow already exists.')
    return persistWorkflow('defect-workflow-1', payload)
  },

  async updateWorkflow(
    id: string,
    payload: SaveDefectWorkflowPayload,
  ): Promise<ApiResponse<DefectWorkflow>> {
    await mockDelay(500)
    if (!mockDefectWorkflowStore.current || mockDefectWorkflowStore.current.id !== id) {
      return fail('Defect workflow not found.')
    }
    return persistWorkflow(id, payload)
  },

  async deleteWorkflow(id: string): Promise<ApiResponse<null>> {
    await mockDelay(400)
    if (!mockDefectWorkflowStore.current || mockDefectWorkflowStore.current.id !== id) {
      return fail('Defect workflow not found.')
    }
    mockDefectWorkflowStore.current = null
    return ok(null, 'Defect workflow deleted successfully.')
  },
}

