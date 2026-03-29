import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import Select from 'share/components/Select'
import { tw } from 'share/theme'
import store from '../store'
import KeyValueEditor from './KeyValueEditor'
import type { BodyType, AuthType } from '../../common/types'

const TABS = ['params', 'headers', 'body', 'auth'] as const

export default observer(function RequestPanel() {
  const { t } = useTranslation()

  const bodyTypeOptions: { label: string; value: BodyType }[] = [
    { label: t('bodyNone'), value: 'none' },
    { label: 'JSON', value: 'json' },
    { label: 'Form URL Encoded', value: 'form-urlencoded' },
    { label: 'Form Data', value: 'form-data' },
    { label: 'Raw', value: 'raw' },
  ]

  const authTypeOptions: { label: string; value: AuthType }[] = [
    { label: t('authNone'), value: 'none' },
    { label: 'Basic', value: 'basic' },
    { label: 'Bearer', value: 'bearer' },
  ]

  const tabLabels: Record<string, string> = {
    params: t('params'),
    headers: t('headers'),
    body: t('body'),
    auth: t('auth'),
  }

  const inputClass = `w-full px-2 py-1 text-xs border ${tw.border} rounded ${tw.bg.input} ${tw.text.primary} focus:outline-none focus:ring-1 ${tw.primary.focusRing}`

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className={`flex border-b ${tw.border}`}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => store.setActiveRequestTab(tab)}
            className={`px-3 py-1.5 text-xs transition-colors ${
              store.activeRequestTab === tab
                ? `${tw.primary.text} border-b-2 ${tw.primary.border}`
                : `${tw.text.secondary} ${tw.hover}`
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-3">
        {store.activeRequestTab === 'params' && (
          <KeyValueEditor
            items={store.params}
            onUpdate={(i, f, v) => store.updatePair('params', i, f, v)}
            onAdd={() => store.addPair('params')}
            onRemove={(i) => store.removePair('params', i)}
            keyPlaceholder={t('paramKey')}
            valuePlaceholder={t('paramValue')}
          />
        )}

        {store.activeRequestTab === 'headers' && (
          <KeyValueEditor
            items={store.headers}
            onUpdate={(i, f, v) => store.updatePair('headers', i, f, v)}
            onAdd={() => store.addPair('headers')}
            onRemove={(i) => store.removePair('headers', i)}
            keyPlaceholder={t('headerKey')}
            valuePlaceholder={t('headerValue')}
          />
        )}

        {store.activeRequestTab === 'body' && (
          <div className="flex flex-col gap-3">
            <Select
              value={store.bodyType}
              onChange={(val) => store.setBodyType(val as BodyType)}
              options={bodyTypeOptions}
              className="w-44 h-7"
            />

            {store.bodyType === 'none' && (
              <div className={`text-xs ${tw.text.tertiary}`}>{t('noBody')}</div>
            )}

            {(store.bodyType === 'json' || store.bodyType === 'raw') && (
              <textarea
                value={store.body}
                onChange={(e) => store.setBody(e.target.value)}
                placeholder={
                  store.bodyType === 'json'
                    ? t('jsonPlaceholder')
                    : t('rawPlaceholder')
                }
                className={`w-full h-40 px-3 py-2 text-xs font-mono border ${tw.border} rounded ${tw.bg.input} ${tw.text.primary} focus:outline-none focus:ring-1 ${tw.primary.focusRing} resize-y`}
              />
            )}

            {(store.bodyType === 'form-urlencoded' ||
              store.bodyType === 'form-data') && (
              <KeyValueEditor
                items={store.formData}
                onUpdate={(i, f, v) => store.updatePair('formData', i, f, v)}
                onAdd={() => store.addPair('formData')}
                onRemove={(i) => store.removePair('formData', i)}
              />
            )}
          </div>
        )}

        {store.activeRequestTab === 'auth' && (
          <div className="flex flex-col gap-3">
            <Select
              value={store.authType}
              onChange={(val) => store.setAuthType(val as AuthType)}
              options={authTypeOptions}
              className="w-32 h-7"
            />

            {store.authType === 'basic' && (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={store.authBasicUser}
                  onChange={(e) => store.setAuthBasicUser(e.target.value)}
                  placeholder={t('username')}
                  className={inputClass}
                />
                <input
                  type="password"
                  value={store.authBasicPass}
                  onChange={(e) => store.setAuthBasicPass(e.target.value)}
                  placeholder={t('password')}
                  className={inputClass}
                />
              </div>
            )}

            {store.authType === 'bearer' && (
              <input
                type="text"
                value={store.authBearerToken}
                onChange={(e) => store.setAuthBearerToken(e.target.value)}
                placeholder={t('token')}
                className={inputClass}
              />
            )}

            {store.authType === 'none' && (
              <div className={`text-xs ${tw.text.tertiary}`}>{t('noAuth')}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
})
