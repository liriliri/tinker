import React, { useState } from 'react'
import Dialog, { DialogButton } from './Dialog'
import { tw } from '../theme'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
}

const BUILT_IN_TRANSLATIONS = {
  'en-US': {
    confirm: 'Confirm',
    cancel: 'Cancel',
  },
  'zh-CN': {
    confirm: '确定',
    cancel: '取消',
  },
}

let showConfirmFn: ((options: ConfirmOptions) => Promise<boolean>) | null = null

export function confirm(options: ConfirmOptions): Promise<boolean> {
  if (showConfirmFn) {
    return showConfirmFn(options)
  }
  return Promise.reject(new Error('Confirm provider not mounted'))
}

interface ConfirmProviderProps {
  children: React.ReactNode
  locale?: string
}

export function ConfirmProvider({
  children,
  locale = 'en-US',
}: ConfirmProviderProps) {
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
        <Dialog open={true} onClose={handleCancel} title={confirmState.title}>
          {confirmState.message && (
            <p
              className={`text-sm ${tw.text.light.secondary} ${tw.text.dark.secondary} mb-6`}
            >
              {confirmState.message}
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <DialogButton variant="text" onClick={handleCancel}>
              {confirmState.cancelText || BUILT_IN_TRANSLATIONS[locale].cancel}
            </DialogButton>
            <DialogButton onClick={handleConfirm}>
              {confirmState.confirmText ||
                BUILT_IN_TRANSLATIONS[locale].confirm}
            </DialogButton>
          </div>
        </Dialog>
      )}
    </>
  )
}
