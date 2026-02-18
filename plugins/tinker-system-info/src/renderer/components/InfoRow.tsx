import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { tw } from 'share/theme'

interface InfoRowProps {
  label: string | React.ReactNode
  value: string | number
}

export default observer(function InfoRow({ label, value }: InfoRowProps) {
  const { t } = useTranslation()

  const handleValueClick = async () => {
    try {
      await navigator.clipboard.writeText(String(value))
      toast.success(t('copySuccess'))
    } catch (err) {
      console.error('Failed to copy:', err)
      toast.error(t('copyFailed'))
    }
  }

  return (
    <div className="px-4 last:[&>div]:border-b-0">
      <div
        className={`flex items-center justify-between py-2 ${tw.border} border-b`}
      >
        <span className={`text-sm ${tw.text.secondary}`}>{label}</span>
        <span
          onClick={handleValueClick}
          className={`text-sm ${tw.text.primary} ${tw.primary.textHover} cursor-pointer transition-colors`}
          title={t('clickToCopy')}
        >
          {value}
        </span>
      </div>
    </div>
  )
})
