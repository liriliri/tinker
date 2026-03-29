import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import Select from 'share/components/Select'
import { tw } from 'share/theme'
import { ToolbarTextButton } from 'share/components/Toolbar'
import { LoadingCircle } from 'share/components/Loading'
import store from '../store'
import type { HttpMethod } from '../../common/types'

const METHOD_OPTIONS: { label: string; value: HttpMethod }[] = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'HEAD', value: 'HEAD' },
  { label: 'OPTIONS', value: 'OPTIONS' },
]

export default observer(function UrlBar() {
  const { t } = useTranslation()

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (store.loading) {
        store.abort()
      } else {
        store.send()
      }
    }
  }

  return (
    <div
      className={`flex items-center gap-2 p-2 border-b ${tw.border} ${tw.bg.secondary}`}
    >
      <Select
        value={store.method}
        onChange={(val) => store.setMethod(val as HttpMethod)}
        options={METHOD_OPTIONS}
        className="w-24 h-8"
      />
      <input
        type="text"
        value={store.url}
        onChange={(e) => store.setUrl(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('urlPlaceholder')}
        className={`flex-1 px-3 py-1.5 text-xs border ${tw.border} ${tw.primary.focusBorder} rounded ${tw.bg.input} ${tw.text.primary} focus:outline-none focus:ring-1 ${tw.primary.focusRing}`}
      />
      {store.loading ? (
        <ToolbarTextButton
          variant="secondary"
          onClick={() => store.abort()}
          className="flex items-center gap-1.5 h-8"
        >
          <LoadingCircle className="!w-3.5 !h-3.5 text-white" />
          {t('cancel')}
        </ToolbarTextButton>
      ) : (
        <ToolbarTextButton
          onClick={() => store.send()}
          disabled={!store.url.trim()}
          className="h-8"
        >
          {t('send')}
        </ToolbarTextButton>
      )}
    </div>
  )
})
