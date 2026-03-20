import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { tw } from 'share/theme'
import store from '../store'
import type { Session } from '../types'

export default observer(function SessionList() {
  const { t } = useTranslation()

  function handleDelete(e: React.MouseEvent, session: Session) {
    e.stopPropagation()
    store.deleteSession(session.id)
  }

  return (
    <div className={`flex flex-col h-full border-r ${tw.border}`}>
      <div
        className={`flex items-center justify-between px-3 py-2 border-b ${tw.border}`}
      >
        <span
          className={`text-xs font-semibold uppercase tracking-wide ${tw.text.tertiary}`}
        >
          {t('sessions')}
        </span>
        <button
          onClick={() => store.newSession()}
          title={t('newChat')}
          className={`rounded p-1 ${tw.hover} ${tw.text.secondary}`}
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {store.sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => store.selectSession(session.id)}
            className={`group flex items-center gap-1 px-3 py-2 cursor-pointer text-sm ${
              session.id === store.activeSessionId
                ? `${tw.active} ${tw.text.primary}`
                : `${tw.text.secondary} ${tw.hover}`
            }`}
          >
            <span className="flex-1 truncate">
              {session.title || t('newChat')}
            </span>
            <button
              onClick={(e) => handleDelete(e, session)}
              title={t('delete')}
              className={`shrink-0 opacity-0 group-hover:opacity-100 rounded p-0.5 ${tw.hover} ${tw.text.tertiary}`}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
})
