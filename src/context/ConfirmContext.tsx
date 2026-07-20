import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'primary' | 'danger'
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [resolve, setResolve] = useState<(value: boolean) => void>()

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts)
    setIsOpen(true)
    return new Promise<boolean>((res) => {
      setResolve(() => res)
    })
  }, [])

  const handleConfirm = () => {
    setIsOpen(false)
    resolve?.(true)
  }

  const handleCancel = () => {
    setIsOpen(false)
    resolve?.(false)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      
      {options && (
        <Modal
          isOpen={isOpen}
          onClose={handleCancel}
          title={options.title}
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={handleCancel}>
                {options.cancelText || 'Cancel'}
              </Button>
              <Button variant={options.variant || 'primary'} onClick={handleConfirm}>
                {options.confirmText || 'Confirm'}
              </Button>
            </>
          }
        >
          <p className="text-sm text-ink-600">{options.message}</p>
        </Modal>
      )}
    </ConfirmContext.Provider>
  )
}

export const useConfirm = () => {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }
  return context.confirm
}
