import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Table, TableColumn } from '@/components/common/Table'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'

interface EmailPoint {
  id: string
  event: string
  description: string
  recipients: string
  enabled: boolean
}

const INITIAL_POINTS: EmailPoint[] = [
  { id: 'ep-1', event: 'Defect Assigned', description: 'Sent when a defect is assigned to a developer.', recipients: 'Assignee', enabled: true },
  { id: 'ep-2', event: 'Defect Reopened', description: 'Sent when QA reopens a previously closed defect.', recipients: 'Assignee, Reporter', enabled: true },
  { id: 'ep-3', event: 'Release Scheduled', description: 'Sent when a new release date is confirmed.', recipients: 'Project Team', enabled: true },
  { id: 'ep-4', event: 'Critical Defect Logged', description: 'Sent immediately when a Critical severity defect is logged.', recipients: 'Project Manager, Assignee', enabled: true },
  { id: 'ep-5', event: 'Test Case Failed', description: 'Sent when a test case execution result is marked Failed.', recipients: 'Module Owner', enabled: false },
]

export const EmailPointSetupPage: React.FC = () => {
  const [points, setPoints] = useState(INITIAL_POINTS)

  const toggle = (id: string) => {
    setPoints((prev) => prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)))
  }

  const columns: TableColumn<EmailPoint>[] = [
    { key: 'event', header: 'Trigger Event', render: (r) => <span className="font-medium text-ink-800">{r.event}</span> },
    { key: 'description', header: 'Description', render: (r) => <span className="text-ink-500">{r.description}</span> },
    { key: 'recipients', header: 'Recipients', render: (r) => r.recipients },
    {
      key: 'enabled',
      header: 'Status',
      align: 'right',
      render: (r) => (
        <button onClick={() => toggle(r.id)}>
          <Badge tone={r.enabled ? 'success' : 'neutral'}>{r.enabled ? 'Enabled' : 'Disabled'}</Badge>
        </button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Email Point Setup"
        description="Configure which system events trigger an email notification, and to whom."
        actions={<Button leftIcon={<Plus className="h-4 w-4" />}>New Notification Point</Button>}
      />
      <Table columns={columns} rows={points} rowKey={(r) => r.id} emptyTitle="No notification points configured" />
    </div>
  )
}
