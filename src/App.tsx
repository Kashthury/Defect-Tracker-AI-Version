import React from 'react'
import { AppRoutes } from '@/routes/AppRoutes'
import { ToastProvider } from '@/context/ToastContext'
import { ConfirmProvider } from '@/context/ConfirmContext'
import { ProjectProvider } from '@/context/ProjectContext'
import { ReleaseProvider } from '@/context/ReleaseContext'

const App: React.FC = () => {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <ProjectProvider>
          <ReleaseProvider>
            <AppRoutes />
          </ReleaseProvider>
        </ProjectProvider>
      </ConfirmProvider>
    </ToastProvider>
  )
}

export default App
