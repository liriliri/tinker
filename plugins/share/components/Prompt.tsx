import React, { useState } from 'react'
import Dialog from './Dialog'
import { tw } from '../theme'

export interface PromptOptions {
  title: string
  message?: string
  defaultValue?: string
  placeholder?: string
  confirmText?: string
  cancelText?: string
  inputType?: 'text' | 'password'
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

let showPromptFn: ((options: PromptOptions) => Promise<string | null>) | null =
  null

export function prompt(options: PromptOptions): Promise<string | null> {
  if (showPromptFn) {
    return showPromptFn(options)
  }
  return Promise.reject(new Error('Prompt provider not mounted'))
}

interface PromptProviderProps {
  children: React.ReactNode
  locale?: string
}

export function PromptProvider({
  children,
  locale = 'en-US',
}: PromptProviderProps) {
  const [promptState, setPromptState] = useState<PromptOptions | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [resolver, setResolver] = useState<
    ((value: string | null) => void) | null
  >(null)

  showPromptFn = (options: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      setPromptState(options)
      setInputValue(options.defaultValue || '')
      setResolver(() => resolve)
    })
  }

  const handleConfirm = () => {
    if (resolver) {
      resolver(inputValue.trim() || null)
    }
    setPromptState(null)
    setInputValue('')
    setResolver(null)
  }

  const handleCancel = () => {
    if (resolver) {
      resolver(null)
    }
    setPromptState(null)
    setInputValue('')
    setResolver(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    }
  }

  return (
    <>
      {children}
      {promptState && (
        <Dialog open={true} onClose={handleCancel} title={promptState.title}>
          {promptState.message && (
            <p
              className={`text-sm ${tw.text.light.secondary} ${tw.text.dark.secondary} mb-3`}
            >
              {promptState.message}
            </p>
          )}
          <input
            type={promptState.inputType || 'text'}
            className={`w-full px-3 py-2 mb-6 border ${tw.border.both} rounded ${tw.bg.light.primary} ${tw.bg.dark.tertiary} ${tw.text.light.primary} ${tw.text.dark.primary} focus:outline-none`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={promptState.placeholder}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              onClick={handleCancel}
            >
              {promptState.cancelText || BUILT_IN_TRANSLATIONS[locale].cancel}
            </button>
            <button
              className={`px-4 py-2 text-sm ${tw.primary.bg} ${tw.primary.bgHover} text-white rounded disabled:opacity-50 disabled:cursor-not-allowed`}
              onClick={handleConfirm}
              disabled={!inputValue.trim()}
            >
              {promptState.confirmText || BUILT_IN_TRANSLATIONS[locale].confirm}
            </button>
          </div>
        </Dialog>
      )}
    </>
  )
}
