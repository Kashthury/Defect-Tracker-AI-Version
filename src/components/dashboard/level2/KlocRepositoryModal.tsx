import React, { useState } from 'react'
import { CheckCircle2, GitBranch } from 'lucide-react'
import { Modal } from '@/components/common/Modal'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'
import { gitRepositoryService } from '@/services/dashboard/gitRepositoryService'

interface KlocRepositoryModalProps {
  isOpen: boolean
  projectId: string
  onClose: () => void
  onCalculated: (kloc: number) => void
}

export const KlocRepositoryModal: React.FC<KlocRepositoryModalProps> = ({ isOpen, projectId, onClose, onCalculated }) => {
  const [repositoryUrl, setRepositoryUrl] = useState('')
  const [branch, setBranch] = useState('main')
  const [username, setUsername] = useState('')
  const [token, setToken] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ kloc: number; linesOfCode: number } | null>(null)

  const reset = () => {
    setRepositoryUrl('')
    setBranch('main')
    setUsername('')
    setToken('')
    setError(null)
    setResult(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleCalculate = async () => {
    setIsSubmitting(true)
    setError(null)
    setResult(null)
    try {
      // The token/username are sent only for this single request and are
      // discarded from local state immediately after the response resolves.
      const response = await gitRepositoryService.calculateKlocFromRepository({
        projectId,
        repositoryUrl,
        branch,
        username: username || undefined,
        personalAccessToken: token || undefined,
      })
      setUsername('')
      setToken('')
      if (response.success) {
        setResult({ kloc: response.data.kloc, linesOfCode: response.data.linesOfCode })
        onCalculated(response.data.kloc)
      } else {
        setError(response.message)
      }
    } catch {
      setError('Unable to reach the repository service. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Calculate KLOC from Repository"
      description="Runs a repository scan on the backend to derive lines of code. Credentials are used once and are never stored."
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>Close</Button>
          <Button onClick={handleCalculate} isLoading={isSubmitting} leftIcon={<GitBranch className="h-4 w-4" />}>
            Calculate KLOC
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Repository URL" required placeholder="https://github.com/org/repo.git" value={repositoryUrl} onChange={(e) => setRepositoryUrl(e.target.value)} />
        <Input label="Branch" required placeholder="main" value={branch} onChange={(e) => setBranch(e.target.value)} />
        <Input label="Username (if required)" placeholder="Optional" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Input label="Personal Access Token (for private repositories)" type="password" placeholder="Optional" value={token} onChange={(e) => setToken(e.target.value)} />

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-signal-critical">{error}</p>}
        {result && (
          <div className="flex items-start gap-2 rounded-md bg-emerald-50 px-3 py-2.5 text-xs text-signal-low">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Scan complete: {result.linesOfCode.toLocaleString('en-US')} lines of code detected, saved as {result.kloc} KLOC.
              Defect Density has been refreshed.
            </span>
          </div>
        )}
      </div>
    </Modal>
  )
}
