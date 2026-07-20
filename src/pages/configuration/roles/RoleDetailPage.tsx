import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, Edit, KeyRound, Power, ShieldCheck, Tag, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { Loader } from '@/components/common/Loader'
import { roleService } from '@/services/roleService'
import { RoleDetails, RoleStatus } from '@/types/role'
import { formatRoleType } from '@/constants/roleTypes'
import { formatDateTime } from '@/utils/format'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import { PRIV } from '@/constants/privileges'
import { ROUTES } from '@/constants/routes'

interface DetailItemProps {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}

const DetailItem: React.FC<DetailItemProps> = ({ icon, label, children }) => (
  <div className="flex flex-col gap-1">
    <span className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
      {icon}
      {label}
    </span>
    <span className="text-sm font-medium text-ink-900">{children}</span>
  </div>
)

export const RoleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasPrivilege } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const [role, setRole] = useState<RoleDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadRole = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)

    try {
      const result = await roleService.getRoleById(id)
      if (result.success) {
        setRole(result.data)
      } else {
        setError(result.message)
      }
    } catch {
      setError('An unexpected error occurred while loading the role details.')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadRole()
  }, [loadRole])

  const handleStatusChange = async () => {
    if (!role) return
    const nextStatus: RoleStatus = role.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    setIsUpdatingStatus(true)

    try {
      const result = await roleService.updateRoleStatus(role.id, nextStatus)
      if (result.success) {
        setRole(result.data)
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleDelete = async () => {
    if (!role) return
    const ok = await confirm({
      title: 'Delete Role',
      message: `Are you sure you want to delete ${role.name}? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete',
    })
    if (!ok) return

    setIsDeleting(true)
    try {
      const result = await roleService.deleteRole(role.id)
      if (result.success) {
        toast.success(result.message)
        navigate(ROUTES.ROLES)
      } else {
        toast.error(result.message)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader label="Loading role details..." /></div>
  }

  if (error || !role) {
    return <div className="py-12"><ErrorMessage message={error || 'Role not found.'} /></div>
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <button
          onClick={() => navigate(ROUTES.ROLES)}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Roles
        </button>
        <PageHeader
          title="Role Details"
          description="Read-only view of role settings and currently assigned privileges."
          actions={
            <div className="flex flex-wrap gap-2">
              {hasPrivilege(PRIV.ROLE_UPDATE) && (
                <Button
                  variant="outline"
                  leftIcon={<Edit className="h-4 w-4" />}
                  onClick={() => navigate(ROUTES.ROLE_EDIT.replace(':id', role.id))}
                >
                  Edit
                </Button>
              )}
              {hasPrivilege(PRIV.ROLE_STATUS_CHANGE) && (
                <Button
                  variant={role.status === 'ACTIVE' ? 'secondary' : 'primary'}
                  leftIcon={<Power className="h-4 w-4" />}
                  isLoading={isUpdatingStatus}
                  onClick={handleStatusChange}
                >
                  {role.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </Button>
              )}
              {hasPrivilege(PRIV.ROLE_DELETE) && (
                <Button
                  variant="danger"
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  isLoading={isDeleting}
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              )}
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-0 lg:col-span-1" padded={false}>
          <div className="border-b border-ink-100 bg-ink-50/50 px-6 py-4">
            <h3 className="text-base font-semibold text-ink-900">Role Summary</h3>
          </div>
          <div className="flex flex-col gap-5 p-6">
            <div>
              <h2 className="text-xl font-bold text-ink-900">{role.name}</h2>
              <p className="mt-1 text-sm text-ink-500">{role.description || 'No description provided.'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="info">{formatRoleType(role.roleType)}</Badge>
              <Badge tone={role.status === 'ACTIVE' ? 'success' : 'neutral'} dot>
                {role.status === 'ACTIVE' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-0 lg:col-span-2" padded={false}>
          <div className="border-b border-ink-100 bg-ink-50/50 px-6 py-4">
            <h3 className="text-base font-semibold text-ink-900">Role Information</h3>
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-6 sm:grid-cols-2">
            <DetailItem icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Role Name">
              {role.name}
            </DetailItem>
            <DetailItem icon={<Tag className="h-3.5 w-3.5" />} label="Role Type">
              {formatRoleType(role.roleType)}
            </DetailItem>
            <DetailItem icon={<Power className="h-3.5 w-3.5" />} label="Status">
              {role.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            </DetailItem>
            <DetailItem icon={<KeyRound className="h-3.5 w-3.5" />} label="Assigned Privileges">
              {role.assignedPrivileges.length}
            </DetailItem>
            <DetailItem icon={<Calendar className="h-3.5 w-3.5" />} label="Created Date">
              {formatDateTime(role.createdAt)}
            </DetailItem>
            <DetailItem icon={<Calendar className="h-3.5 w-3.5" />} label="Updated Date">
              {formatDateTime(role.updatedAt)}
            </DetailItem>
          </div>
        </Card>
      </div>

      <Card title="Assigned Privileges" subtitle="Read-only snapshot from mock role data. Privilege management is handled separately.">
        {role.assignedPrivileges.length === 0 ? (
          <EmptyState
            title="No assigned privileges"
            description="This role does not currently reference any privileges in mock data."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {role.assignedPrivileges.map((privilege) => (
              <div key={privilege.id} className="rounded-md border border-ink-100 bg-ink-50/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-mono text-xs font-semibold text-brand-600">{privilege.code}</span>
                  <Badge tone="neutral">{privilege.module}</Badge>
                </div>
                <p className="mt-2 text-sm font-medium text-ink-900">{privilege.action}</p>
                <p className="mt-1 text-xs text-ink-500">{privilege.description}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
