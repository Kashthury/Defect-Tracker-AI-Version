import React from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Boxes, FileText, History, LayoutDashboard } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { NavCard } from '@/components/common/NavCard'
import { ProjectWorkspaceOutletContext } from '@/components/projects/ProjectWorkspaceLayout'
import { PRIV } from '@/constants/privileges'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'

export const ProjectManagementHubPage: React.FC = () => {
  const { project } = useOutletContext<ProjectWorkspaceOutletContext>()
  const { hasPrivilege } = useAuth()
  const navigate = useNavigate()

  const go = (route: string) => navigate(route.replace(':projectId', project.id))

  const cards = [
    {
      key: 'overview',
      title: 'Project Overview',
      description: 'Review the active release and overall project health at a glance.',
      icon: LayoutDashboard,
      privilege: PRIV.PROJECT_VIEW,
      onClick: () => go(ROUTES.PROJECT_OVERVIEW),
    },
    {
      key: 'details',
      title: 'Project Details',
      description: 'View project information, client, code, timelines, and configuration.',
      icon: FileText,
      privilege: PRIV.PROJECT_VIEW,
      onClick: () => go(ROUTES.PROJECT_DETAILS),
    },
    {
      key: 'modules',
      title: 'Module Management',
      description: 'Manage modules, submodules, and QA / developer team assignments.',
      icon: Boxes,
      privilege: PRIV.MODULE_VIEW,
      onClick: () => go(ROUTES.PROJECT_MODULES),
    },
    {
      key: 'allocation-history',
      title: 'Allocation History',
      description: 'Track employee allocations and changes to project staffing over time.',
      icon: History,
      privilege: PRIV.PROJECT_ALLOCATION_VIEW,
      onClick: () => go(ROUTES.PROJECT_ALLOCATION_HISTORY),
    },
  ].filter((card) => hasPrivilege(card.privilege))

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Project Management"
        description="Choose an area to manage for this project."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        {cards.map((card) => (
          <NavCard
            key={card.key}
            title={card.title}
            description={card.description}
            icon={card.icon}
            onClick={card.onClick}
          />
        ))}
      </div>
    </div>
  )
}
