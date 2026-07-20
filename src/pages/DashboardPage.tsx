import React from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { PortfolioDashboard } from '@/components/dashboard/level1/PortfolioDashboard'
import { ProjectQualityDashboard } from '@/components/dashboard/level2/ProjectQualityDashboard'
import { useAuth } from '@/hooks/useAuth'
import { useProject } from '@/hooks/useProject'
import { PortfolioProjectCard } from '@/types/dashboard'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const { selectedProject, setSelectedProject, clearSelectedProject } = useProject()

  const handleSelectProject = (project: PortfolioProjectCard) => {
    setSelectedProject({
      projectId: project.projectId,
      projectName: project.projectName,
      status: project.status,
    })
  }

  return (
    <div>
      <PageHeader
        title={selectedProject ? selectedProject.projectName : `Welcome back, ${user?.fullName.split(' ')[0]}`}
        description={
          selectedProject
            ? 'Detailed quality analytics for the selected project and release.'
            : 'Organization-wide project risk overview across your portfolio.'
        }
      />

      {selectedProject ? (
        <ProjectQualityDashboard projectId={selectedProject.projectId} onBackToPortfolio={clearSelectedProject} />
      ) : (
        <PortfolioDashboard onSelectProject={handleSelectProject} />
      )}
    </div>
  )
}
