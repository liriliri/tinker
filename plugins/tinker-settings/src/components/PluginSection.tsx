import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import TextInput from 'share/components/TextInput'
import Checkbox from 'share/components/Checkbox'
import { tw } from 'share/theme'
import store from '../store'
import Section, {
  SettingItem,
  SETTING_INPUT_CLASS,
  commitOnEnterOrBlur,
} from './Section'

export default observer(function PluginSection() {
  const { t } = useTranslation()
  const [clearing, setClearing] = useState(false)

  const handleClearCache = async () => {
    setClearing(true)
    try {
      await tinker.clearPluginCache()
      toast.success(t('clearCacheSuccess'))
    } catch {
      toast.error(t('clearCacheErr'))
    } finally {
      setClearing(false)
    }
  }

  return (
    <>
      <Section title={t('general')}>
        <SettingItem label={t('showMarketplace')}>
          <Checkbox
            checked={store.showMarketplace}
            onChange={(v) => store.setShowMarketplace(v)}
          />
        </SettingItem>
        <SettingItem label={t('pluginCache')}>
          <button
            type="button"
            onClick={handleClearCache}
            disabled={clearing}
            className={`px-2 text-xs rounded border ${tw.border} ${tw.hover} ${tw.text.primary} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {t('clear')}
          </button>
        </SettingItem>
      </Section>
      <Section title={t('npm')}>
        <SettingItem label={t('registry')}>
          <TextInput
            value={store.npmRegistry}
            onChange={(e) => (store.npmRegistry = e.target.value)}
            {...commitOnEnterOrBlur(() =>
              store.setNpmRegistry(store.npmRegistry)
            )}
            placeholder="https://registry.npmmirror.com"
            className={SETTING_INPUT_CLASS}
          />
        </SettingItem>
      </Section>
    </>
  )
})
