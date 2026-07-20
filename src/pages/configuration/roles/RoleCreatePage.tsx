import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/common/Card'
import { Input } from '@/components/common/Input'
import { Dropdown } from '@/components/common/Dropdown'
import { FormRow } from '@/components/forms/FormRow'
import { FormActions } from '@/components/forms/FormActions'
import { useForm } from '@/hooks/useForm'
import { ROLE_TYPE_OPTIONS } from '@/constants/roleTypes'
import { roleService } from '@/services/roleService'
import { CreateRolePayload } from '@/types/role'
import { useToast } from '@/context/ToastContext'
import { ROUTES } from '@/constants/routes'

export const RoleCreatePage: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<CreateRolePayload>({
    initialValues: {
      name: '',
      roleType: '',
      description: '',
    },
    schema: {
      name: { required: true, label: 'Role Name' },
      roleType: { required: true, label: 'Role Type' },
    },
  })

  const handleSubmit = async () => {
    if (!form.validateAll()) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await roleService.createRole(form.values)
      if (result.success) {
        toast.success(result.message)
        navigate(ROUTES.ROLES)
      } else {
        setSubmitError(result.message)
      }
    } catch {
      setSubmitError('An unexpected error occurred while creating the role.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Create Role"
        description="Create an RBAC role. New roles are active by default and can be assigned privileges from Privilege Management."
      />

      <Card title="Role Information" subtitle="Role Type is a controlled classification used across filtering workflows.">
        {submitError && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-signal-critical">
            {submitError}
          </div>
        )}

        <div className="flex flex-col gap-6">
          <FormRow>
            <Input
              label="Role Name"
              name="name"
              required
              value={form.values.name}
              error={form.touched.name ? form.errors.name : undefined}
              onChange={(event) => form.setValue('name', event.target.value)}
            />
            <Dropdown
              label="Role Type"
              name="roleType"
              required
              options={ROLE_TYPE_OPTIONS}
              value={form.values.roleType}
              error={form.touched.roleType ? form.errors.roleType : undefined}
              onChange={(event) => form.setValue('roleType', event.target.value)}
            />
          </FormRow>

          <FormRow columns={1}>
            <Input
              label="Description"
              name="description"
              value={form.values.description}
              error={form.touched.description ? form.errors.description : undefined}
              onChange={(event) => form.setValue('description', event.target.value)}
              hint="Optional short description of the role's system access purpose."
            />
          </FormRow>
        </div>
      </Card>

      <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-end gap-3 rounded-lg border border-ink-200 bg-ink-50 p-4 shadow-sm">
        <FormActions
          onCancel={() => navigate(ROUTES.ROLES)}
          onSubmit={handleSubmit}
          submitLabel="Create Role"
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}
