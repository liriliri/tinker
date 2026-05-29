import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'

interface SectionDividerProps {
  labelKey: string
}

export default function SectionDivider({ labelKey }: SectionDividerProps) {
  const { t } = useTranslation()

  return (
    <div className="col-span-full flex items-center gap-2 py-0.5">
      <span
        className={`text-xs font-bold uppercase tracking-wider shrink-0 ${tw.text.tertiary}`}
      >
        {t(labelKey)}
      </span>
      <div className={`flex-1 h-px ${tw.border} border-t`} />
    </div>
  )
}
