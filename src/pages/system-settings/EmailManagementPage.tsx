import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2, Eye, Mail, RotateCcw, Save, Send, Server, ShieldCheck, Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/common/Card'
import { Input } from '@/components/common/Input'
import { Dropdown } from '@/components/common/Dropdown'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { Toggle } from '@/components/common/Toggle'
import { FormRow } from '@/components/forms/FormRow'
import { cn } from '@/utils/cn'

type TabKey = 'smtp' | 'templates' | 'users' | 'roles'
type Preference = 'INHERIT' | 'ENABLED' | 'DISABLED'
type RolePreference = 'DEFAULT' | 'ENABLED' | 'DISABLED'

interface EmailPoint {
  id: string
  eventType: string
  description: string
  category: string
  enabled: boolean
  subject: string
  body: string
  variables: string[]
  updatedAt: string
}

const INITIAL_POINTS: EmailPoint[] = [
  { id: '1', eventType: 'EMPLOYEE_CREATED', description: 'Send email when employee account is created', category: 'Employee', enabled: true, subject: 'Employee Account Created', body: '<p>Hello <strong>{{employeeName}}</strong>, your account is ready.</p>', variables: ['employeeName', 'email', 'password', 'loginUrl', 'year'], updatedAt: '2026-07-16' },
  { id: '2', eventType: 'EMPLOYEE_ACTIVATED', description: 'Send email when employee is activated', category: 'Employee', enabled: true, subject: 'Account Activated', body: '<p>Hello {{employeeName}}, your account has been activated.</p>', variables: ['employeeName', 'loginUrl', 'year'], updatedAt: '2026-07-16' },
  { id: '3', eventType: 'EMPLOYEE_DEACTIVATED', description: 'Send email when employee is deactivated', category: 'Employee', enabled: true, subject: 'Account Deactivated', body: '<p>Hello {{employeeName}}, your account has been deactivated.</p>', variables: ['employeeName', 'year'], updatedAt: '2026-07-16' },
  { id: '4', eventType: 'PROJECT_CREATED', description: 'Send email when project is created', category: 'Project', enabled: true, subject: 'Project Created - {{projectName}}', body: '<p>The project {{projectName}} was created.</p>', variables: ['projectName', 'managerName', 'year'], updatedAt: '2026-07-16' },
  { id: '5', eventType: 'PROJECT_ALLOCATION', description: 'Send email when employee is allocated to project', category: 'Project', enabled: true, subject: 'Project Allocation - {{projectName}}', body: '<p>Hello {{employeeName}}, you were allocated to {{projectName}}.</p>', variables: ['employeeName', 'projectName', 'roleName', 'startDate', 'endDate', 'year'], updatedAt: '2026-07-16' },
  { id: '6', eventType: 'PROJECT_DEALLOCATION', description: 'Send email when employee is removed from project', category: 'Project', enabled: true, subject: 'Project Deallocation - {{projectName}}', body: '<p>Hello {{employeeName}}, you were removed from {{projectName}}.</p>', variables: ['employeeName', 'projectName', 'roleName', 'year'], updatedAt: '2026-07-16' },
  { id: '7', eventType: 'MODULE_ALLOCATION', description: 'Send email when module is assigned', category: 'Module', enabled: true, subject: 'Module Assignment', body: '<p>You were assigned to {{moduleName}}.</p>', variables: ['employeeName', 'projectName', 'moduleName', 'year'], updatedAt: '2026-07-16' },
  { id: '8', eventType: 'SUBMODULE_ALLOCATION', description: 'Send email when sub module is assigned', category: 'Submodule', enabled: true, subject: 'Submodule Assignment', body: '<p>You were assigned to {{submoduleName}}.</p>', variables: ['employeeName', 'projectName', 'moduleName', 'submoduleName', 'year'], updatedAt: '2026-07-16' },
  { id: '9', eventType: 'DEFECT_ASSIGNED', description: 'Send email when defect is assigned', category: 'Defect', enabled: true, subject: 'Defect Assigned - {{defectId}}', body: '<p>Defect {{defectId}} has been assigned to {{employeeName}}.</p>', variables: ['employeeName', 'projectName', 'defectId', 'description', 'status', 'defectUrl', 'year'], updatedAt: '2026-07-16' },
  { id: '10', eventType: 'DEFECT_REASSIGNED', description: 'Send email when defect is reassigned', category: 'Defect', enabled: true, subject: 'Defect Reassigned - {{defectId}}', body: '<p>Defect {{defectId}} was reassigned to {{employeeName}}.</p>', variables: ['employeeName', 'previousAssigneeName', 'assignedBy', 'projectName', 'defectId', 'description', 'status', 'defectUrl', 'year'], updatedAt: '2026-07-16' },
  { id: '11', eventType: 'DEFECT_UPDATED', description: 'Send email when defect is updated', category: 'Defect', enabled: true, subject: 'Defect Updated - {{defectId}}', body: '<p>Status changed from {{oldStatus}} to {{newStatus}}.</p>', variables: ['employeeName', 'projectName', 'projectId', 'defectId', 'oldStatus', 'newStatus', 'year'], updatedAt: '2026-07-16' },
  { id: '12', eventType: 'PASSWORD_RESET', description: 'Send email for password reset request', category: 'Security', enabled: true, subject: 'Password Reset Request', body: '<p>Reset your password using {{resetLink}}.</p>', variables: ['employeeName', 'resetLink', 'year'], updatedAt: '2026-07-16' },
  { id: '13', eventType: 'PASSWORD_CHANGED', description: 'Send email when password is changed', category: 'Security', enabled: true, subject: 'Password Changed', body: '<p>Your password was changed successfully.</p>', variables: ['employeeName', 'changedAt', 'year'], updatedAt: '2026-07-16' },
  { id: '14', eventType: 'ACCOUNT_LOCKED', description: 'Send email when account is locked', category: 'Security', enabled: true, subject: 'Account Locked', body: '<p>Your account was locked at {{lockedAt}}.</p>', variables: ['employeeName', 'lockedAt', 'year'], updatedAt: '2026-07-16' },
  { id: '15', eventType: 'LOGIN_SUCCESS', description: 'Send email when account login succeeds', category: 'Security', enabled: true, subject: 'Login Successful', body: '<p>Successful login at {{loginTime}}.</p>', variables: ['employeeName', 'loginTime', 'ipAddress', 'deviceName', 'year'], updatedAt: '2026-07-16' },
]

const tabs = [
  { key: 'smtp' as const, label: 'SMTP Server', icon: Server },
  { key: 'templates' as const, label: 'Email Templates', icon: Mail },
  { key: 'users' as const, label: 'User Preferences', icon: Users },
  { key: 'roles' as const, label: 'Role Preferences', icon: ShieldCheck },
]

const pretty = (value: string) => value.toLowerCase().split('_').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ')

export const EmailManagementPage: React.FC = () => {
  const [params, setParams] = useSearchParams()
  const active = (params.get('tab') as TabKey) || 'smtp'
  const [points, setPoints] = useState(INITIAL_POINTS)
  const [editing, setEditing] = useState<EmailPoint | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [user, setUser] = useState('emp-1')
  const [role, setRole] = useState('role-qa')
  const [userPrefs, setUserPrefs] = useState<Record<string, Preference>>({})
  const [rolePrefs, setRolePrefs] = useState<Record<string, RolePreference>>({})
  const [smtp, setSmtp] = useState({ host: 'smtp.defecttrack.io', port: '587', username: 'mailer@defecttrack.io', password: '', encryption: 'TLS', fromEmail: 'no-reply@defecttrack.io', fromName: 'DefectTrack Notifications', replyTo: 'support@defecttrack.io', connectionTimeout: '10000', readTimeout: '10000', auth: true, enabled: true })
  const [smtpStatus, setSmtpStatus] = useState<'Connected' | 'Not tested'>('Not tested')

  const filtered = useMemo(() => points.filter((p) => (category === 'ALL' || p.category === category) && `${p.eventType} ${p.description} ${p.subject}`.toLowerCase().includes(search.toLowerCase())), [points, search, category])

  const changeTab = (tab: TabKey) => setParams({ tab })
  const updatePoint = (point: EmailPoint) => setPoints((prev) => prev.map((p) => p.id === point.id ? point : p))

  return (
    <div className="space-y-5">
      <PageHeader title="Email Management" description="Manage SMTP delivery, event templates, and notification preferences from one place." />
      <div className="flex flex-wrap gap-2 rounded-lg border border-ink-100 bg-white p-2 shadow-panel">
        {tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.key} onClick={() => changeTab(tab.key)} className={cn('inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition', active === tab.key ? 'bg-brand-600 text-white shadow-panel' : 'text-ink-600 hover:bg-ink-50')}><Icon className="h-4 w-4" />{tab.label}</button> })}
      </div>

      {active === 'smtp' && <Card title="SMTP Server Configuration" subtitle="Credentials are masked after saving and are never returned as plain text." actions={<Badge tone={smtpStatus === 'Connected' ? 'success' : 'neutral'} dot>{smtpStatus}</Badge>}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-ink-50 p-3"><div><p className="text-sm font-medium text-ink-800">Email delivery</p><p className="text-xs text-ink-500">Enable or disable outbound system email.</p></div><Toggle label="SMTP server" checked={smtp.enabled} onChange={(enabled) => setSmtp({ ...smtp, enabled })} /></div>
          <FormRow columns={2}><Input label="SMTP Host" required value={smtp.host} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} /><Input label="SMTP Port" required type="number" value={smtp.port} onChange={(e) => setSmtp({ ...smtp, port: e.target.value })} /></FormRow>
          <FormRow columns={2}><Input label="Username" value={smtp.username} onChange={(e) => setSmtp({ ...smtp, username: e.target.value })} /><Input label="Password" type="password" placeholder="•••••••• (leave blank to keep current)" value={smtp.password} onChange={(e) => setSmtp({ ...smtp, password: e.target.value })} /></FormRow>
          <FormRow columns={2}><Dropdown label="Encryption Type" value={smtp.encryption} onChange={(e) => setSmtp({ ...smtp, encryption: e.target.value })} options={['NONE','SSL','TLS','STARTTLS'].map((v) => ({ label: v, value: v }))} /><div className="flex items-end pb-1"><Toggle label="Authentication required" checked={smtp.auth} onChange={(auth) => setSmtp({ ...smtp, auth })} /></div></FormRow>
          <FormRow columns={2}><Input label="From Email Address" type="email" value={smtp.fromEmail} onChange={(e) => setSmtp({ ...smtp, fromEmail: e.target.value })} /><Input label="From Display Name" value={smtp.fromName} onChange={(e) => setSmtp({ ...smtp, fromName: e.target.value })} /></FormRow>
          <FormRow columns={3}><Input label="Reply-To Email" type="email" value={smtp.replyTo} onChange={(e) => setSmtp({ ...smtp, replyTo: e.target.value })} /><Input label="Connection Timeout (ms)" type="number" value={smtp.connectionTimeout} onChange={(e) => setSmtp({ ...smtp, connectionTimeout: e.target.value })} /><Input label="Read Timeout (ms)" type="number" value={smtp.readTimeout} onChange={(e) => setSmtp({ ...smtp, readTimeout: e.target.value })} /></FormRow>
          <div className="flex flex-wrap justify-end gap-2 border-t border-ink-100 pt-4"><Button variant="outline" leftIcon={<RotateCcw className="h-4 w-4" />}>Reset Changes</Button><Button variant="secondary" leftIcon={<CheckCircle2 className="h-4 w-4" />} onClick={() => setSmtpStatus('Connected')}>Test Connection</Button><Button variant="secondary" leftIcon={<Send className="h-4 w-4" />}>Send Test Email</Button><Button leftIcon={<Save className="h-4 w-4" />}>Save Configuration</Button></div>
        </div>
      </Card>}

      {active === 'templates' && <div className="space-y-4">
        <Card><div className="grid gap-3 md:grid-cols-[1fr_220px]"><Input placeholder="Search event type, description or subject..." value={search} onChange={(e) => setSearch(e.target.value)} /><Dropdown value={category} onChange={(e) => setCategory(e.target.value)} options={[{label:'All Categories',value:'ALL'}, ...['Employee','Project','Module','Submodule','Defect','Security'].map((v) => ({label:v,value:v}))]} /></div></Card>
        <div className="overflow-hidden rounded-lg border border-ink-100 bg-white shadow-panel"><div className="overflow-auto"><table className="w-full min-w-[1050px] text-sm"><thead className="bg-ink-50 text-left text-xs uppercase text-ink-500"><tr><th className="px-4 py-3">Event Type</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Global Status</th><th className="px-4 py-3">Template Subject</th><th className="px-4 py-3">Updated</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody>{filtered.map((p) => <tr key={p.id} className="border-t border-ink-100"><td className="px-4 py-3 font-medium text-ink-800">{pretty(p.eventType)}</td><td className="px-4 py-3 text-ink-500">{p.description}</td><td className="px-4 py-3"><Badge tone="info">{p.category}</Badge></td><td className="px-4 py-3"><Toggle label={p.eventType} checked={p.enabled} onChange={(enabled) => updatePoint({ ...p, enabled })} /></td><td className="px-4 py-3">{p.subject}</td><td className="px-4 py-3 text-ink-500">{p.updatedAt}</td><td className="px-4 py-3 text-right"><Button size="sm" variant="outline" leftIcon={<Eye className="h-3.5 w-3.5" />} onClick={() => setEditing({ ...p })}>Edit Template</Button></td></tr>)}</tbody></table></div></div>
        {editing && <Card title={`Edit Template · ${pretty(editing.eventType)}`} subtitle={editing.description}><div className="space-y-4"><Input label="Event Type" value={editing.eventType} disabled /><Input label="Template Subject" value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} /><div><label className="mb-1.5 block text-sm font-medium text-ink-700">HTML Email Body</label><textarea className="min-h-52 w-full rounded-md border border-ink-200 p-3 font-mono text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40" value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} /></div><div><p className="mb-2 text-sm font-medium text-ink-700">Available Variables</p><div className="flex flex-wrap gap-2">{editing.variables.map((v) => <button key={v} onClick={() => setEditing({ ...editing, body: `${editing.body} {{${v}}}` })} className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">{'{{'}{v}{'}}'}</button>)}</div></div><div className="rounded-md border border-ink-100 bg-ink-50 p-4"><p className="mb-2 text-xs font-semibold uppercase text-ink-500">Preview</p><div className="rounded bg-white p-4 text-sm text-ink-700" dangerouslySetInnerHTML={{ __html: editing.body.replace(/{{(.*?)}}/g, '<strong>Sample $1</strong>') }} /></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button variant="secondary" leftIcon={<Send className="h-4 w-4" />}>Send Test</Button><Button leftIcon={<Save className="h-4 w-4" />} onClick={() => { updatePoint({ ...editing, updatedAt: '2026-07-16' }); setEditing(null) }}>Save Template</Button></div></div></Card>}
      </div>}

      {active === 'users' && <PreferencePanel mode="user" selected={user} onSelected={setUser} points={points} preferences={userPrefs} setPreferences={setUserPrefs} />}
      {active === 'roles' && <PreferencePanel mode="role" selected={role} onSelected={setRole} points={points} preferences={rolePrefs} setPreferences={setRolePrefs} />}
    </div>
  )
}

function PreferencePanel({ mode, selected, onSelected, points, preferences, setPreferences }: { mode: 'user' | 'role'; selected: string; onSelected: (v:string)=>void; points: EmailPoint[]; preferences: Record<string, any>; setPreferences: React.Dispatch<React.SetStateAction<Record<string, any>>> }) {
  const options = mode === 'user' ? [{label:'Arun Kumar · QA Engineer',value:'emp-1'},{label:'Nivetha Raj · Developer',value:'emp-2'},{label:'Suresh Mani · Project Manager',value:'emp-3'}] : [{label:'QA Engineer',value:'role-qa'},{label:'Developer',value:'role-dev'},{label:'Project Manager',value:'role-pm'}]
  const values = mode === 'user' ? ['INHERIT','ENABLED','DISABLED'] : ['DEFAULT','ENABLED','DISABLED']
  return <div className="space-y-4"><Card title={mode === 'user' ? 'User Email Preferences' : 'Role Email Preferences'} subtitle={mode === 'user' ? 'User overrides take priority over role defaults.' : 'Role preferences provide defaults for allocated employees.'}><div className="max-w-md"><Dropdown label={mode === 'user' ? 'Select Employee' : 'Select Role'} value={selected} onChange={(e) => onSelected(e.target.value)} options={options} /></div></Card><div className="overflow-hidden rounded-lg border border-ink-100 bg-white shadow-panel"><div className="overflow-auto"><table className="w-full min-w-[900px] text-sm"><thead className="bg-ink-50 text-left text-xs uppercase text-ink-500"><tr><th className="px-4 py-3">Event Type</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Global Status</th><th className="px-4 py-3">Preference</th><th className="px-4 py-3">Effective Result</th></tr></thead><tbody>{points.map((p) => { const pref = preferences[p.id] || values[0]; const effective = !p.enabled ? 'Disabled globally' : pref === 'DISABLED' ? 'Disabled by override' : pref === 'ENABLED' ? 'Enabled by override' : mode === 'user' ? 'Inherited from role' : 'Using system default'; return <tr key={p.id} className="border-t border-ink-100"><td className="px-4 py-3 font-medium text-ink-800">{pretty(p.eventType)}</td><td className="px-4 py-3 text-ink-500">{p.description}</td><td className="px-4 py-3"><Badge tone={p.enabled ? 'success':'neutral'}>{p.enabled?'Enabled':'Disabled'}</Badge></td><td className="px-4 py-3"><select className="h-9 rounded-md border border-ink-200 bg-white px-3 text-sm" value={pref} onChange={(e) => setPreferences((prev) => ({...prev,[p.id]:e.target.value}))}>{values.map((v)=><option key={v}>{v}</option>)}</select></td><td className="px-4 py-3"><Badge tone={effective.startsWith('Enabled') || effective.startsWith('Inherited') || effective.startsWith('Using') ? 'success':'neutral'}>{effective}</Badge></td></tr>})}</tbody></table></div></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setPreferences({})}>Reset to Defaults</Button><Button leftIcon={<Save className="h-4 w-4" />}>Save Preferences</Button></div></div>
}
