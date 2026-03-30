import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Folder, Plus } from 'lucide-react'
import { tw } from 'share/theme'
import {
  Toolbar,
  ToolbarButton,
  ToolbarLabel,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import className from 'licia/className'
import Tree, { TreeNodeData } from 'share/components/Tree'
import { prompt } from 'share/components/Prompt'
import { confirm } from 'share/components/Confirm'
import store from '../store'
import { METHOD_COLORS } from '../../lib/util'
import type { Collection, CollectionItem } from '../../common/types'
import type { MenuItemConstructorOptions } from 'electron'

interface CollectionNodeData extends TreeNodeData {
  nodeType: 'collection' | 'folder' | 'request'
  method?: string
  collectionId?: string
}

function itemToNode(item: CollectionItem): CollectionNodeData {
  if (item.type === 'folder') {
    return {
      id: item.id,
      label: item.name,
      nodeType: 'folder',
      children: item.children?.map(itemToNode) || [],
    }
  }
  return {
    id: item.id,
    label: item.name,
    nodeType: 'request',
    method: item.request?.method || 'GET',
  }
}

function collectionToNode(collection: Collection): CollectionNodeData {
  return {
    id: collection.id,
    label: collection.name,
    nodeType: 'collection',
    collectionId: collection.id,
    children: collection.items.map(itemToNode),
  }
}

export default observer(function CollectionTree() {
  const { t } = useTranslation()

  const treeData = store.collections.map(collectionToNode)

  const handleNodeClick = (node: CollectionNodeData) => {
    if (node.nodeType === 'request') {
      store.selectItem(node.id)
    }
  }

  const handleNewCollection = async () => {
    const name = await prompt({
      title: t('newCollection'),
      defaultValue: t('newCollection'),
    })
    if (name) {
      store.createCollection(name)
    }
  }

  const buildMenu = (
    node: CollectionNodeData
  ): MenuItemConstructorOptions[] => {
    const items: MenuItemConstructorOptions[] = []

    if (node.nodeType === 'collection') {
      items.push({
        label: t('newFolder'),
        click: async () => {
          const name = await prompt({
            title: t('newFolder'),
            defaultValue: t('newFolder'),
          })
          if (name) {
            store.createFolder(node.id, name)
          }
        },
      })
      items.push({
        label: t('newRequest'),
        click: async () => {
          const name = await prompt({
            title: t('newRequest'),
            defaultValue: t('newRequest'),
          })
          if (name) {
            store.createRequest(node.id, name)
          }
        },
      })
      items.push({ type: 'separator' })
      items.push({
        label: t('rename'),
        click: async () => {
          const name = await prompt({
            title: t('rename'),
            defaultValue: node.label,
          })
          if (name && name !== node.label) {
            store.renameCollection(node.id, name)
          }
        },
      })
      items.push({
        label: t('delete'),
        click: async () => {
          const confirmed = await confirm({
            title: t('delete'),
            message: t('confirmDeleteCollection'),
          })
          if (confirmed) {
            store.deleteCollection(node.id)
          }
        },
      })
    } else if (node.nodeType === 'folder') {
      items.push({
        label: t('newFolder'),
        click: async () => {
          const name = await prompt({
            title: t('newFolder'),
            defaultValue: t('newFolder'),
          })
          if (name) {
            store.createFolder(node.id, name)
          }
        },
      })
      items.push({
        label: t('newRequest'),
        click: async () => {
          const name = await prompt({
            title: t('newRequest'),
            defaultValue: t('newRequest'),
          })
          if (name) {
            store.createRequest(node.id, name)
          }
        },
      })
      items.push({ type: 'separator' })
      items.push({
        label: t('rename'),
        click: async () => {
          const name = await prompt({
            title: t('rename'),
            defaultValue: node.label,
          })
          if (name && name !== node.label) {
            store.renameFolder(node.id, name)
          }
        },
      })
      items.push({
        label: t('delete'),
        click: async () => {
          const confirmed = await confirm({
            title: t('delete'),
            message: t('confirmDeleteFolder'),
          })
          if (confirmed) {
            store.deleteFolder(node.id)
          }
        },
      })
    } else if (node.nodeType === 'request') {
      items.push({
        label: t('rename'),
        click: async () => {
          const name = await prompt({
            title: t('rename'),
            defaultValue: node.label,
          })
          if (name && name !== node.label) {
            store.renameRequest(node.id, name)
          }
        },
      })
      items.push({
        label: t('delete'),
        click: async () => {
          const confirmed = await confirm({
            title: t('delete'),
            message: t('confirmDeleteRequest'),
          })
          if (confirmed) {
            store.deleteRequest(node.id)
          }
        },
      })
    }

    return items
  }

  return (
    <div className="h-full flex flex-col">
      <Toolbar>
        <ToolbarLabel>{t('collections')}</ToolbarLabel>
        <ToolbarSpacer />
        <ToolbarButton onClick={handleNewCollection} title={t('newCollection')}>
          <Plus size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </Toolbar>
      <Tree<CollectionNodeData>
        data={treeData}
        activeNodeId={store.selectedItemId}
        onNodeClick={handleNodeClick}
        renderLabel={(node, isActive) => {
          if (node.nodeType === 'request') {
            const method = node.method || 'GET'
            const colorClass = METHOD_COLORS[method] || tw.text.tertiary
            return (
              <>
                <span
                  className={className(
                    'text-[10px] font-bold mr-1.5 flex-shrink-0 w-8',
                    isActive ? 'text-white' : colorClass
                  )}
                >
                  {method.length > 3 ? method.slice(0, 3) : method}
                </span>
                <span
                  className={className(
                    'text-sm truncate',
                    isActive ? 'text-white font-medium' : tw.text.primary
                  )}
                  title={node.label}
                >
                  {node.label}
                </span>
              </>
            )
          }

          return (
            <>
              <Folder size={14} className="flex-shrink-0 mr-1.5" />
              <span
                className={className(
                  'text-sm truncate',
                  isActive ? 'text-white font-medium' : tw.text.primary
                )}
                title={node.label}
              >
                {node.label}
              </span>
            </>
          )
        }}
        menu={buildMenu}
        emptyText={t('noCollections')}
      />
    </div>
  )
})
