import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { PortfolioDashboard } from '@/components/dashboard/level1/PortfolioDashboard'
import { ProjectQualityDashboard } from '@/components/dashboard/level2/ProjectQualityDashboard'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'
import { useProject } from '@/hooks/useProject'
import { PortfolioProject } from '@/types/dashboard'

export const DashboardPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { setSelectedProject, clearSelectedProject } = useProject()

  const openProject = (project: PortfolioProject) => {
    setSelectedProject({ projectId: project.projectId, projectName: project.projectName, status: project.status })
    navigate(ROUTES.PROJECT_DASHBOARD.replace(':projectId', project.projectId))
  }
  const back = () => {
    clearSelectedProject()
    navigate(ROUTES.DASHBOARD)
  }

  return <div>
    {!projectId && <PageHeader title={`Welcome back, ${user?.fullName.split(' ')[0]}`} description="Organization-wide Project quality and risk overview." />}
    {projectId
      ? <ProjectQualityDashboard projectId={projectId} onBackToPortfolio={back} />
      : <PortfolioDashboard onSelectProject={openProject} />}
  </div>
}
