import { observer } from 'mobx-react-lite'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'

const CARD_GRID_STYLE: React.CSSProperties = {
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
}

function formatDate(ts: number): string {
  const diff = Date.now() - ts
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(diff / 86400000)
  if (days < 7) return `${days}d`
  return new Date(ts).toLocaleDateString()
}

export default observer(function ArticleList() {
  const { t } = useTranslation()

  return (
    <div className={`flex flex-col h-full border-r ${tw.border}`}>
      <div
        className={`flex-1 overflow-y-auto ${
          store.viewMode === 'card' ? 'p-3' : ''
        }`}
      >
        {store.filteredItems.length === 0 ? (
          <div
            className={`flex items-center justify-center h-32 text-sm ${tw.text.tertiary}`}
          >
            {t('noArticles')}
          </div>
        ) : store.viewMode === 'card' ? (
          <div className="grid gap-3" style={CARD_GRID_STYLE}>
            {store.filteredItems.map((item) => (
              <button
                key={item.id}
                className={`text-left rounded overflow-hidden border ${
                  tw.border
                } ${tw.hover} ${
                  store.selectedItemId === item.id ? tw.active : ''
                }`}
                onClick={() => store.setSelectedItem(item.id)}
              >
                {item.thumb && (
                  <img
                    src={item.thumb}
                    className={`w-full h-32 object-cover ${tw.bg.secondary}`}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
                <div className="p-2.5">
                  <div className="flex items-start gap-1.5">
                    <div className="mt-1.5 shrink-0 w-1.5">
                      {!item.hasRead && (
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${tw.primary.bg}`}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm leading-snug line-clamp-2 ${
                          item.hasRead
                            ? tw.text.secondary
                            : `font-medium ${tw.text.primary}`
                        }`}
                      >
                        {item.title}
                      </div>
                      {item.snippet && (
                        <div
                          className={`text-xs mt-0.5 line-clamp-2 ${tw.text.tertiary}`}
                        >
                          {item.snippet}
                        </div>
                      )}
                      <div
                        className={`flex items-center gap-1 mt-1 text-xs ${tw.text.tertiary}`}
                      >
                        <span>{formatDate(item.date)}</span>
                        {item.creator && (
                          <>
                            <span>·</span>
                            <span className="truncate max-w-24">
                              {item.creator}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          store.filteredItems.map((item) => (
            <button
              key={item.id}
              className={`w-full text-left px-3 py-2.5 border-b ${tw.border} ${
                tw.hover
              } ${store.selectedItemId === item.id ? tw.active : ''}`}
              onClick={() => store.setSelectedItem(item.id)}
            >
              <div className="flex items-start gap-1.5">
                <div className="mt-1.5 shrink-0 w-1.5">
                  {!item.hasRead && (
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${tw.primary.bg}`}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm leading-snug line-clamp-2 ${
                      item.hasRead
                        ? tw.text.secondary
                        : `font-medium ${tw.text.primary}`
                    }`}
                  >
                    {item.title}
                  </div>
                  {item.snippet && (
                    <div
                      className={`text-xs mt-0.5 line-clamp-2 ${tw.text.tertiary}`}
                    >
                      {item.snippet}
                    </div>
                  )}
                  <div
                    className={`flex items-center gap-1 mt-1 text-xs ${tw.text.tertiary}`}
                  >
                    <span>{formatDate(item.date)}</span>
                    {item.creator && (
                      <>
                        <span>·</span>
                        <span className="truncate max-w-24">
                          {item.creator}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {item.thumb && (
                  <img
                    src={item.thumb}
                    className={`shrink-0 w-16 h-16 object-cover rounded ${tw.bg.secondary}`}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
})
