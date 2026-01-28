import React from 'react'
import { Toaster, DefaultToastOptions, ToastPosition } from 'react-hot-toast'
import { THEME_COLORS } from '../theme'

const DEFAULT_TOAST_OPTIONS: DefaultToastOptions = {
  style: {
    background: 'var(--toast-bg, #fff)',
    color: 'var(--toast-text, #333)',
  },
  success: {
    iconTheme: {
      primary: THEME_COLORS.primary,
      secondary: THEME_COLORS.bg.light.primary,
    },
  },
}

interface ToasterProviderProps {
  children: React.ReactNode
  position?: ToastPosition
  toastOptions?: DefaultToastOptions
}

export function ToasterProvider({
  children,
  position = 'top-center',
  toastOptions,
}: ToasterProviderProps) {
  const successIconTheme = toastOptions?.success?.iconTheme
  const mergedToastOptions: DefaultToastOptions = {
    ...DEFAULT_TOAST_OPTIONS,
    ...toastOptions,
    style: {
      ...DEFAULT_TOAST_OPTIONS.style,
      ...toastOptions?.style,
    },
    success: {
      ...DEFAULT_TOAST_OPTIONS.success,
      ...toastOptions?.success,
      ...(successIconTheme
        ? {
            iconTheme: {
              ...DEFAULT_TOAST_OPTIONS.success?.iconTheme,
              ...successIconTheme,
            },
          }
        : {}),
    },
  }

  return (
    <>
      {children}
      <Toaster position={position} toastOptions={mergedToastOptions} />
    </>
  )
}
