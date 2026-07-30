import { Children, Fragment, KeyboardEvent, ReactNode } from 'react'
import { tw } from 'share/theme'

interface SectionProps {
  title: string
  children: ReactNode
}

export default function Section({ title, children }: SectionProps) {
  const items = Children.toArray(children)

  return (
    <div>
      <h2 className={`text-sm font-semibold mb-2 px-1 ${tw.text.secondary}`}>
        {title}
      </h2>
      <section className={`rounded-md border ${tw.border} ${tw.bg.secondary}`}>
        {items.map((child, i) => (
          <Fragment key={i}>
            {i > 0 && <div className={`h-px ${tw.bg.border}`} />}
            {child}
          </Fragment>
        ))}
      </section>
    </div>
  )
}

interface SettingItemProps {
  label: string
  children: ReactNode
}

/** Match Select / ShortcutInput height inside setting rows. */
export const SETTING_INPUT_CLASS =
  'h-full !box-border !px-2 !py-0 !text-xs !leading-none'

export function commitOnEnterOrBlur(commit: () => void) {
  return {
    onBlur: commit,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter') commit()
    },
  }
}

export function SettingItem({ label, children }: SettingItemProps) {
  return (
    <div className="flex h-10 items-center justify-between gap-3 px-3">
      <label className={`shrink-0 text-sm ${tw.text.primary}`}>{label}</label>
      <div className="flex h-6 w-56 shrink-0 items-center justify-end [&>*]:h-full [&>*]:min-h-0 [&>*]:box-border">
        {children}
      </div>
    </div>
  )
}
