export interface DefectWorkflowNode {
  id: string
  workflowId: string
  statusId: string
  positionX: number
  positionY: number
}

export interface DefectWorkflowTransition {
  id: string
  workflowId: string
  fromStatusId: string
  toStatusId: string
}

export interface DefectWorkflow {
  id: string
  name: string
  nodes: DefectWorkflowNode[]
  transitions: DefectWorkflowTransition[]
  updatedAt: string
}

export interface SaveDefectWorkflowPayload {
  name: string
  nodes: DefectWorkflowNode[]
  transitions: DefectWorkflowTransition[]
}

