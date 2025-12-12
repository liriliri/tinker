import React, { Fragment, ReactNode } from 'react'
import {
  Dialog as HeadlessDialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

export default function Dialog({
  open,
  onClose,
  title,
  children,
  className = '',
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
          <div className="fixed inset-0 bg-black bg-opacity-50" />
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
                className={`w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-[#303133] p-6 shadow-xl transition-all ${className}`}
              >
                {title && (
                  <DialogTitle
                    as="h3"
                    className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200"
                  >
                    {title}
                  </DialogTitle>
                )}
                {children}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  )
}
