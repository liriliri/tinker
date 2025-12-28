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
  showCloseIcon?: boolean
}

export default function Dialog({
  open,
  onClose,
  title,
  children,
  className = '',
  showCloseIcon = false,
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
                className={`max-h-[90vh] flex flex-col transform rounded-lg ${tw.bg.light.primary} ${tw.bg.dark.secondary} shadow-xl transition-all ${className || 'w-full max-w-md'}`}
              >
                <div className="p-6 pb-0 flex-shrink-0">
                  {title && !showCloseIcon && (
                    <DialogTitle
                      as="h3"
                      className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200"
                    >
                      {title}
                    </DialogTitle>
                  )}
                  {title && showCloseIcon && (
                    <div className="flex items-center justify-between mb-4">
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
                  {!title && showCloseIcon && (
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
                <div className="px-6 pb-6 overflow-y-auto flex-1 min-h-0">
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
