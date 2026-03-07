import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { RefreshCw, Rss } from 'lucide-react'
import { confirm } from 'share/components/Confirm'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function SourceList() {
  const { t } = useTranslation()

  const handleSourceContextMenu = (e: React.MouseEvent, sourceId: string) => {
    e.preventDefault()
    tinker.showContextMenu(e.clientX, e.clientY, [
      {
        label: t('refreshFeed'),
        click: () => store.refreshSource(sourceId),
      },
      {
        label: t('markAllRead'),
        click: () => {
          store.setSelectedSource(sourceId)
          store.markAllRead()
        },
      },
      { type: 'separator' },
      {
        label: t('deleteFeed'),
        click: async () => {
          const ok = await confirm({
            title: t('deleteFeed'),
            message: t('deleteFeedConfirm'),
          })
          if (ok) await store.deleteSource(sourceId)
        },
      },
    ])
  }

  return (
    <div
      className={`flex flex-col h-full border-r ${tw.border} ${tw.bg.tertiary}`}
    >
      <button
        className={`flex items-center gap-2 px-3 py-2 text-left w-full shrink-0 ${
          tw.hover
        } ${store.selectedSourceId === null ? tw.active : ''}`}
        onClick={() => store.setSelectedSource(null)}
      >
        <Rss size={13} className={tw.primary.text} />
        <span className={`flex-1 text-sm ${tw.text.primary}`}>
          {t('allFeeds')}
        </span>
        {store.totalUnread > 0 && (
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full ${tw.primary.bg} text-white leading-none`}
          >
            {store.totalUnread}
          </span>
        )}
      </button>

      <div className="flex-1 overflow-y-auto">
        {store.sources.map((source) => (
          <button
            key={source.id}
            className={`flex items-center gap-2 px-3 py-2 text-left w-full ${
              tw.hover
            } ${store.selectedSourceId === source.id ? tw.active : ''}`}
            onClick={() => store.setSelectedSource(source.id)}
            onContextMenu={(e) => handleSourceContextMenu(e, source.id)}
          >
            <Rss size={13} className={tw.text.tertiary} />
            <span className={`flex-1 text-sm truncate ${tw.text.primary}`}>
              {source.name}
            </span>
            {store.refreshing[source.id] ? (
              <RefreshCw
                size={11}
                className={`animate-spin shrink-0 ${tw.text.tertiary}`}
              />
            ) : (
              source.unreadCount > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${tw.primary.bg} text-white leading-none shrink-0`}
                >
                  {source.unreadCount}
                </span>
              )
            )}
          </button>
        ))}

        {store.sources.length === 0 && (
          <div className={`px-3 py-6 text-xs text-center ${tw.text.tertiary}`}>
            {t('noFeeds')}
          </div>
        )}
      </div>
    </div>
  )
})
