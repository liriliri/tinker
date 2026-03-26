import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Plus, MessageSquare } from 'lucide-react'
import NavList, { type NavListItem } from 'share/components/NavList'
import { confirm } from 'share/components/Confirm'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function SessionList() {
  const { t } = useTranslation()

  async function handleDelete(id: string) {
    const ok = await confirm({ title: t('deleteSessionConfirm') })
    if (ok) store.deleteSession(id)
  }

  const items: NavListItem[] = store.sessions.map((session) => ({
    id: session.id,
    icon: MessageSquare,
    label: session.title || t('newChat'),
    menu: () => [
      {
        label: t('delete'),
        click: () => handleDelete(session.id),
      },
    ],
  }))

  return (
    <div className={`flex flex-col h-full border-r ${tw.border}`}>
      <div className="flex-1 overflow-y-auto">
        <NavList
          items={items}
          activeId={store.activeSessionId}
          onSelect={(id) => store.selectSession(id)}
        />
      </div>
      <div className={`p-2 border-t ${tw.border}`}>
        <button
          onClick={() => store.newSession()}
          className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-md ${tw.text.secondary} ${tw.hover}`}
        >
          <Plus size={12} />
          {t('newChat')}
        </button>
      </div>
    </div>
  )
})
