import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { tw } from 'share/theme'

export default function RenderingBadge() {
  const { t } = useTranslation()

  return (
    <div
      className={`absolute top-3 right-3 z-10 flex items-center gap-2 px-2 py-1 rounded text-xs border ${tw.bg.primary} ${tw.text.secondary} ${tw.border}`}
    >
      <Loader2 size={14} className="animate-spin" />
      <span>{t('rendering')}</span>
    </div>
  )
}
