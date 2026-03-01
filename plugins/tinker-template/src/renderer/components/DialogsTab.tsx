import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { tw } from 'share/theme'
import { alert } from 'share/components/Alert'
import { confirm } from 'share/components/Confirm'
import { prompt } from 'share/components/Prompt'

export default observer(function DialogsTab() {
  const { t } = useTranslation()

  const handleAlert = async () => {
    await alert({ title: t('alertTitle'), message: t('alertMessage') })
  }

  const handleConfirm = async () => {
    const result = await confirm({
      title: t('confirmTitle'),
      message: t('confirmMessage'),
    })
    if (result) {
      toast.success(t('confirmYes'))
    } else {
      toast(t('confirmNo'))
    }
  }

  const handlePrompt = async () => {
    const value = await prompt({
      title: t('promptTitle'),
      message: t('promptMessage'),
      placeholder: t('promptPlaceholder'),
    })
    if (value) {
      toast.success(`${t('promptResult')}: ${value}`)
    }
  }

  const handleToastSuccess = () => toast.success(t('toastSuccess'))
  const handleToastError = () => toast.error(t('toastError'))
  const handleToastInfo = () => toast(t('toastInfo'))

  return (
    <div className="space-y-4">
      <section
        className={`rounded-lg p-5 border ${tw.border} ${tw.bg.secondary}`}
      >
        <h2 className={`text-sm font-semibold mb-4 ${tw.text.secondary}`}>
          {t('alertDemo')}
        </h2>
        <p className={`text-xs mb-4 ${tw.text.tertiary}`}>{t('alertDesc')}</p>
        <button
          onClick={handleAlert}
          className={`px-3 py-1.5 text-xs rounded ${tw.primary.bg} ${tw.primary.bgHover} text-white`}
        >
          {t('showAlert')}
        </button>
      </section>

      <section
        className={`rounded-lg p-5 border ${tw.border} ${tw.bg.secondary}`}
      >
        <h2 className={`text-sm font-semibold mb-4 ${tw.text.secondary}`}>
          {t('confirmDemo')}
        </h2>
        <p className={`text-xs mb-4 ${tw.text.tertiary}`}>{t('confirmDesc')}</p>
        <button
          onClick={handleConfirm}
          className={`px-3 py-1.5 text-xs rounded ${tw.primary.bg} ${tw.primary.bgHover} text-white`}
        >
          {t('showConfirm')}
        </button>
      </section>

      <section
        className={`rounded-lg p-5 border ${tw.border} ${tw.bg.secondary}`}
      >
        <h2 className={`text-sm font-semibold mb-4 ${tw.text.secondary}`}>
          {t('promptDemo')}
        </h2>
        <p className={`text-xs mb-4 ${tw.text.tertiary}`}>{t('promptDesc')}</p>
        <button
          onClick={handlePrompt}
          className={`px-3 py-1.5 text-xs rounded ${tw.primary.bg} ${tw.primary.bgHover} text-white`}
        >
          {t('showPrompt')}
        </button>
      </section>

      <section
        className={`rounded-lg p-5 border ${tw.border} ${tw.bg.secondary}`}
      >
        <h2 className={`text-sm font-semibold mb-4 ${tw.text.secondary}`}>
          {t('toastDemo')}
        </h2>
        <p className={`text-xs mb-4 ${tw.text.tertiary}`}>{t('toastDesc')}</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleToastSuccess}
            className="px-3 py-1.5 text-xs rounded bg-green-600 hover:bg-green-700 text-white"
          >
            {t('toastShowSuccess')}
          </button>
          <button
            onClick={handleToastError}
            className="px-3 py-1.5 text-xs rounded bg-red-600 hover:bg-red-700 text-white"
          >
            {t('toastShowError')}
          </button>
          <button
            onClick={handleToastInfo}
            className={`px-3 py-1.5 text-xs rounded ${tw.bg.select} ${tw.hover} border ${tw.border} ${tw.text.primary}`}
          >
            {t('toastShowInfo')}
          </button>
        </div>
      </section>
    </div>
  )
})
