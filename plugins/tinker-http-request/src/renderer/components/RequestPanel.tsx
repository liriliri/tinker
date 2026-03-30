import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Editor } from '@monaco-editor/react'
import Select from 'share/components/Select'
import { tw } from 'share/theme'
import store from '../store'
import TabBar from './TabBar'
import KeyValueEditor from './KeyValueEditor'
import type { BodyType } from '../../common/types'

const TABS = ['params', 'headers', 'body'] as const

const BASE_EDITOR_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 12,
  lineNumbers: 'on' as const,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  wordWrap: 'on' as const,
}

const JSON_EDITOR_OPTIONS = {
  ...BASE_EDITOR_OPTIONS,
  formatOnPaste: true,
  formatOnType: true,
}

const TEXT_EDITOR_OPTIONS = BASE_EDITOR_OPTIONS

export default observer(function RequestPanel() {
  const { t } = useTranslation()

  const bodyTypeOptions: { label: string; value: BodyType }[] = [
    { label: t('bodyNone'), value: 'none' },
    { label: 'JSON', value: 'json' },
    { label: 'URL Encoded', value: 'form-urlencoded' },
    { label: 'Text', value: 'text' },
  ]

  const tabLabels: Record<string, string> = {
    params: t('params'),
    headers: t('headers'),
    body: t('body'),
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 px-3">
      <TabBar
        tabs={TABS}
        activeTab={store.activeRequestTab}
        labels={tabLabels}
        onTabChange={(tab) =>
          store.setActiveRequestTab(tab as (typeof TABS)[number])
        }
        right={
          store.activeRequestTab === 'body' ? (
            <Select
              value={store.bodyType}
              onChange={(val) => store.setBodyType(val as BodyType)}
              options={bodyTypeOptions}
              className="w-28 h-7"
            />
          ) : undefined
        }
      />

      <div className="flex-1 flex flex-col min-h-0 py-3">
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
          <div className="flex flex-col flex-1 min-h-0">
            {store.bodyType === 'none' && (
              <div
                className={`flex-1 flex items-center justify-center text-xs ${tw.text.tertiary}`}
              >
                {t('noBody')}
              </div>
            )}

            {(store.bodyType === 'json' || store.bodyType === 'text') && (
              <div
                className={`flex-1 min-h-0 border ${tw.border} rounded overflow-hidden`}
              >
                <Editor
                  value={store.body}
                  language={store.bodyType === 'json' ? 'json' : 'plaintext'}
                  onChange={(value) => store.setBody(value || '')}
                  options={
                    store.bodyType === 'json'
                      ? JSON_EDITOR_OPTIONS
                      : TEXT_EDITOR_OPTIONS
                  }
                  theme={store.isDark ? 'vs-dark' : 'vs'}
                />
              </div>
            )}

            {store.bodyType === 'form-urlencoded' && (
              <KeyValueEditor
                items={store.formData}
                onUpdate={(i, f, v) => store.updatePair('formData', i, f, v)}
                onAdd={() => store.addPair('formData')}
                onRemove={(i) => store.removePair('formData', i)}
                keyPlaceholder={t('formKey')}
                valuePlaceholder={t('formValue')}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
})
