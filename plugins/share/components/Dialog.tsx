import React, { Fragment, ReactNode } from 'react'
import {
  Dialog as HeadlessDialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react'
import { X } from 'lucide-react'
import { tw } from '../theme'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
  showClose?: boolean
}

export interface DialogButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'text'
}

export default function Dialog({
  open,
  onClose,
  title,
  children,
  className = '',
  showClose = false,
}: DialogProps) {
  return (
    <Transition appear show={open} as={Fragment}>
      <HeadlessDialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel
                className={`max-h-[90vh] flex flex-col transform rounded-lg ${
                  tw.bg.secondary
                } shadow-xl transition-all ${className || 'w-full max-w-md'}`}
              >
                <div className="p-6 pb-2 flex-shrink-0">
                  {title && !showClose && (
                    <DialogTitle
                      as="h3"
                      className="text-lg font-semibold text-gray-800 dark:text-gray-200"
                    >
                      {title}
                    </DialogTitle>
                  )}
                  {title && showClose && (
                    <div className="flex items-center justify-between">
                      <DialogTitle
                        as="h3"
                        className="text-lg font-semibold text-gray-800 dark:text-gray-200"
                      >
                        {title}
                      </DialogTitle>
                      <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  {!title && showClose && (
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-6 pt-4 overflow-y-auto flex-1 min-h-0">
                  {children}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  )
}

export const DialogButton = ({
  variant = 'primary',
  className = '',
  type = 'button',
  ...rest
}: DialogButtonProps) => {
  const baseClassName = 'px-4 py-2 text-sm'
  const variantClassName =
    variant === 'primary'
      ? `${tw.primary.bg} ${tw.primary.bgHover} text-white rounded disabled:opacity-50 disabled:cursor-not-allowed`
      : `${tw.bg.tertiary} ${tw.hover} ${tw.text.secondary} rounded`
  const combinedClassName =
    `${baseClassName} ${variantClassName} ${className}`.trim()

  return <button type={type} className={combinedClassName} {...rest} />
}
