import React, { useState } from 'react'
import Dialog from './Dialog'
import { tw } from '../theme'

export interface AlertOptions {
  title: string
  message?: string
  confirmText?: string
}

let showAlertFn: ((options: AlertOptions) => Promise<void>) | null = null

export function alert(options: AlertOptions): Promise<void> {
  if (showAlertFn) {
    return showAlertFn(options)
  }
  return Promise.reject(new Error('Alert provider not mounted'))
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
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
        <Dialog
          open={true}
          onClose={handleClose}
          title={alertState.title}
        >
          {alertState.message && (
            <p className={`text-sm ${tw.text.light.secondary} ${tw.text.dark.secondary} mb-6`}>
              {alertState.message}
            </p>
          )}
          <div className="flex justify-end">
            <button
              className={`px-4 py-2 text-sm ${tw.primary.bg} ${tw.primary.bgHover} text-white rounded`}
              onClick={handleClose}
            >
              {alertState.confirmText || '确定'}
            </button>
          </div>
        </Dialog>
      )}
    </>
  )
}
