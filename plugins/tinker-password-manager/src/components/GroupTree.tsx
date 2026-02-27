import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Folder } from 'lucide-react'
import { tw } from 'share/theme'
import className from 'licia/className'
import Tree, { TreeNodeData } from 'share/components/Tree'
import store from '../store'
import { KdbxGroup } from '../types'
import { prompt } from 'share/components/Prompt'
import { confirm } from 'share/components/Confirm'
import type { MenuItemConstructorOptions } from 'electron'

interface GroupNodeData extends TreeNodeData {
  entryCount: number
  isRoot: boolean
}

function groupToNode(group: KdbxGroup, isRoot: boolean): GroupNodeData {
  return {
    id: group.uuid,
    label: group.name,
    entryCount: group.entries.length,
    isRoot,
    children: group.groups.map((g) => groupToNode(g, false)),
  }
}

export default observer(function GroupTree() {
  const { t } = useTranslation()

  if (!store.rootGroup) {
    return (
      <div className={`p-4 text-center text-sm ${tw.text.tertiary}`}>
        {t('noEntries')}
      </div>
    )
  }

  const buildMenu = (node: GroupNodeData): MenuItemConstructorOptions[] => {
    const items: MenuItemConstructorOptions[] = []

    items.push({
      label: t('createGroup'),
      click: async () => {
        const name = await prompt({
          title: t('newGroup'),
          defaultValue: t('newGroup'),
        })
        if (name) {
          store.createGroup(node.id, name)
        }
      },
    })

    items.push({
      label: t('createEntry'),
      click: async () => {
        const title = await prompt({
          title: t('newEntry'),
          defaultValue: t('newEntry'),
        })
        if (title) {
          store.createEntry(node.id, title)
        }
      },
    })

    if (!node.isRoot) {
      items.push({
        label: t('renameGroup'),
        click: async () => {
          const name = await prompt({
            title: t('renameGroup'),
            defaultValue: node.label,
          })
          if (name && name !== node.label) {
            store.renameGroup(node.id, name)
          }
        },
      })

      items.push({
        label: t('deleteGroup'),
        click: async () => {
          const confirmed = await confirm({
            title: t('deleteGroup'),
            message: t('confirmDeleteGroup'),
          })
          if (confirmed) {
            store.deleteGroup(node.id)
          }
        },
      })
    }

    return items
  }

  return (
    <Tree<GroupNodeData>
      data={groupToNode(store.rootGroup, true)}
      activeNodeId={store.selectedGroupId}
      onNodeClick={(node) => store.selectGroup(node.id)}
      renderLabel={(node, isActive) => (
        <>
          <Folder size={16} className="flex-shrink-0 mr-1" />
          <span
            className={className(
              'text-sm flex-1 truncate',
              isActive ? 'text-white font-medium' : tw.text.primary
            )}
          >
            {node.label}
          </span>
          <span
            className={className(
              'text-xs ml-2',
              isActive ? 'text-white opacity-90' : tw.text.secondary
            )}
          >
            {node.entryCount}
          </span>
        </>
      )}
      menu={buildMenu}
    />
  )
})
