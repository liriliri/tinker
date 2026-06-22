import { forwardRef, useMemo, type ReactNode } from 'react'
import {
  OverlayScrollbarsComponent,
  type OverlayScrollbarsComponentProps,
  type OverlayScrollbarsComponentRef,
} from 'overlayscrollbars-react'
import type { OverlayScrollbars as OverlayScrollbarsInstance } from 'overlayscrollbars'

export type { OverlayScrollbarsComponentRef as OverlayScrollbarsRef }

const DEFAULT_OPTIONS: OverlayScrollbarsComponentProps['options'] = {
  scrollbars: {
    autoHide: 'leave',
    autoHideDelay: 400,
    theme: 'os-theme-tinker',
  },
}

export interface OverlayScrollbarsProps {
  className?: string
  children?: ReactNode
  defer?: OverlayScrollbarsComponentProps['defer']
  options?: OverlayScrollbarsComponentProps['options']
  onViewportChange?: (viewport: HTMLElement | null) => void
}

const OverlayScrollbars = forwardRef<
  OverlayScrollbarsComponentRef,
  OverlayScrollbarsProps
>(function OverlayScrollbars(
  { className, children, defer, options, onViewportChange },
  ref
) {
  const events = useMemo(
    () =>
      onViewportChange
        ? {
            initialized: (instance: OverlayScrollbarsInstance) => {
              onViewportChange(instance.elements().viewport)
            },
            destroyed: () => onViewportChange(null),
          }
        : undefined,
    [onViewportChange]
  )

  return (
    <OverlayScrollbarsComponent
      ref={ref}
      defer={defer}
      className={className}
      options={options ?? DEFAULT_OPTIONS}
      events={events}
    >
      {children}
    </OverlayScrollbarsComponent>
  )
})

export default OverlayScrollbars
