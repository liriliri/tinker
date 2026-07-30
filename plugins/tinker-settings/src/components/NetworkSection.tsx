import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Select from 'share/components/Select'
import TextInput from 'share/components/TextInput'
import store from '../store'
import Section, { SettingItem } from './Section'

export default observer(function NetworkSection() {
  const { t } = useTranslation()

  const proxyModeOptions = useMemo(
    () => [
      { label: t('proxyDirect'), value: 'direct' },
      { label: t('proxySystem'), value: 'system' },
      { label: t('proxyManual'), value: 'fixed_servers' },
    ],
    [t]
  )

  return (
    <Section title={t('network')}>
      <SettingItem label={t('proxyMode')}>
        <Select
          value={store.proxyMode}
          onChange={(value) => store.setProxyMode(value)}
          options={proxyModeOptions}
          className="w-full"
        />
      </SettingItem>
      <SettingItem label={t('proxyHost')}>
        <TextInput
          value={store.proxyHost}
          onChange={(e) => (store.proxyHost = e.target.value)}
          onBlur={() => store.setProxyHost(store.proxyHost)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              store.setProxyHost(store.proxyHost)
            }
          }}
          placeholder="http://127.0.0.1:7890"
          disabled={store.proxyMode !== 'fixed_servers'}
        />
      </SettingItem>
    </Section>
  )
})
