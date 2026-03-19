import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { tw } from 'share/theme'
import Select from 'share/components/Select'
import Checkbox from 'share/components/Checkbox'
import store from '../store'

export default observer(function AppearanceSection() {
  const { t } = useTranslation()

  const themeOptions = useMemo(
    () => [
      { label: t('sysPreference'), value: 'system' },
      { label: t('light'), value: 'light' },
      { label: t('dark'), value: 'dark' },
    ],
    [t]
  )

  const languageOptions = useMemo(
    () => [
      { label: t('sysPreference'), value: 'system' },
      { label: 'English', value: 'en-US' },
      { label: '中文', value: 'zh-CN' },
    ],
    [t]
  )

  const handleThemeChange = async (value: string) => {
    await store.setTheme(value)
  }

  const handleLanguageChange = async (value: string) => {
    await store.setLanguage(value)
    toast(t('restartRequired'))
  }

  const handleNativeTitlebarChange = async (value: boolean) => {
    await store.setUseNativeTitlebar(value)
    toast(t('restartRequired'))
  }

  return (
    <div>
      <h2 className={`text-sm font-semibold mb-2 px-1 ${tw.text.secondary}`}>
        {t('appearance')}
      </h2>
      <section className={`rounded-lg border ${tw.border} ${tw.bg.secondary}`}>
        <div className="flex items-center justify-between px-4 py-3">
          <label className={`text-sm ${tw.text.primary}`}>{t('theme')}</label>
          <Select
            value={store.theme}
            onChange={handleThemeChange}
            options={themeOptions}
          />
        </div>
        <div className={`h-px ${tw.bg.border}`} />
        <div className="flex items-center justify-between px-4 py-3">
          <label className={`text-sm ${tw.text.primary}`}>
            {t('language')}
          </label>
          <Select
            value={store.language}
            onChange={handleLanguageChange}
            options={languageOptions}
          />
        </div>
        <div className={`h-px ${tw.bg.border}`} />
        <div className="flex items-center justify-between px-4 py-3">
          <label className={`text-sm ${tw.text.primary}`}>
            {t('useNativeTitlebar')}
          </label>
          <Checkbox
            checked={store.useNativeTitlebar}
            onChange={handleNativeTitlebarChange}
          />
        </div>
      </section>
    </div>
  )
})
