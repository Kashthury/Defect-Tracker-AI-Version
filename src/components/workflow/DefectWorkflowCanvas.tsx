import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, GitBranch, Minus, Plus, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { cn } from '@/utils/cn'
import { DefectWorkflowNode, DefectWorkflowTransition } from '@/types/defectWorkflow'
import { StatusTypeRecord } from '@/types/statusType'

const CANVAS_WIDTH = 1160
const CANVAS_HEIGHT = 660
const NODE_WIDTH = 180
const NODE_HEIGHT = 76
const MIN_ZOOM = 0.65
const MAX_ZOOM = 1.35
const ZOOM_STEP = 0.1

interface DefectWorkflowCanvasProps {
  nodes: DefectWorkflowNode[]
  transitions: DefectWorkflowTransition[]
  statusTypes: StatusTypeRecord[]
  editable?: boolean
  onNodesChange?: (nodes: DefectWorkflowNode[]) => void
  onAddTransition?: (fromStatusId: string, toStatusId: string) => boolean
  onRemoveTransition?: (transitionId: string) => void
  onRemoveNode?: (statusId: string) => void
}

interface DragState {
  statusId: string
  offsetX: number
  offsetY: number
  startX: number
  startY: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export const DefectWorkflowCanvas: React.FC<DefectWorkflowCanvasProps> = ({
  nodes,
  transitions,
  statusTypes,
  editable = false,
  onNodesChange,
  onAddTransition,
  onRemoveTransition,
  onRemoveNode,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const didDragRef = useRef(false)
  const [zoom, setZoom] = useState(0.9)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)

  const statusById = useMemo(
    () => new Map(statusTypes.map((status) => [status.id, status])),
    [statusTypes],
  )
  const nodeByStatusId = useMemo(
    () => new Map(nodes.map((node) => [node.statusId, node])),
    [nodes],
  )

  useEffect(() => {
    if (!drag || !editable || !onNodesChange) return

    const handlePointerMove = (event: PointerEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const nextX = (event.clientX - rect.left) / zoom - drag.offsetX
      const nextY = (event.clientY - rect.top) / zoom - drag.offsetY
      if (Math.abs(event.clientX - drag.startX) > 3 || Math.abs(event.clientY - drag.startY) > 3) {
        didDragRef.current = true
      }
      onNodesChange(
        nodes.map((node) =>
          node.statusId === drag.statusId
            ? {
                ...node,
                positionX: Math.round(clamp(nextX, 16, CANVAS_WIDTH - NODE_WIDTH - 16)),
                positionY: Math.round(clamp(nextY, 16, CANVAS_HEIGHT - NODE_HEIGHT - 16)),
              }
            : node,
        ),
      )
    }

    const handlePointerUp = () => setDrag(null)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp, { once: true })
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [drag, editable, nodes, onNodesChange, zoom])

  const beginDrag = (event: React.PointerEvent, node: DefectWorkflowNode) => {
    if (!editable || !canvasRef.current || (event.target as HTMLElement).closest('button')) return
    const rect = canvasRef.current.getBoundingClientRect()
    didDragRef.current = false
    setDrag({
      statusId: node.statusId,
      offsetX: (event.clientX - rect.left) / zoom - node.positionX,
      offsetY: (event.clientY - rect.top) / zoom - node.positionY,
      startX: event.clientX,
      startY: event.clientY,
    })
  }

  const selectConnectionTarget = (statusId: string) => {
    if (!editable || !connectingFrom || didDragRef.current) return
    const added = onAddTransition?.(connectingFrom, statusId) ?? false
    if (added || connectingFrom === statusId) setConnectingFrom(null)
  }

  const connectionPath = (transition: DefectWorkflowTransition) => {
    const source = nodeByStatusId.get(transition.fromStatusId)
    const target = nodeByStatusId.get(transition.toStatusId)
    if (!source || !target) return null

    const movesRight = target.positionX >= source.positionX
    const sourceX = source.positionX + (movesRight ? NODE_WIDTH : 0)
    const sourceY = source.positionY + NODE_HEIGHT / 2
    const targetX = target.positionX + (movesRight ? 0 : NODE_WIDTH)
    const targetY = target.positionY + NODE_HEIGHT / 2
    const direction = movesRight ? 1 : -1
    const curve = Math.max(70, Math.abs(targetX - sourceX) * 0.45)
    return `M ${sourceX} ${sourceY} C ${sourceX + direction * curve} ${sourceY}, ${targetX - direction * curve} ${targetY}, ${targetX} ${targetY}`
  }

  return (
    <div className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-panel">
      <div className="flex h-11 items-center justify-between border-b border-ink-100 bg-ink-50 px-3">
        <div className="flex min-w-0 items-center gap-3 text-xs text-ink-500">
          <span className="font-medium text-ink-700">{nodes.length} statuses</span>
          <span>{transitions.length} transitions</span>
          {connectingFrom && (
            <span className="truncate rounded bg-blue-50 px-2 py-1 font-medium text-brand-600">
              Connecting from {statusById.get(connectingFrom)?.code ?? 'status'}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom((value) => clamp(value - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM))}
            disabled={zoom <= MIN_ZOOM}
            className="flex h-7 w-7 items-center justify-center rounded text-ink-500 hover:bg-ink-100 hover:text-ink-800 disabled:opacity-35"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-11 text-center text-xs font-medium text-ink-600">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((value) => clamp(value + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM))}
            disabled={zoom >= MAX_ZOOM}
            className="flex h-7 w-7 items-center justify-center rounded text-ink-500 hover:bg-ink-100 hover:text-ink-800 disabled:opacity-35"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="h-[590px] overflow-auto bg-ink-50/60">
        <div
          className="relative"
          style={{ width: CANVAS_WIDTH * zoom, height: CANVAS_HEIGHT * zoom }}
        >
          <div
            ref={canvasRef}
            className="absolute left-0 top-0 origin-top-left bg-[radial-gradient(circle_at_center,#DCE1EA_1px,transparent_1px)] bg-[length:20px_20px]"
            style={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              transform: `scale(${zoom})`,
            }}
            onClick={() => connectingFrom && setConnectingFrom(null)}
          >
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <EmptyState
                  icon={<GitBranch className="h-5 w-5" />}
                  title="No workflow nodes"
                  description="Add a configured Status Type to begin the defect workflow."
                />
              </div>
            )}

            <svg
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
              aria-hidden="true"
            >
              <defs>
                <marker
                  id="defect-workflow-arrow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="4"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M 0 0 L 8 4 L 0 8 z" fill="#586582" />
                </marker>
              </defs>
              {transitions.map((transition) => {
                const path = connectionPath(transition)
                if (!path) return null
                return (
                  <g key={transition.id} className={editable ? 'pointer-events-auto cursor-pointer' : ''}>
                    {editable && (
                      <path
                        d={path}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="14"
                        onClick={(event) => {
                          event.stopPropagation()
                          onRemoveTransition?.(transition.id)
                        }}
                      >
                        <title>Remove transition</title>
                      </path>
                    )}
                    <path
                      className="pointer-events-none"
                      d={path}
                      fill="none"
                      stroke="#8B96AC"
                      strokeWidth="2"
                      markerEnd="url(#defect-workflow-arrow)"
                    />
                  </g>
                )
              })}
            </svg>

            {nodes.map((node) => {
              const status = statusById.get(node.statusId)
              const isConnected = transitions.some(
                (transition) =>
                  transition.fromStatusId === node.statusId || transition.toStatusId === node.statusId,
              )
              const isConnectionSource = connectingFrom === node.statusId
              return (
                <div
                  key={node.id}
                  onPointerDown={(event) => beginDrag(event, node)}
                  onClick={(event) => {
                    event.stopPropagation()
                    selectConnectionTarget(node.statusId)
                  }}
                  className={cn(
                    'absolute flex select-none flex-col justify-center rounded-md border bg-white px-4 shadow-panel',
                    editable && 'cursor-grab active:cursor-grabbing',
                    isConnectionSource
                      ? 'border-brand-400 ring-2 ring-brand-400/25'
                      : 'border-ink-200',
                  )}
                  style={{
                    left: node.positionX,
                    top: node.positionY,
                    width: NODE_WIDTH,
                    height: NODE_HEIGHT,
                    borderLeftWidth: 4,
                    borderLeftColor: status?.color ?? '#8B96AC',
                  }}
                >
                  <div className="min-w-0 pr-8">
                    <p className="truncate text-sm font-semibold text-ink-900" title={status?.name}>
                      {status?.name ?? 'Unknown Status'}
                    </p>
                    <p className="mt-1 truncate font-mono text-[10px] font-medium text-ink-500" title={status?.code}>
                      {status?.code ?? node.statusId}
                    </p>
                  </div>

                  {editable && (
                    <>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          setConnectingFrom((current) =>
                            current === node.statusId ? null : node.statusId,
                          )
                        }}
                        className={cn(
                          'absolute -right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border bg-white shadow-panel',
                          isConnectionSource
                            ? 'border-brand-500 text-brand-600'
                            : 'border-ink-200 text-ink-500 hover:border-brand-400 hover:text-brand-600',
                        )}
                        title="Start connection"
                        aria-label={`Connect from ${status?.name ?? 'status'}`}
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isConnected}
                        onClick={(event) => {
                          event.stopPropagation()
                          onRemoveNode?.(node.statusId)
                        }}
                        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded text-ink-400 hover:bg-red-50 hover:text-signal-critical disabled:cursor-not-allowed disabled:opacity-30"
                        title={isConnected ? 'Remove connections before deleting this node' : 'Delete node'}
                        aria-label={`Delete ${status?.name ?? 'status'} node`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
