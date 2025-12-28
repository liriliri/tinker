import React, { useState } from 'react'
import Dialog from './Dialog'
import { tw } from '../theme'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
}

let showConfirmFn: ((options: ConfirmOptions) => Promise<boolean>) | null = null

export function confirm(options: ConfirmOptions): Promise<boolean> {
  if (showConfirmFn) {
    return showConfirmFn(options)
  }
  return Promise.reject(new Error('Confirm provider not mounted'))
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null)
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(
    null
  )

  showConfirmFn = (options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState(options)
      setResolver(() => resolve)
    })
  }

  const handleConfirm = () => {
    if (resolver) {
      resolver(true)
    }
    setConfirmState(null)
    setResolver(null)
  }

  const handleCancel = () => {
    if (resolver) {
      resolver(false)
    }
    setConfirmState(null)
    setResolver(null)
  }

  return (
    <>
      {children}
      {confirmState && (
        <Dialog
          open={true}
          onClose={handleCancel}
          title={confirmState.title}
        >
          {confirmState.message && (
            <p className={`text-sm ${tw.text.light.secondary} ${tw.text.dark.secondary} mb-6`}>
              {confirmState.message}
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <button
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              onClick={handleCancel}
            >
              {confirmState.cancelText || '取消'}
            </button>
            <button
              className={`px-4 py-2 text-sm ${tw.primary.bg} ${tw.primary.bgHover} text-white rounded`}
              onClick={handleConfirm}
            >
              {confirmState.confirmText || '确定'}
            </button>
          </div>
        </Dialog>
      )}
    </>
  )
}
