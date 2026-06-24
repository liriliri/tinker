import { ChevronDown } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import type { ReactNode } from 'react'
import { tw } from 'share/theme'
import store from '../store'
import type { AdjustSectionId } from '../types/adjustSections'

interface AdjustSectionProps {
  sectionId: AdjustSectionId
  title: string
  children: ReactNode
}

const AdjustSection = observer(function AdjustSection({
  sectionId,
  title,
  children,
}: AdjustSectionProps) {
  const open = store.sectionOpen[sectionId]

  return (
    <div className={`border-b last:border-b-0 ${tw.border}`}>
      <button
        type="button"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors ${tw.bg.secondary} ${tw.hover} ${tw.activeFeedback}`}
        onClick={() => store.setSectionOpen(sectionId, !open)}
      >
        <span
          className={`text-xs font-semibold uppercase tracking-wide ${tw.text.primary}`}
        >
          {title}
        </span>
        <ChevronDown
          className={`size-3.5 shrink-0 transition-transform duration-200 ${
            tw.text.secondary
          } ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="px-4 pb-4 pt-3">{children}</div>}
    </div>
  )
})

export default AdjustSection
