import { observer } from 'mobx-react-lite'
import { FolderOpen, Clock, Heart, ListMusic, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { tw } from 'share/theme'
import NavList, { NavListItem } from 'share/components/NavList'
import { prompt } from 'share/components/Prompt'
import store from '../store'
import { SideTab } from '../types'

const Sidebar = observer(() => {
  const { t } = useTranslation()

  const mainItems: NavListItem[] = useMemo(
    () => [
      { id: 'local', icon: FolderOpen, label: t('localMusic') },
      { id: 'recent', icon: Clock, label: t('recentPlay') },
      {
        id: 'favorite',
        icon: Heart,
        label: t('favorite'),
        count: store.favoriteSheet?.trackIds.length,
      },
    ],
    [t, store.favoriteSheet?.trackIds.length]
  )

  const sheetItems: NavListItem[] = useMemo(
    () =>
      store.customSheets.map((sheet) => ({
        id: `sheet:${sheet.id}`,
        icon: ListMusic,
        label: sheet.title,
        count: sheet.trackIds.length,
        menu: () => [
          {
            label: t('renameSheet'),
            click: async () => {
              const name = await prompt({
                title: t('renameSheet'),
                defaultValue: sheet.title,
              })
              if (name) {
                store.renameSheet(sheet.id, name)
              }
            },
          },
          {
            label: t('deleteSheet'),
            click: () => {
              store.deleteSheet(sheet.id)
            },
          },
        ],
      })),
    [store.customSheets, t]
  )

  const activeId = useMemo(() => {
    if (store.activeTab === 'sheet') {
      return `sheet:${store.activeSheetId}`
    }
    return store.activeTab
  }, [store.activeTab, store.activeSheetId])

  const handleSelect = (id: string) => {
    if (id.startsWith('sheet:')) {
      store.setActiveTab('sheet', id.slice(6))
    } else {
      store.setActiveTab(id as SideTab)
    }
  }

  const handleCreateSheet = async () => {
    const name = await prompt({ title: t('createSheet') })
    if (name) {
      store.createSheet(name)
    }
  }

  return (
    <div
      className={`flex flex-col w-44 flex-shrink-0 border-r overflow-y-auto ${tw.border} ${tw.bg.tertiary}`}
    >
      <NavList items={mainItems} activeId={activeId} onSelect={handleSelect} />
      <div className={`mx-2 mt-1 border-t ${tw.border}`} />
      <div className="flex items-center justify-between px-2 py-1">
        <span className={`text-xs ${tw.text.tertiary}`}>{t('mySheets')}</span>
        <button
          className={`p-0.5 rounded ${tw.hover} ${tw.text.secondary}`}
          onClick={handleCreateSheet}
          title={t('createSheet')}
        >
          <Plus size={14} />
        </button>
      </div>
      <NavList items={sheetItems} activeId={activeId} onSelect={handleSelect} />
    </div>
  )
})

export default Sidebar
