import React, { useState } from 'react'
import Dialog from './Dialog'

export interface PromptOptions {
  title: string
  message?: string
  defaultValue?: string
  placeholder?: string
  confirmText?: string
  cancelText?: string
}

let showPromptFn: ((options: PromptOptions) => Promise<string | null>) | null =
  null

export function prompt(options: PromptOptions): Promise<string | null> {
  if (showPromptFn) {
    return showPromptFn(options)
  }
  return Promise.reject(new Error('Prompt provider not mounted'))
}

export function PromptProvider({ children }: { children: React.ReactNode }) {
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
        <Dialog
          open={true}
          onClose={handleCancel}
          title={promptState.title}
        >
          {promptState.message && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              {promptState.message}
            </p>
          )}
          <input
            type="text"
            className="w-full px-3 py-2 mb-6 border border-[#e0e0e0] dark:border-[#4a4a4a] rounded bg-white dark:bg-[#252526] text-gray-800 dark:text-gray-200 focus:outline-none"
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
              {promptState.cancelText || '取消'}
            </button>
            <button
              className="px-4 py-2 text-sm bg-[#0fc25e] hover:bg-[#0db350] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleConfirm}
              disabled={!inputValue.trim()}
            >
              {promptState.confirmText || '确定'}
            </button>
          </div>
        </Dialog>
      )}
    </>
  )
}
