import { Children, Fragment, ReactNode } from 'react'
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
      <section className={`rounded-lg border ${tw.border} ${tw.bg.secondary}`}>
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

export function SettingItem({ label, children }: SettingItemProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <label className={`text-sm ${tw.text.primary}`}>{label}</label>
      {children}
    </div>
  )
}
