import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import store from '../store'
import ClipboardItem from './ClipboardItem'
import { tw } from 'share/theme'
import { useInfiniteScroll } from '../lib/useInfiniteScroll'

export default observer(function ClipboardList() {
  const { t } = useTranslation()

  // Infinite scroll
  useInfiniteScroll({
    onLoadMore: () => store.loadMore(),
    hasMore: store.hasMore,
  })

  const handleCopy = async (item: (typeof store.items)[0]) => {
    try {
      if (item.type === 'text') {
        clipboard.writeText(item.data)
      } else if (item.type === 'image') {
        clipboard.writeImage(item.data)
      }
      toast.success(t('copied'))
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error(t('copyFailed'))
    }
  }

  const handleDelete = (id: string) => {
    store.removeItem(id)
  }

  const filteredItems = store.filteredItems

  return (
    <div className="flex-1 overflow-y-auto">
      {filteredItems.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className={`text-sm ${tw.text.both.tertiary}`}>
            {store.items.length === 0 ? t('noItems') : t('noResults')}
          </div>
        </div>
      ) : (
        <div>
          {filteredItems.map((item) => (
            <ClipboardItem
              key={item.id}
              item={item}
              onCopy={() => handleCopy(item)}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
          {store.hasMore && (
            <div
              className={`text-center py-4 text-xs ${tw.text.both.tertiary}`}
            >
              {t('loadingMore')}
            </div>
          )}
        </div>
      )}
    </div>
  )
})
