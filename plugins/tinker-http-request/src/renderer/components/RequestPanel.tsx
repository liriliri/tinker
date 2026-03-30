import { useRef, useEffect, useState, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import Select from 'share/components/Select'
import { tw, THEME_COLORS } from 'share/theme'
import store from '../store'
import KeyValueEditor from './KeyValueEditor'
import type { BodyType } from '../../common/types'

const TABS = ['params', 'headers', 'body'] as const

export default observer(function RequestPanel() {
  const { t } = useTranslation()
  const tabsRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  const updateIndicator = useCallback(() => {
    const activeEl = tabRefs.current[store.activeRequestTab]
    const container = tabsRef.current
    if (activeEl && container) {
      const containerRect = container.getBoundingClientRect()
      const tabRect = activeEl.getBoundingClientRect()
      setIndicatorStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      })
    }
  }, [])

  useEffect(() => {
    updateIndicator()
  }, [store.activeRequestTab, updateIndicator])

  const bodyTypeOptions: { label: string; value: BodyType }[] = [
    { label: t('bodyNone'), value: 'none' },
    { label: 'JSON', value: 'json' },
    { label: 'Form URL Encoded', value: 'form-urlencoded' },
    { label: 'Form Data', value: 'form-data' },
    { label: 'Raw', value: 'raw' },
  ]

  const tabLabels: Record<string, string> = {
    params: t('params'),
    headers: t('headers'),
    body: t('body'),
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 px-3">
      <div ref={tabsRef} className={`relative flex border-b ${tw.border}`}>
        {TABS.map((tab) => (
          <button
            key={tab}
            ref={(el) => {
              tabRefs.current[tab] = el
            }}
            onClick={() => store.setActiveRequestTab(tab)}
            className={`px-3 py-1.5 text-xs transition-colors ${
              store.activeRequestTab === tab
                ? tw.primary.text
                : `${tw.text.secondary} ${tw.hover}`
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
        <div
          className="absolute bottom-0 h-0.5"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            backgroundColor: THEME_COLORS.primary,
            transition: 'left 0.25s ease, width 0.25s ease',
          }}
        />
      </div>

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
          <div className="flex flex-col gap-3 flex-1 min-h-0">
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
      </div>
    </div>
  )
})
