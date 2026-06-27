import { useState, useCallback, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Folder, Globe } from 'lucide-react'
import { tw } from 'share/theme'
import className from 'licia/className'
import uuid from 'licia/uuid'
import Tree, { TreeNodeData } from 'share/components/Tree'
import { prompt } from 'share/components/Prompt'
import { confirm } from 'share/components/Confirm'
import SessionConfigDialog from './SessionConfigDialog'
import store from '../store'
import type { ISftpSessionConfig } from '../../common/types'
import type { ISessionFolder } from '../lib/db'
import type { MenuItemConstructorOptions } from 'electron'

interface SessionNodeData extends TreeNodeData {
  isFolder: boolean
  folderId: string
  config?: ISftpSessionConfig
}

function foldersToNodes(
  folders: ISessionFolder[],
  filter: string
): SessionNodeData[] {
  const keyword = filter.trim().toLowerCase()

  return folders
    .map((folder) => {
      const children = folder.children
        .filter((config) => {
          if (!keyword) return true
          return (
            config.name.toLowerCase().includes(keyword) ||
            config.host.toLowerCase().includes(keyword) ||
            config.username.toLowerCase().includes(keyword)
          )
        })
        .map((config) => ({
          id: config.id,
          label: config.name,
          isFolder: false,
          folderId: folder.id,
          config,
        }))

      if (keyword && children.length === 0) return null

      return {
        id: folder.id,
        label: folder.name,
        isFolder: true,
        folderId: folder.id,
        children,
      }
    })
    .filter(Boolean) as SessionNodeData[]
}

interface SessionTreeProps {
  filter: string
}

export default observer(function SessionTree({ filter }: SessionTreeProps) {
  const { t } = useTranslation()
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogFolderId, setDialogFolderId] = useState('')
  const [editingConfig, setEditingConfig] = useState<ISftpSessionConfig | null>(
    null
  )
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastClickIdRef = useRef<string | null>(null)

  const openNewSessionDialog = (folderId: string) => {
    setDialogFolderId(folderId)
    setEditingConfig(null)
    setDialogOpen(true)
  }

  const openEditSessionDialog = (
    folderId: string,
    config: ISftpSessionConfig
  ) => {
    setDialogFolderId(folderId)
    setEditingConfig(config)
    setDialogOpen(true)
  }

  const handleDialogConfirm = (config: Omit<ISftpSessionConfig, 'id'>) => {
    if (editingConfig) {
      store.updateSession(dialogFolderId, editingConfig.id, config)
    } else {
      store.createSession(dialogFolderId, {
        id: uuid(),
        ...config,
      })
    }
  }

  const buildMenu = (node: SessionNodeData): MenuItemConstructorOptions[] => {
    const items: MenuItemConstructorOptions[] = []

    if (node.isFolder) {
      items.push({
        label: t('newSession'),
        click: () => openNewSessionDialog(node.folderId),
      })
      items.push({ type: 'separator' })
      items.push({
        label: t('renameFolder'),
        click: async () => {
          const name = await prompt({
            title: t('renameFolder'),
            defaultValue: node.label,
          })
          if (name && name !== node.label) {
            store.renameFolder(node.id, name)
          }
        },
      })
      items.push({
        label: t('deleteFolder'),
        click: async () => {
          const confirmed = await confirm({
            title: t('deleteFolder'),
            message: t('confirmDeleteFolder'),
          })
          if (confirmed) {
            store.deleteFolder(node.id)
          }
        },
      })
    } else {
      items.push({
        label: t('openSession'),
        click: () => {
          if (node.config) {
            store.openSession(node.config)
          }
        },
      })
      items.push({
        label: t('editSession'),
        click: () => {
          if (node.config) {
            openEditSessionDialog(node.folderId, node.config)
          }
        },
      })
      items.push({ type: 'separator' })
      items.push({
        label: t('deleteSession'),
        click: async () => {
          const confirmed = await confirm({
            title: t('deleteSession'),
            message: t('confirmDeleteSession'),
          })
          if (confirmed) {
            store.deleteSession(node.folderId, node.id)
          }
        },
      })
    }

    return items
  }

  const handleNodeClick = useCallback((node: SessionNodeData) => {
    if (!node.isFolder && node.config) {
      if (lastClickIdRef.current === node.id && clickTimerRef.current) {
        clearTimeout(clickTimerRef.current)
        clickTimerRef.current = null
        lastClickIdRef.current = null
        void store.openSession(node.config)
        return
      }
    }

    lastClickIdRef.current = node.id
    setActiveNodeId(node.id)

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
    }
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null
      lastClickIdRef.current = null
    }, 300)
  }, [])

  const treeData = foldersToNodes(store.sessions, filter)

  return (
    <>
      {treeData.length === 0 ? (
        <div
          className={`flex flex-1 items-center justify-center p-4 ${tw.text.secondary}`}
        >
          <p className="text-sm text-center">{t('noSessions')}</p>
        </div>
      ) : (
        <Tree<SessionNodeData>
          data={treeData}
          onNodeClick={handleNodeClick}
          activeNodeId={activeNodeId}
          renderLabel={(node, isActive) => (
            <>
              {node.isFolder ? (
                <Folder size={14} className="flex-shrink-0 mr-1.5" />
              ) : (
                <Globe
                  size={14}
                  className={`flex-shrink-0 mr-1.5 ${
                    store.isSessionConnected(node.id) ? tw.primary.text : ''
                  }`}
                />
              )}
              <span
                className={className(
                  'text-sm flex-1 truncate',
                  isActive ? 'font-medium' : tw.text.primary
                )}
              >
                {node.label}
              </span>
            </>
          )}
          menu={buildMenu}
        />
      )}
      <SessionConfigDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleDialogConfirm}
        initialConfig={editingConfig}
      />
    </>
  )
})
