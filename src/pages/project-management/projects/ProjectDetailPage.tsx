import React from 'react'
import { Edit } from 'lucide-react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProjectWorkspaceOutletContext } from '@/components/projects/ProjectWorkspaceLayout'
import { PRIV } from '@/constants/privileges'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/utils/format'

const DetailField: React.FC<{ label: string; value: React.ReactNode; wide?: boolean }> = ({ label, value, wide }) => (
  <div className={wide ? 'sm:col-span-2' : undefined}>
    <p className="text-xs text-ink-400">{label}</p>
    <div className="mt-1 break-words text-sm font-medium text-ink-800">{value || 'Not provided'}</div>
  </div>
)

export const ProjectDetailPage: React.FC = () => {
  const { project } = useOutletContext<ProjectWorkspaceOutletContext>()
  const { hasPrivilege } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Project Details"
        description="Complete project master data, ownership, client information, and project dates."
        actions={hasPrivilege(PRIV.PROJECT_UPDATE) ? (
          <Button variant="outline" leftIcon={<Edit className="h-4 w-4" />} onClick={() => navigate(ROUTES.PROJECT_EDIT.replace(':projectId', project.id))}>Edit Project</Button>
        ) : undefined}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Project Information" className="border-ink-200 border-l-4 border-l-brand-500 ring-1 ring-ink-100/70 hover:border-brand-300">
          <div className="grid gap-5 sm:grid-cols-2">
            <DetailField label="Project Name" value={project.name} />
            <DetailField label="Project Code" value={<span className="font-mono">{project.code}</span>} />
            <DetailField label="Description" value={project.description} wide />
            <DetailField label="Status" value={<Badge tone={project.status === 'ACTIVE' ? 'success' : project.status === 'ON_HOLD' ? 'medium' : 'neutral'}>{project.status === 'ACTIVE' ? 'Active' : project.status === 'ON_HOLD' ? 'On Hold' : 'Completed'}</Badge>} />
            <DetailField label="Current Release" value={project.currentRelease || 'Not scheduled'} />
            <DetailField label="Start Date" value={formatDate(project.startDate)} />
            <DetailField label="End Date" value={formatDate(project.endDate)} />
          </div>
        </Card>

        <Card title="Project Manager" className="border-ink-200 border-l-4 border-l-emerald-500 ring-1 ring-ink-100/70 hover:border-emerald-300">
          <div className="grid gap-5 sm:grid-cols-2">
            <DetailField label="Project Manager" value={project.managerName} />
            <DetailField label="Designation" value={project.managerDesignationName} />
            <DetailField label="Project Role" value={project.managerRoleName} />
            <DetailField label="Allocation Percentage" value={`${project.managerAllocationPercentage}%`} />
            <DetailField label="Allocation Start Date" value={formatDate(project.managerAllocationStartDate)} />
            <DetailField label="Allocation End Date" value={formatDate(project.managerAllocationEndDate)} />
          </div>
        </Card>

        <Card title="Client Information" className="border-ink-200 border-l-4 border-l-sky-500 ring-1 ring-ink-100/70 hover:border-sky-300">
          <div className="grid gap-5 sm:grid-cols-2">
            <DetailField label="Client Name" value={project.clientName} />
            <DetailField label="Client Email" value={project.clientEmail} />
            <DetailField label="Client Phone" value={project.clientPhone} />
            <DetailField label="Country" value={project.clientCountry} />
          </div>
        </Card>

        <Card title="Record Information" className="border-ink-200 border-l-4 border-l-amber-500 ring-1 ring-ink-100/70 hover:border-amber-300">
          <div className="grid gap-5 sm:grid-cols-2">
            <DetailField label="Team Count" value={project.teamCount} />
            <DetailField label="Module Count" value={project.moduleCount} />
            <DetailField label="Open Defects" value={project.openDefects} />
            <DetailField label="Created Date" value={formatDate(project.createdAt)} />
            <DetailField label="Updated Date" value={formatDate(project.updatedAt)} />
          </div>
        </Card>
      </div>
    </div>
  )
}
