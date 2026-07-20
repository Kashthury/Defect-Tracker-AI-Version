import React from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, ListChecks, UserCog } from 'lucide-react'
import { NavCard } from '@/components/common/NavCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { ROUTES } from '@/constants/routes'
import { PRIV } from '@/constants/privileges'
import { useAuth } from '@/hooks/useAuth'

export const PrivilegeHubPage: React.FC = () => {
  const navigate = useNavigate()
  const { hasPrivilege } = useAuth()
  const cards = [
    { title: 'Privilege List', description: 'View and manage available system privileges.', icon: KeyRound, route: ROUTES.PRIVILEGE_LIST, privilege: PRIV.PRIVILEGE_VIEW },
    { title: 'Role Privilege Assignment', description: 'Assign privileges to roles.', icon: ListChecks, route: ROUTES.ROLE_PRIVILEGE_ASSIGNMENT, privilege: PRIV.PRIVILEGE_ASSIGN },
    { title: 'User Permission Override', description: 'Manage permission exceptions for individual users.', icon: UserCog, route: ROUTES.USER_PERMISSION_OVERRIDE, privilege: PRIV.USER_PERMISSION_MANAGE },
  ]
  return <div className="flex flex-col gap-6">
    <PageHeader title="Privilege" description="Select the privilege configuration you want to manage." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.filter(card => hasPrivilege(card.privilege)).map(card => <NavCard key={card.title} {...card} onClick={() => navigate(card.route)} />)}
    </div>
  </div>
}
