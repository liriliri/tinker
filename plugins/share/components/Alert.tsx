import React, { useState } from 'react'
import Dialog, { DialogButton } from './Dialog'
import { tw } from '../theme'

export interface AlertOptions {
  title: string
  message?: string
  confirmText?: string
}

const BUILT_IN_TRANSLATIONS = {
  'en-US': {
    confirm: 'Confirm',
  },
  'zh-CN': {
    confirm: '确定',
  },
}

let showAlertFn: ((options: AlertOptions) => Promise<void>) | null = null

export function alert(options: AlertOptions): Promise<void> {
  if (showAlertFn) {
    return showAlertFn(options)
  }
  return Promise.reject(new Error('Alert provider not mounted'))
}

interface AlertProviderProps {
  children: React.ReactNode
  locale?: string
}

export function AlertProvider({
  children,
  locale = 'en-US',
}: AlertProviderProps) {
  const [alertState, setAlertState] = useState<AlertOptions | null>(null)
  const [resolver, setResolver] = useState<(() => void) | null>(null)

  showAlertFn = (options: AlertOptions) => {
    return new Promise<void>((resolve) => {
      setAlertState(options)
      setResolver(() => resolve)
    })
  }

  const handleClose = () => {
    if (resolver) {
      resolver()
    }
    setAlertState(null)
    setResolver(null)
  }

  return (
    <>
      {children}
      {alertState && (
        <Dialog open={true} onClose={handleClose} title={alertState.title}>
          {alertState.message && (
            <p
              className={`text-sm ${tw.text.secondary} ${tw.text.secondary} mb-6`}
            >
              {alertState.message}
            </p>
          )}
          <div className="flex justify-end">
            <DialogButton onClick={handleClose}>
              {alertState.confirmText || BUILT_IN_TRANSLATIONS[locale].confirm}
            </DialogButton>
          </div>
        </Dialog>
      )}
    </>
  )
}
