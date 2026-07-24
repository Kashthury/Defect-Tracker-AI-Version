import React from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { PlayCircle, Rocket, UserPlus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { NavCard } from '@/components/common/NavCard'
import { ProjectWorkspaceOutletContext } from '@/components/projects/ProjectWorkspaceLayout'
import { PRIV } from '@/constants/privileges'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'

export const ReleaseManagementHubPage: React.FC = () => {
  const { project } = useOutletContext<ProjectWorkspaceOutletContext>()
  const { hasPrivilege } = useAuth()
  const navigate = useNavigate()

  const go = (route: string) => navigate(route.replace(':projectId', project.id))

  const cards = [
    {
      key: 'releases',
      title: 'Release Overview',
      description: 'Browse releases, their versions, statuses, and target dates.',
      icon: Rocket,
      privilege: PRIV.RELEASE_VIEW,
      onClick: () => go(ROUTES.PROJECT_RELEASES),
    },
    {
      key: 'test-case-allocation',
      title: 'Test Case Allocation',
      description: 'Allocate test cases to a release using the configured module assignments.',
      icon: UserPlus,
      privilege: PRIV.TESTCASE_VIEW,
      onClick: () => go(ROUTES.PROJECT_TEST_CASE_ALLOCATION),
    },
    {
      key: 'test-case-execution',
      title: 'Test Case Execution',
      description: 'Execute and review test cases for the active release.',
      icon: PlayCircle,
      privilege: PRIV.TESTCASE_VIEW,
      onClick: () => go(ROUTES.PROJECT_TEST_CASE_EXECUTION),
    },
    
  ].filter((card) => hasPrivilege(card.privilege))

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Releases"
        description="Choose an area of release management for this project."
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
