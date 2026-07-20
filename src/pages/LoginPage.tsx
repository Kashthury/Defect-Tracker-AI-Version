import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Bug, LogIn, AlertCircle } from 'lucide-react'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/hooks/useAuth'
import { useForm } from '@/hooks/useForm'
import { required, email as emailValidator, composeValidators } from '@/utils/validation'
import { ROUTES } from '@/constants/routes'
import { APP_NAME } from '@/constants/app'

interface LoginFormValues {
  email: string
  password: string
}

const DEMO_ACCOUNTS = [
  { label: 'System Admin', email: 'ada.fernando@defecttrack.io' },
  { label: 'Project Manager', email: 'priya.raghavan@defecttrack.io' },
  { label: 'QA Engineer', email: 'arjun.mehta@defecttrack.io' },
]

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isLoggingIn, loginError, sessionExpiredReason, clearSessionExpiredReason } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    initialValues: { email: '', password: '' },
    schema: {
      email: { required: true, label: 'Email', validate: composeValidators(required('Email'), emailValidator('Email')) },
      password: { required: true, label: 'Password' },
    },
  })

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearSessionExpiredReason()
    setSubmitError(null)
    if (!form.validateAll()) return
    const success = await login({ email: form.values.email.trim(), password: form.values.password })
    if (success) {
      navigate(ROUTES.DASHBOARD, { replace: true })
    }
  }

  const fillDemo = (demoEmail: string) => {
    form.setValue('email', demoEmail)
    form.setValue('password', 'Passw0rd!')
  }

  return (
    <div className="flex min-h-screen w-full bg-ink-950">
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-ink-950 via-ink-900 to-brand-700 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10">
            <Bug className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-wide">{APP_NAME}</span>
        </div>
        <div>
          <h1 className="max-w-md text-3xl font-semibold leading-tight">
            Track every defect from first report to verified fix.
          </h1>
          <p className="mt-4 max-w-md text-sm text-ink-300">
            Privilege-driven workspace for QA teams, developers, and project managers &mdash; projects, releases,
            test cases, and defects in one place.
          </p>
        </div>
        <p className="text-xs text-ink-500">&copy; 2026 {APP_NAME}. Internal enterprise tool.</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-ink-50 p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-ink-900 text-white">
              <Bug className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold text-ink-900">{APP_NAME}</span>
          </div>

          <div className="rounded-lg border border-ink-100 bg-white p-7 shadow-panel">
            <h2 className="text-lg font-semibold text-ink-900">Sign in to your account</h2>
            <p className="mt-1 text-sm text-ink-500">Enter your credentials to access the workspace.</p>

            {sessionExpiredReason && (
              <div className="mt-4 flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2.5 text-xs text-amber-800 ring-1 ring-inset ring-amber-200">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{sessionExpiredReason}</span>
              </div>
            )}
            {(submitError || loginError) && (
              <div className="mt-4 flex items-start gap-2 rounded-md bg-red-50 px-3 py-2.5 text-xs text-signal-critical ring-1 ring-inset ring-red-200">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{submitError || loginError}</span>
              </div>
            )}

            <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
              <Input
                label="Email"
                name="email"
                type="email"
                required
                placeholder="you@defecttrack.io"
                value={form.values.email}
                error={form.touched.email ? form.errors.email : undefined}
                onChange={(e) => form.setValue('email', e.target.value)}
                autoComplete="username"
              />
              <Input
                label="Password"
                name="password"
                type="password"
                required
                placeholder={'\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                value={form.values.password}
                error={form.touched.password ? form.errors.password : undefined}
                onChange={(e) => form.setValue('password', e.target.value)}
                autoComplete="current-password"
              />
              <Button type="submit" fullWidth isLoading={isLoggingIn} leftIcon={<LogIn className="h-4 w-4" />}>
                Sign in
              </Button>
            </form>

            <div className="mt-6 border-t border-ink-100 pt-4">
              <p className="mb-2 text-xs font-medium text-ink-500">Quick demo sign-in</p>
              <div className="flex flex-wrap gap-1.5">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => fillDemo(acc.email)}
                    className="rounded-full border border-ink-200 px-2.5 py-1 text-xs font-medium text-ink-600 hover:border-brand-400 hover:text-brand-600"
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
