import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { RefreshCw, Rss } from 'lucide-react'
import { confirm } from 'share/components/Confirm'
import NavList, { type NavListItem } from 'share/components/NavList'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function SourceList() {
  const { t } = useTranslation()

  const allFeedsItem: NavListItem = {
    id: '__all__',
    icon: Rss,
    iconClassName: tw.primary.text,
    label: t('allFeeds'),
    suffix:
      store.totalUnread > 0 ? (
        <span
          className={`text-xs px-1.5 py-0.5 rounded-full ${tw.primary.bg} text-white leading-none`}
        >
          {store.totalUnread}
        </span>
      ) : undefined,
  }

  const sourceItems: NavListItem[] = store.sources.map((source) => ({
    id: source.id,
    icon: Rss,
    iconClassName: tw.text.tertiary,
    label: source.name,
    suffix: store.refreshing[source.id] ? (
      <RefreshCw
        size={11}
        className={`animate-spin shrink-0 ${tw.text.tertiary}`}
      />
    ) : source.unreadCount > 0 ? (
      <span
        className={`text-xs px-1.5 py-0.5 rounded-full ${tw.primary.bg} text-white leading-none shrink-0`}
      >
        {source.unreadCount}
      </span>
    ) : undefined,
    menu: () => [
      {
        label: t('refreshFeed'),
        click: () => store.refreshSource(source.id),
      },
      {
        label: t('markAllRead'),
        click: () => {
          store.setSelectedSource(source.id)
          store.markAllRead()
        },
      },
      { type: 'separator' as const },
      {
        label: t('deleteFeed'),
        click: async () => {
          const ok = await confirm({
            title: t('deleteFeed'),
            message: t('deleteFeedConfirm'),
          })
          if (ok) await store.deleteSource(source.id)
        },
      },
    ],
  }))

  const activeId =
    store.selectedSourceId === null ? '__all__' : store.selectedSourceId

  const handleSelect = (id: string) => {
    store.setSelectedSource(id === '__all__' ? null : id)
  }

  return (
    <div
      className={`flex flex-col h-full border-r ${tw.border} ${tw.bg.tertiary}`}
    >
      <NavList
        items={[allFeedsItem]}
        activeId={activeId}
        onSelect={handleSelect}
        iconSize={13}
        className="shrink-0"
      />

      <div className="flex-1 overflow-y-auto">
        {store.sources.length === 0 ? (
          <div className={`px-3 py-6 text-xs text-center ${tw.text.tertiary}`}>
            {t('noFeeds')}
          </div>
        ) : (
          <NavList
            items={sourceItems}
            activeId={activeId}
            onSelect={handleSelect}
            iconSize={13}
          />
        )}
      </div>
    </div>
  )
})
