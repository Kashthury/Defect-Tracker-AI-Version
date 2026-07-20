import React from 'react'
import { Mail } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/common/Card'
import { Input } from '@/components/common/Input'
import { Dropdown } from '@/components/common/Dropdown'
import { Button } from '@/components/common/Button'
import { FormRow } from '@/components/forms/FormRow'
import { useForm } from '@/hooks/useForm'

interface EmailConfigForm {
  smtpHost: string
  smtpPort: string
  senderEmail: string
  senderName: string
  encryption: string
}

const ENCRYPTION_OPTIONS = [
  { label: 'TLS', value: 'TLS' },
  { label: 'SSL', value: 'SSL' },
  { label: 'None', value: 'None' },
]

export const EmailConfigurationPage: React.FC = () => {
  const form = useForm<EmailConfigForm>({
    initialValues: {
      smtpHost: 'smtp.defecttrack.io',
      smtpPort: '587',
      senderEmail: 'no-reply@defecttrack.io',
      senderName: 'DefectTrack Notifications',
      encryption: 'TLS',
    },
    schema: {
      smtpHost: { required: true, label: 'SMTP host' },
      smtpPort: { required: true, label: 'SMTP port' },
      senderEmail: { required: true, label: 'Sender email' },
      senderName: { required: true, label: 'Sender name' },
    },
    requireDirtyToSubmit: true,
  })

  const handleUpdate = () => {
    if (!form.validateAll()) return
    // Mock-only: would PUT /api/system-settings/email-configuration
    form.reset(form.values)
  }

  return (
    <div>
      <PageHeader title="Email Configuration" description="Outbound SMTP settings used for all system notifications." />
      <Card title="SMTP Settings" subtitle="Changes take effect for all future notification emails" actions={<Mail className="h-4 w-4 text-ink-400" />}>
        <div className="flex flex-col gap-4">
          <FormRow columns={2}>
            <Input
              label="SMTP Host"
              required
              value={form.values.smtpHost}
              error={form.touched.smtpHost ? form.errors.smtpHost : undefined}
              onChange={(e) => form.setValue('smtpHost', e.target.value)}
            />
            <Input
              label="SMTP Port"
              required
              value={form.values.smtpPort}
              error={form.touched.smtpPort ? form.errors.smtpPort : undefined}
              onChange={(e) => form.setValue('smtpPort', e.target.value)}
            />
          </FormRow>
          <FormRow columns={2}>
            <Input
              label="Sender Email"
              required
              type="email"
              value={form.values.senderEmail}
              error={form.touched.senderEmail ? form.errors.senderEmail : undefined}
              onChange={(e) => form.setValue('senderEmail', e.target.value)}
            />
            <Input
              label="Sender Name"
              required
              value={form.values.senderName}
              error={form.touched.senderName ? form.errors.senderName : undefined}
              onChange={(e) => form.setValue('senderName', e.target.value)}
            />
          </FormRow>
          <Dropdown
            label="Encryption"
            options={ENCRYPTION_OPTIONS}
            value={form.values.encryption}
            onChange={(e) => form.setValue('encryption', e.target.value)}
          />
          <div className="flex justify-end border-t border-ink-100 pt-4">
            <Button onClick={handleUpdate} disabled={!form.canSubmit}>
              Update Configuration
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
