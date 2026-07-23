import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge, Card, Dropdown, ErrorMessage, Input, Loader } from '@/components/common'
import { ProfileImageUpload } from '@/components/employees/ProfileImageUpload'
import { Toggle } from '@/components/common/Toggle'
import { FormRow } from '@/components/forms/FormRow'
import { FormActions } from '@/components/forms/FormActions'
import { FormErrorAlert } from '@/components/forms/FormErrorAlert'
import { useForm } from '@/hooks/useForm'
import { required, email as emailValidator, phone as phoneValidator, composeValidators } from '@/utils/validation'
import { employeeService } from '@/services/employeeService'
import { designationService } from '@/services/designationService'
import { EmployeeResponse, Gender } from '@/types/employee'
import { useToast } from '@/context/ToastContext'
import { ROUTES } from '@/constants/routes'

interface FormValues { firstName: string; lastName: string; gender: Gender | ''; designationId: string; email: string; phoneNo: string; joinDate: string; active: boolean }
const genders = [{ label: 'Male', value: 'MALE' }, { label: 'Female', value: 'FEMALE' }, { label: 'Other', value: 'OTHER' }]
const normalized = (v: FormValues) => ({ ...v, firstName: v.firstName.trim(), lastName: v.lastName.trim(), email: v.email.trim().toLowerCase(), phoneNo: v.phoneNo.trim() })

export const EmployeeEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); const navigate = useNavigate(); const toast = useToast()
  const [employee, setEmployee] = useState<EmployeeResponse | null>(null); const [initial, setInitial] = useState<FormValues | null>(null)
  const [designations, setDesignations] = useState<{ label: string; value: string }[]>([])
  const [isLoading, setIsLoading] = useState(true); const [loadError, setLoadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false); const [submitError, setSubmitError] = useState<string | null>(null); const [emailError, setEmailError] = useState('')
  const [profileImage, setProfileImage] = useState<File | null>(null); const [removeProfileImage, setRemoveProfileImage] = useState(false)
  const form = useForm<FormValues>({
    initialValues: { firstName: '', lastName: '', gender: '', designationId: '', email: '', phoneNo: '', joinDate: '', active: true },
    schema: {
      firstName: { required: true, label: 'First Name' }, lastName: { required: true, label: 'Last Name' }, gender: { required: true, label: 'Gender' }, designationId: { required: true, label: 'Designation' },
      email: { required: true, label: 'Email Address', validate: composeValidators(required('Email'), emailValidator('Email')) },
      phoneNo: { required: true, label: 'Phone Number', validate: composeValidators(required('Phone'), phoneValidator('Phone')) },
      joinDate: { required: true, label: 'Join Date', validate: (value) => value > new Date().toISOString().slice(0, 10) ? 'Join Date cannot be in the future.' : undefined },
    },
  })

  const load = useCallback(async () => {
    if (!id) return; setIsLoading(true); setLoadError(null)
    const [employeeResult, designationResult] = await Promise.all([employeeService.getEmployeeById(id), designationService.getDesignations({ pageNumber: 0, pageSize: 100, sortBy: 'title', sortDir: 'asc' })])
    if (!employeeResult.success) setLoadError(employeeResult.message)
    else {
      const item = employeeResult.data; const values: FormValues = { firstName: item.firstName, lastName: item.lastName, gender: item.gender, designationId: String(item.designationId), email: item.email, phoneNo: item.phoneNo, joinDate: item.joinDate, active: item.active }
      setEmployee(item); setInitial(normalized(values)); setProfileImage(null); setRemoveProfileImage(false); form.reset(values)
    }
    if (designationResult.success) setDesignations(designationResult.data.content.filter((item) => item.active !== false || String(item.id) === String(employeeResult.success ? employeeResult.data.designationId : '')).map((item) => ({ label: item.title, value: item.id })))
    setIsLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])
  useEffect(() => { void load() }, [load])
  const changed = useMemo(() => initial ? JSON.stringify(normalized(form.values)) !== JSON.stringify(initial) || Boolean(profileImage) || removeProfileImage : false, [form.values, initial, profileImage, removeProfileImage])

  const submit = async () => {
    if (!id || !employee || !form.validateAll() || !changed || isSubmitting) return
    if (employee.superUser && !form.values.active) { setSubmitError('The Super User cannot be deactivated.'); return }
    setIsSubmitting(true); setSubmitError(null); setEmailError('')
    const v = normalized(form.values)
    const result = await employeeService.updateEmployee(id, { firstName: v.firstName, lastName: v.lastName, gender: v.gender as Gender, email: v.email, phoneNo: v.phoneNo, joinDate: v.joinDate, designationId: Number(v.designationId), active: employee.superUser ? true : v.active, profileImage, removeProfileImage })
    setIsSubmitting(false)
    if (!result.success) { if (result.message.toLowerCase().includes('email')) setEmailError(result.message); else setSubmitError(result.message); return }
    toast.success(result.message); navigate(ROUTES.EMPLOYEE_DETAIL.replace(':id', id))
  }
  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader label="Loading employee data..." /></div>
  if (loadError || !employee) return <div className="py-12"><ErrorMessage message={loadError || 'Employee not found.'} /></div>
  return <div className="mx-auto max-w-4xl">
    <button onClick={() => navigate(ROUTES.EMPLOYEE_DETAIL.replace(':id', String(employee.id)))} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"><ArrowLeft className="h-4 w-4" />Back to Details</button>
    <PageHeader title="Edit Employee" description={`Update information for ${employee.fullName}.`} actions={<div className="flex gap-2"><Badge tone="neutral">{employee.employeeCode}</Badge>{employee.superUser && <Badge tone="info">Super User</Badge>}</div>} />
    <Card className="p-6"><FormErrorAlert message={submitError || emailError} title="Employee could not be updated" /><div className="flex flex-col gap-6">
      <FormRow><Input label="First Name" required value={form.values.firstName} error={form.touched.firstName ? form.errors.firstName : undefined} onChange={(e) => form.setValue('firstName', e.target.value)} /><Input label="Last Name" required value={form.values.lastName} error={form.touched.lastName ? form.errors.lastName : undefined} onChange={(e) => form.setValue('lastName', e.target.value)} /></FormRow>
      <FormRow><Dropdown label="Gender" required options={genders} value={form.values.gender} error={form.touched.gender ? form.errors.gender : undefined} onChange={(e) => form.setValue('gender', e.target.value)} /><Dropdown label="Designation" required options={designations} value={form.values.designationId} error={form.touched.designationId ? form.errors.designationId : undefined} onChange={(e) => form.setValue('designationId', e.target.value)} /></FormRow>
      <FormRow><Input label="Email Address" type="email" required value={form.values.email} error={emailError || (form.touched.email ? form.errors.email : undefined)} onChange={(e) => { form.setValue('email', e.target.value); setEmailError('') }} /><Input label="Phone Number" type="tel" required value={form.values.phoneNo} error={form.touched.phoneNo ? form.errors.phoneNo : undefined} onChange={(e) => form.setValue('phoneNo', e.target.value)} /></FormRow>
      <FormRow columns={1}><Input label="Join Date" type="date" required max={new Date().toISOString().slice(0, 10)} value={form.values.joinDate} error={form.touched.joinDate ? form.errors.joinDate : undefined} onChange={(e) => form.setValue('joinDate', e.target.value)} /></FormRow>
      <ProfileImageUpload file={profileImage} existingImage={employee.profileImage} removed={removeProfileImage} disabled={isSubmitting} onChange={(file) => { setProfileImage(file); setRemoveProfileImage(false) }} onRemove={() => { setProfileImage(null); setRemoveProfileImage(Boolean(employee.profileImage)) }} />
      <div className="rounded-md border border-ink-100 p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-ink-900">Employee status</p><p className="text-xs text-ink-500">{employee.superUser ? 'The Super User must remain active.' : 'Control whether this employee can use the system.'}</p></div><Toggle checked={form.values.active} disabled={employee.superUser} label="Employee active status" onChange={(active: boolean) => form.setValue('active', active)} /></div></div>
    </div></Card>
    <div className="sticky bottom-0 z-10 mt-6 rounded-lg border border-ink-200 bg-ink-50 p-4 shadow-sm"><FormActions onCancel={() => navigate(ROUTES.EMPLOYEE_DETAIL.replace(':id', String(employee.id)))} onSubmit={submit} submitLabel="Save Changes" isSubmitting={isSubmitting} isSubmitDisabled={!changed || !form.canSubmit || isSubmitting} /></div>
  </div>
}
