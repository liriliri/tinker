import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Eye, Binary, Image } from 'lucide-react'
import { LoadingCircle } from 'share/components/Loading'
import {
  ToolbarButton,
  ToolbarButtonGroup,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { tw } from 'share/theme'
import store from '../store'
import TabBar from './TabBar'
import ResponseViewer from './ResponseViewer'
import fileSize from 'licia/fileSize'
import { getStatusColor } from '../../lib/util'

export default observer(function ResponsePanel() {
  const { t } = useTranslation()
  const { response, loading } = store

  const tabLabels: Record<string, string> = {
    body: t('responseBody'),
    headers: t('responseHeaders'),
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingCircle />
      </div>
    )
  }

  if (!response) {
    return (
      <div
        className={`flex-1 flex items-center justify-center text-xs ${tw.text.tertiary}`}
      >
        {t('sendPrompt')}
      </div>
    )
  }

  if (response.error) {
    return (
      <div className="flex-1 flex flex-col p-3">
        <div className="text-red-500 text-xs font-medium mb-1">
          {t('error')}
        </div>
        <div className={`text-xs ${tw.text.primary}`}>{response.error}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-3 pt-2">
        <TabBar
          tabs={TABS}
          activeTab={store.activeResponseTab}
          labels={tabLabels}
          onTabChange={(tab) =>
            store.setActiveResponseTab(tab as (typeof TABS)[number])
          }
          right={
            <div className="flex items-center gap-3 text-xs">
              {store.activeResponseTab === 'body' && <BodyModeToggle />}
              <span
                className={`font-medium ${getStatusColor(response.status)}`}
              >
                {response.status} {response.statusText}
              </span>
              <span className={tw.text.tertiary}>{response.duration}ms</span>
              <span className={tw.text.tertiary}>
                {fileSize(response.size)}
              </span>
            </div>
          }
        />
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        {store.activeResponseTab === 'body' && <ResponseViewer />}

        {store.activeResponseTab === 'headers' && (
          <div className="p-3">
            <table className="w-full text-xs">
              <tbody>
                {Object.entries(response.headers).map(([key, value]) => (
                  <tr key={key} className={`border-b ${tw.border}`}>
                    <td
                      className={`py-1.5 pr-3 font-medium ${tw.text.secondary} whitespace-nowrap align-top`}
                    >
                      {key}
                    </td>
                    <td
                      className={`py-1.5 ${tw.text.primary} break-all font-mono`}
                    >
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
})

const TABS = ['body', 'headers'] as const

const BodyModeToggle = observer(function BodyModeToggle() {
  const { t } = useTranslation()
  const mode = store.effectiveBodyMode
  const isAuto = store.responseBodyMode === 'auto'
  const isImage = store.isImageResponse

  const PreviewIcon = isImage ? Image : Eye

  return (
    <ToolbarButtonGroup>
      <ToolbarButton
        className={`rounded-none rounded-l border-r ${tw.border}`}
        variant="toggle"
        active={mode === 'preview'}
        onClick={() =>
          store.setResponseBodyMode(
            isAuto && mode === 'preview' ? 'auto' : 'preview'
          )
        }
        title={t('preview')}
      >
        <PreviewIcon size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        className="rounded-none rounded-r"
        variant="toggle"
        active={mode === 'hex'}
        onClick={() =>
          store.setResponseBodyMode(isAuto && mode === 'hex' ? 'auto' : 'hex')
        }
        title={t('hexMode')}
      >
        <Binary size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
    </ToolbarButtonGroup>
  )
})
