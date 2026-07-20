import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckSquare, Save, Search as SearchIcon, ShieldCheck, Square } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/common/Card'
import { Dropdown } from '@/components/common/Dropdown'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { Loader } from '@/components/common/Loader'
import { EmptyState } from '@/components/common/EmptyState'
import { PrivilegeTree } from '@/components/permissions/PrivilegeTree'
import { privilegeService } from '@/services/privilegeService'
import { PrivilegeDefinition } from '@/types/privilege'
import { SelectOption } from '@/types/common'
import { useToast } from '@/context/ToastContext'
import { ROUTES } from '@/constants/routes'

export const RolePrivilegeAssignmentPage: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()

  const [roleOptions, setRoleOptions] = useState<SelectOption[]>([])
  const [privileges, setPrivileges] = useState<PrivilegeDefinition[]>([])
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  const [roleId, setRoleId] = useState('')
  const [assignedCodes, setAssignedCodes] = useState<string[]>([])
  const [initialCodes, setInitialCodes] = useState<string[]>([])
  const [isLoadingRole, setIsLoadingRole] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [search, setSearch] = useState('')

  // Load the assignable roles + active privilege catalogue once.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [rolesRes, privRes] = await Promise.all([
        privilegeService.getAssignableRoles(),
        privilegeService.getAssignablePrivileges(),
      ])
      if (cancelled) return
      if (rolesRes.success) setRoleOptions(rolesRes.data.map((r) => ({ label: r.name, value: r.id })))
      if (privRes.success) setPrivileges(privRes.data)
      setIsBootstrapping(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const loadRolePrivileges = useCallback(async (id: string) => {
    setIsLoadingRole(true)
    try {
      const res = await privilegeService.getPrivilegesByRole(id)
      if (res.success) {
        setAssignedCodes(res.data.privilegeCodes)
        setInitialCodes(res.data.privilegeCodes)
      }
    } finally {
      setIsLoadingRole(false)
    }
  }, [])

  const handleRoleChange = (id: string) => {
    setRoleId(id)
    setSearch('')
    if (id) loadRolePrivileges(id)
    else {
      setAssignedCodes([])
      setInitialCodes([])
    }
  }

  const visibleCodes = useMemo(() => {
    const term = search.trim().toLowerCase()
    const list = term
      ? privileges.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.code.toLowerCase().includes(term) ||
            p.action.toLowerCase().includes(term),
        )
      : privileges
    return list.map((p) => p.code)
  }, [privileges, search])

  const handleSelectAll = () => {
    setAssignedCodes((prev) => Array.from(new Set([...prev, ...visibleCodes])))
  }

  const handleClearAll = () => {
    const visibleSet = new Set(visibleCodes)
    setAssignedCodes((prev) => prev.filter((c) => !visibleSet.has(c)))
  }

  const isDirty = useMemo(() => {
    if (assignedCodes.length !== initialCodes.length) return true
    const a = new Set(assignedCodes)
    return initialCodes.some((c) => !a.has(c))
  }, [assignedCodes, initialCodes])

  const handleSave = async () => {
    if (!roleId) return
    setIsSaving(true)
    try {
      const res = await privilegeService.assignRolePrivileges({ roleId, privilegeCodes: assignedCodes })
      if (res.success) {
        setInitialCodes(res.data.privilegeCodes)
        setAssignedCodes(res.data.privilegeCodes)
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (isBootstrapping) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader label="Loading privilege configuration..." />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <button type="button" onClick={() => navigate(ROUTES.PRIVILEGE)} className="flex w-fit items-center gap-2 text-sm font-medium text-ink-500 transition-colors hover:text-brand-600"><ArrowLeft className="h-4 w-4" /> Back to Privilege</button>
      <PageHeader
        title="Role Privilege Assignment"
        description="Assign privileges to a role. Save to update the permissions granted to everyone with that role."
      />

      <Card
        title="Select Role"
        subtitle="Choose the role whose privileges you want to manage."
        actions={
          roleId ? (
            <Badge tone="info">
              {assignedCodes.length} selected
            </Badge>
          ) : undefined
        }
      >
        <div className="max-w-sm">
          <Dropdown
            label="Role"
            name="roleId"
            options={roleOptions}
            value={roleId}
            placeholder="Select a role..."
            onChange={(e) => handleRoleChange(e.target.value)}
          />
        </div>
      </Card>

      {!roleId ? (
        <Card padded>
          <EmptyState
            icon={<ShieldCheck className="h-5 w-5" />}
            title="No role selected"
            description="Select a role above to load its available privileges and start assigning permissions."
          />
        </Card>
      ) : isLoadingRole ? (
        <Card padded>
          <div className="flex h-40 items-center justify-center">
            <Loader label="Loading role privileges..." />
          </div>
        </Card>
      ) : (
        <Card padded={false}>
          <div className="flex flex-col gap-3 border-b border-ink-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="w-full sm:w-80">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search privileges..."
                leftIcon={<SearchIcon className="h-4 w-4" />}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" leftIcon={<CheckSquare className="h-4 w-4" />} onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" leftIcon={<Square className="h-4 w-4" />} onClick={handleClearAll}>
                Clear All
              </Button>
            </div>
          </div>

          <div className="p-5">
            <PrivilegeTree
              privileges={privileges}
              selectedCodes={assignedCodes}
              onChange={setAssignedCodes}
              searchTerm={search}
              accent="brand"
            />
          </div>
        </Card>
      )}

      {roleId && !isLoadingRole && (
        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 rounded-lg border border-ink-200 bg-ink-50 p-4 shadow-sm">
          <span className="text-sm text-ink-500">
            {isDirty ? 'You have unsaved changes.' : 'All changes saved.'}
          </span>
          <Button leftIcon={<Save className="h-4 w-4" />} isLoading={isSaving} disabled={!isDirty} onClick={handleSave}>
            Save Role Permissions
          </Button>
        </div>
      )}
    </div>
  )
}
