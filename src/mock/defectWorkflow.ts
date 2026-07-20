import { DefectWorkflow } from '@/types/defectWorkflow'

const WORKFLOW_ID = 'defect-workflow-1'

export const mockDefectWorkflowStore: { current: DefectWorkflow | null } = {
  current: {
    id: WORKFLOW_ID,
    name: 'Defect Workflow',
    nodes: [
      { id: 'node-new', workflowId: WORKFLOW_ID, statusId: 'st-1', positionX: 70, positionY: 130 },
      { id: 'node-open', workflowId: WORKFLOW_ID, statusId: 'st-8', positionX: 280, positionY: 130 },
      { id: 'node-in-progress', workflowId: WORKFLOW_ID, statusId: 'st-3', positionX: 490, positionY: 130 },
      { id: 'node-fixed', workflowId: WORKFLOW_ID, statusId: 'st-4', positionX: 700, positionY: 130 },
      { id: 'node-closed', workflowId: WORKFLOW_ID, statusId: 'st-6', positionX: 910, positionY: 130 },
      { id: 'node-on-hold', workflowId: WORKFLOW_ID, statusId: 'st-9', positionX: 490, positionY: 330 },
      { id: 'node-reopened', workflowId: WORKFLOW_ID, statusId: 'st-7', positionX: 700, positionY: 330 },
      { id: 'node-rejected', workflowId: WORKFLOW_ID, statusId: 'st-10', positionX: 490, positionY: 500 },
    ],
    transitions: [
      { id: 'transition-new-open', workflowId: WORKFLOW_ID, fromStatusId: 'st-1', toStatusId: 'st-8' },
      { id: 'transition-open-progress', workflowId: WORKFLOW_ID, fromStatusId: 'st-8', toStatusId: 'st-3' },
      { id: 'transition-progress-fixed', workflowId: WORKFLOW_ID, fromStatusId: 'st-3', toStatusId: 'st-4' },
      { id: 'transition-fixed-closed', workflowId: WORKFLOW_ID, fromStatusId: 'st-4', toStatusId: 'st-6' },
      { id: 'transition-progress-hold', workflowId: WORKFLOW_ID, fromStatusId: 'st-3', toStatusId: 'st-9' },
      { id: 'transition-hold-progress', workflowId: WORKFLOW_ID, fromStatusId: 'st-9', toStatusId: 'st-3' },
      { id: 'transition-fixed-reopened', workflowId: WORKFLOW_ID, fromStatusId: 'st-4', toStatusId: 'st-7' },
      { id: 'transition-progress-rejected', workflowId: WORKFLOW_ID, fromStatusId: 'st-3', toStatusId: 'st-10' },
    ],
    updatedAt: '2026-07-16T08:00:00Z',
  },
}

