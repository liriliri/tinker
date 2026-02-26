import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Folder, ChevronRight, ChevronDown } from 'lucide-react'
import { tw } from 'share/theme'
import className from 'licia/className'
import store from '../store'
import { KdbxGroup } from '../types'
import { useState } from 'react'
import { prompt } from 'share/components/Prompt'
import { confirm } from 'share/components/Confirm'
import { MenuItemConstructorOptions } from 'electron'

interface GroupItemProps {
  group: KdbxGroup
  level: number
}

const GroupItem = observer(function GroupItem({
  group,
  level,
}: GroupItemProps) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(true)
  const isSelected = store.selectedGroupId === group.uuid
  const hasChildren = group.groups.length > 0

  const handleClick = () => {
    store.selectGroup(group.uuid)
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const isRootGroup = level === 0

    const menuItems: MenuItemConstructorOptions[] = []

    // Create subgroup
    menuItems.push({
      label: t('createGroup'),
      click: async () => {
        const name = await prompt({
          title: t('newGroup'),
          defaultValue: t('newGroup'),
        })
        if (name) {
          store.createGroup(group.uuid, name)
        }
      },
    })

    // Create entry
    menuItems.push({
      label: t('createEntry'),
      click: async () => {
        const title = await prompt({
          title: t('newEntry'),
          defaultValue: t('newEntry'),
        })
        if (title) {
          store.createEntry(group.uuid, title)
        }
      },
    })

    // Rename group (not for root)
    if (!isRootGroup) {
      menuItems.push({
        label: t('renameGroup'),
        click: async () => {
          const name = await prompt({
            title: t('renameGroup'),
            defaultValue: group.name,
          })
          if (name && name !== group.name) {
            store.renameGroup(group.uuid, name)
          }
        },
      })
    }

    // Delete group (not for root)
    if (!isRootGroup) {
      menuItems.push({
        label: t('deleteGroup'),
        click: async () => {
          const confirmed = await confirm({
            title: t('deleteGroup'),
            message: t('confirmDeleteGroup'),
          })
          if (confirmed) {
            store.deleteGroup(group.uuid)
          }
        },
      })
    }

    tinker.showContextMenu(e.clientX, e.clientY, menuItems)
  }

  return (
    <div>
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={className(
          'flex items-center py-1 px-2 cursor-pointer rounded transition-colors',
          isSelected ? tw.primary.bg : tw.hover
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasChildren && (
          <button
            onClick={handleToggle}
            className="flex-shrink-0 mr-1 p-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-5 flex-shrink-0" />}
        <Folder size={16} className="flex-shrink-0 mr-1" />
        <span
          className={className(
            'text-sm flex-1 truncate',
            isSelected ? 'text-white font-medium' : tw.text.primary
          )}
        >
          {group.name}
        </span>
        <span
          className={className(
            'text-xs ml-2',
            isSelected ? 'text-white opacity-90' : tw.text.secondary
          )}
        >
          {group.entries.length}
        </span>
      </div>

      {isExpanded &&
        group.groups.map((subGroup) => (
          <GroupItem key={subGroup.uuid} group={subGroup} level={level + 1} />
        ))}
    </div>
  )
})

export default observer(function GroupTree() {
  const { t } = useTranslation()

  if (!store.rootGroup) {
    return (
      <div className={`p-4 text-center text-sm ${tw.text.tertiary}`}>
        {t('noEntries')}
      </div>
    )
  }

  return (
    <div className={`h-full overflow-y-auto p-2 ${tw.bg.tertiary}`}>
      <GroupItem group={store.rootGroup} level={0} />
    </div>
  )
})
