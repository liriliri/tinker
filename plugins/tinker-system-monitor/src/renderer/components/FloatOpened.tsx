import { useTranslation } from 'react-i18next'
import { PictureInPicture2 } from 'lucide-react'
import { tw } from 'share/theme'

export default function FloatOpened() {
  const { t } = useTranslation()

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6">
      <PictureInPicture2
        size={32}
        className={tw.text.tertiary}
        strokeWidth={1.5}
      />
      <p className={`text-sm font-medium ${tw.text.primary}`}>
        {t('floatOpened')}
      </p>
      <p className={`text-xs ${tw.text.secondary} text-center`}>
        {t('floatOpenedHint')}
      </p>
    </div>
  )
}
