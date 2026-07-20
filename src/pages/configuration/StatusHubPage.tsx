import React from 'react'
import { useNavigate } from 'react-router-dom'
import { GitBranch, Tags } from 'lucide-react'
import { NavCard } from '@/components/common/NavCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { ROUTES } from '@/constants/routes'
import { PRIV } from '@/constants/privileges'
import { useAuth } from '@/hooks/useAuth'

export const StatusHubPage: React.FC = () => {
  const navigate = useNavigate()
  const { hasPrivilege } = useAuth()
  return <div className="flex flex-col gap-6">
    <PageHeader title="Status" description="Select the status configuration you want to manage." />
    <div className="grid gap-4 sm:grid-cols-2">
      {hasPrivilege(PRIV.STATUS_TYPE_VIEW) && <NavCard title="Status Type" description="Manage status names, colors, and reusable status definitions." icon={Tags} onClick={() => navigate(ROUTES.STATUS_TYPE)} />}
      {hasPrivilege(PRIV.DEFECT_WORKFLOW_VIEW) && <NavCard title="Workflow" description="Configure the allowed status transitions in the defect lifecycle." icon={GitBranch} onClick={() => navigate(ROUTES.DEFECT_WORKFLOW)} />}
    </div>
  </div>
}
