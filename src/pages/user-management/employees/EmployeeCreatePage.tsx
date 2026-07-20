import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/common/Card'
import { Input } from '@/components/common/Input'
import { Dropdown } from '@/components/common/Dropdown'
import { FormRow } from '@/components/forms/FormRow'
import { FormActions } from '@/components/forms/FormActions'
import { useForm } from '@/hooks/useForm'
import { required, email as emailValidator, phone as phoneValidator, composeValidators } from '@/utils/validation'
import { employeeService } from '@/services/employeeService'
import { mockDesignations } from '@/mock/designations'
import { CreateEmployeePayload } from '@/types/employee'
import { useToast } from '@/context/ToastContext'
import { ROUTES } from '@/constants/routes'

export const EmployeeCreatePage: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  const form = useForm<CreateEmployeePayload>({
    initialValues: {
      firstName: '',
      lastName: '',
      gender: '',
      designationId: '',
      email: '',
      phone: '',
      joinDate: new Date().toISOString().split('T')[0],
      profileImage: '',
    },
    schema: {
      firstName: { required: true, label: 'First Name' },
      lastName: { required: true, label: 'Last Name' },
      gender: { required: true, label: 'Gender' },
      designationId: { required: true, label: 'Designation' },
      email: { required: true, label: 'Email Address', validate: composeValidators(required('Email'), emailValidator('Email')) },
      phone: { required: true, label: 'Phone Number', validate: composeValidators(required('Phone'), phoneValidator('Phone')) },
      joinDate: { required: true, label: 'Join Date' },
    },
  })

  const handleSubmit = async () => {
    if (!form.validateAll()) return
    setIsSubmitting(true)
    setGlobalError(null)

    try {
      const result = await employeeService.createEmployee(form.values as CreateEmployeePayload)
      if (result.success) {
        toast.success(result.message)
        navigate(ROUTES.EMPLOYEES)
      } else {
        setGlobalError(result.message)
      }
    } catch (e) {
      setGlobalError('An unexpected error occurred while creating the employee.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Add New Employee"
        description="Create a new system user profile. The employee will be active immediately upon creation."
      />

      <Card className="p-6">
        {globalError && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-signal-critical">
            {globalError}
          </div>
        )}

        <div className="flex flex-col gap-6">
          <FormRow>
            <Input
              label="First Name"
              name="firstName"
              required
              value={form.values.firstName}
              error={form.touched.firstName ? form.errors.firstName : undefined}
              onChange={(e) => form.setValue('firstName', e.target.value)}
            />
            <Input
              label="Last Name"
              name="lastName"
              required
              value={form.values.lastName}
              error={form.touched.lastName ? form.errors.lastName : undefined}
              onChange={(e) => form.setValue('lastName', e.target.value)}
            />
          </FormRow>
          
          <FormRow>
            <Dropdown
              label="Gender"
              name="gender"
              required
              options={[
                { label: 'Male', value: 'Male' },
                { label: 'Female', value: 'Female' },
              ]}
              value={form.values.gender}
              error={form.touched.gender ? form.errors.gender : undefined}
              onChange={(e) => form.setValue('gender', e.target.value)}
            />
            <Dropdown
              label="Designation"
              name="designationId"
              required
              options={mockDesignations.map((d) => ({ label: d.title, value: d.id }))}
              value={form.values.designationId}
              error={form.touched.designationId ? form.errors.designationId : undefined}
              onChange={(e) => form.setValue('designationId', e.target.value)}
            />
          </FormRow>

          <FormRow>
            <Input
              label="Email Address"
              name="email"
              type="email"
              required
              value={form.values.email}
              error={form.touched.email ? form.errors.email : undefined}
              onChange={(e) => form.setValue('email', e.target.value)}
            />
            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              required
              placeholder="+1 234 567 8900"
              value={form.values.phone}
              error={form.touched.phone ? form.errors.phone : undefined}
              onChange={(e) => form.setValue('phone', e.target.value)}
            />
          </FormRow>

          <FormRow>
            <Input
              label="Join Date"
              name="joinDate"
              type="date"
              required
              value={form.values.joinDate}
              error={form.touched.joinDate ? form.errors.joinDate : undefined}
              onChange={(e) => form.setValue('joinDate', e.target.value)}
            />
            <Input
              label="Profile Image"
              name="profileImage"
              type="file"
              accept="image/*"
              error={form.touched.profileImage ? form.errors.profileImage : undefined}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  form.setValue('profileImage', URL.createObjectURL(file))
                }
              }}
              hint="Upload a profile picture for the employee."
            />
          </FormRow>
        </div>
      </Card>

      <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-end gap-3 rounded-lg border border-ink-200 bg-ink-50 p-4 shadow-sm">
        <FormActions
          onCancel={() => navigate(ROUTES.EMPLOYEES)}
          onSubmit={handleSubmit}
          submitLabel="Create Employee"
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}
