import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import Select from 'share/components/Select'
import Checkbox from 'share/components/Checkbox'
import store from '../store'
import Section, { SettingItem } from './Section'

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

  const handleLanguageChange = async (value: string) => {
    await store.setLanguage(value)
    toast(t('restartRequired'))
  }

  const handleNativeTitlebarChange = async (value: boolean) => {
    await store.setUseNativeTitlebar(value)
    toast(t('restartRequired'))
  }

  return (
    <Section title={t('appearance')}>
      <SettingItem label={t('theme')}>
        <Select
          value={store.theme}
          onChange={(value) => store.setTheme(value)}
          options={themeOptions}
        />
      </SettingItem>
      <SettingItem label={t('language')}>
        <Select
          value={store.language}
          onChange={handleLanguageChange}
          options={languageOptions}
        />
      </SettingItem>
      <SettingItem label={t('useNativeTitlebar')}>
        <Checkbox
          checked={store.useNativeTitlebar}
          onChange={handleNativeTitlebarChange}
        />
      </SettingItem>
    </Section>
  )
})
