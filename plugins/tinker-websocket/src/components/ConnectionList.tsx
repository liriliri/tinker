import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Clock, Eraser, ListX, Loader2, Plus, Unlink, Wifi } from 'lucide-react'
import { tw } from 'share/theme'
import {
  Toolbar,
  ToolbarButton,
  ToolbarLabel,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import OverlayScrollbars from 'share/components/OverlayScrollbars'
import { prompt } from 'share/components/Prompt'
import store from '../store'
import { isValidWsUrl, shortUrl } from '../lib/format'
import type { ConnectionStatus } from '../types'

function statusColor(status: ConnectionStatus): string {
  switch (status) {
    case 'open':
      return 'bg-green-500'
    case 'connecting':
    case 'closing':
      return 'bg-yellow-500'
    case 'error':
      return 'bg-red-500'
    default:
      return 'bg-gray-400'
  }
}

export default observer(function ConnectionList() {
  const { t } = useTranslation()

  const handleNewConnection = async () => {
    const url = await prompt({
      title: t('newConnection'),
      placeholder: t('urlPlaceholder'),
      defaultValue: store.url || 'ws://',
      confirmText: t('connect'),
    })
    if (!url) return
    if (!isValidWsUrl(url.trim())) return
    store.connect(url.trim())
  }

  const handleConnectionContextMenu = (
    e: React.MouseEvent,
    id: string,
    canDisconnect: boolean
  ) => {
    e.preventDefault()
    e.stopPropagation()
    store.selectConnection(id)
    tinker.showContextMenu(e.clientX, e.clientY, [
      {
        label: t('disconnect'),
        enabled: canDisconnect,
        click: () => store.disconnect(id),
      },
      {
        label: t('remove'),
        click: () => store.removeConnection(id),
      },
    ])
  }

  return (
    <div className="h-full flex flex-col">
      <Toolbar>
        <Wifi size={TOOLBAR_ICON_SIZE} className={tw.text.secondary} />
        <ToolbarLabel>{t('connections')}</ToolbarLabel>
        <ToolbarSpacer />
        <ToolbarButton onClick={handleNewConnection} title={t('newConnection')}>
          <Plus size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => store.disconnectAll()}
          title={t('disconnectAll')}
          disabled={!store.hasActiveConnections}
        >
          <Unlink size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => store.removeAllConnections()}
          title={t('removeAll')}
          disabled={store.connections.length === 0}
        >
          <ListX size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </Toolbar>

      <div className="min-h-0 flex-1 flex flex-col">
        <OverlayScrollbars
          defer
          className={`min-h-0 flex-1 border-b ${tw.border}`}
        >
          {store.connections.length === 0 ? (
            <p
              className={`h-full flex items-center justify-center px-3 text-xs ${tw.text.tertiary}`}
            >
              {t('noConnections')}
            </p>
          ) : (
            store.connections.map((conn) => {
              const selected = conn.id === store.selectedConnectionId
              const canDisconnect =
                conn.status === 'open' ||
                conn.status === 'connecting' ||
                conn.status === 'closing'
              return (
                <div
                  key={conn.id}
                  className={`flex items-center gap-2 h-10 px-3 cursor-pointer border-b ${
                    tw.border
                  } ${selected ? tw.primary.bgFocused : tw.hover}`}
                  onClick={() => store.selectConnection(conn.id)}
                  onContextMenu={(e) =>
                    handleConnectionContextMenu(e, conn.id, canDisconnect)
                  }
                >
                  <div className="flex-shrink-0 w-2.5 h-2.5 flex items-center justify-center">
                    {conn.status === 'connecting' ||
                    conn.status === 'closing' ? (
                      <Loader2
                        size={10}
                        className={`animate-spin ${tw.primary.text}`}
                      />
                    ) : (
                      <span
                        className={`block w-2 h-2 rounded-full ${statusColor(
                          conn.status
                        )}`}
                      />
                    )}
                  </div>
                  <div
                    className={`flex-1 min-w-0 text-xs font-medium truncate ${tw.text.primary}`}
                    title={conn.url}
                  >
                    {shortUrl(conn.url)}
                  </div>
                </div>
              )
            })
          )}
        </OverlayScrollbars>

        <div className="min-h-0 flex-1 flex flex-col">
          <Toolbar>
            <Clock size={TOOLBAR_ICON_SIZE} className={tw.text.secondary} />
            <ToolbarLabel>{t('urlHistory')}</ToolbarLabel>
            <ToolbarSpacer />
            <ToolbarButton
              onClick={() => store.clearUrlHistory()}
              title={t('clearHistory')}
              disabled={store.urlHistory.length === 0}
            >
              <Eraser size={TOOLBAR_ICON_SIZE} />
            </ToolbarButton>
          </Toolbar>
          <OverlayScrollbars defer className="min-h-0 flex-1">
            {store.urlHistory.length === 0 ? (
              <p
                className={`h-full flex items-center justify-center px-3 text-xs ${tw.text.tertiary}`}
              >
                {t('noUrlHistory')}
              </p>
            ) : (
              store.urlHistory.map((url) => (
                <button
                  key={url}
                  type="button"
                  className={`w-full text-left px-3 py-1.5 text-xs truncate ${tw.text.secondary} ${tw.hover}`}
                  title={url}
                  onClick={() => store.connect(url)}
                >
                  {url}
                </button>
              ))
            )}
          </OverlayScrollbars>
        </div>
      </div>
    </div>
  )
})
