import React, { useState, Fragment } from 'react'
import { observer } from 'mobx-react-lite'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { HostsConfig } from '../types'

export default observer(function Sidebar() {
  const { t } = useTranslation()
  const { configs, activeIds, selectedId, viewMode } = store
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [configName, setConfigName] = useState('')
  const [editingConfig, setEditingConfig] = useState<{
    id: string
    name: string
  } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    name: string
  } | null>(null)

  const handleSelect = (id: string) => {
    store.setSelectedId(id)
    store.setViewMode('config')
  }

  const handleSystemView = () => {
    store.setViewMode('system')
    store.setSelectedId('system')
  }

  const handleAddConfig = () => {
    setEditingConfig(null)
    setConfigName('')
    setShowConfigDialog(true)
  }

  const handleEditConfig = (id: string, name: string) => {
    setEditingConfig({ id, name })
    setConfigName(name)
    setShowConfigDialog(true)
  }

  const handleSaveConfig = () => {
    if (configName.trim()) {
      if (editingConfig) {
        // Edit existing config
        store.renameConfig(editingConfig.id, configName.trim())
      } else {
        // Add new config
        store.addConfig(configName.trim())
      }
      setShowConfigDialog(false)
      setConfigName('')
      setEditingConfig(null)
    }
  }

  const handleDeleteConfig = (id: string, name: string) => {
    setDeleteTarget({ id, name })
  }

  const confirmDelete = () => {
    if (deleteTarget) {
      store.deleteConfig(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const handleConfigContextMenu = (e: React.MouseEvent, cfg: HostsConfig) => {
    e.preventDefault()
    e.stopPropagation()

    tinker.showContextMenu(e.clientX, e.clientY, [
      {
        label: t('edit'),
        click: () => {
          handleEditConfig(cfg.id, cfg.name)
        },
      },
      {
        label: t('delete'),
        click: () => {
          handleDeleteConfig(cfg.id, cfg.name)
        },
      },
    ])
  }

  const renderConfigItem = (cfg: HostsConfig) => {
    const isActive = activeIds.includes(cfg.id)
    const isSelected = selectedId === cfg.id

    return (
      <div
        key={cfg.id}
        className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-[#3a3a3c] ${
          isSelected ? 'bg-gray-300 dark:bg-[#4a4a4a]' : ''
        }`}
        onClick={() => handleSelect(cfg.id)}
        onContextMenu={(e) => handleConfigContextMenu(e, cfg)}
      >
        <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 truncate">
          {cfg.name}
        </span>
        <div
          className={`w-3 h-3 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${
            isActive
              ? 'border-[#0fc25e] bg-[#0fc25e]'
              : 'border-gray-400 dark:border-gray-500'
          }`}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
            store.toggleActive(cfg.id)
          }}
        />
      </div>
    )
  }

  return (
    <div className="w-64 flex-shrink-0 bg-[#f0f1f2] dark:bg-[#252526] border-r border-[#e0e0e0] dark:border-[#4a4a4a] flex flex-col relative">
      {/* System Hosts - Fixed at top */}
      <div
        className={`px-3 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-[#3a3a3c] border-b border-[#e0e0e0] dark:border-[#4a4a4a] flex-shrink-0 ${
          viewMode === 'system' ? 'bg-gray-300 dark:bg-[#4a4a4a]' : ''
        }`}
        onClick={handleSystemView}
      >
        <span className="text-sm text-gray-800 dark:text-gray-200">
          {t('viewSystemHosts')}
        </span>
      </div>

      {/* Config list - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {configs.map(renderConfigItem)}
      </div>

      {/* Add button - Fixed at bottom */}
      <div className="p-3 border-t border-[#e0e0e0] dark:border-[#4a4a4a] flex-shrink-0">
        <button
          className="w-full px-3 py-2 text-sm bg-[#0fc25e] hover:bg-[#0db350] text-white rounded"
          onClick={handleAddConfig}
        >
          + {t('addConfig')}
        </button>
      </div>

      {/* Config dialog (add/edit) */}
      <Dialog
        open={showConfigDialog}
        onClose={() => {
          setShowConfigDialog(false)
          setConfigName('')
          setEditingConfig(null)
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black bg-opacity-50" />

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-[#303133] p-6 shadow-xl">
              <DialogTitle
                as="h3"
                className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200"
              >
                {editingConfig ? t('editConfig') : t('newConfig')}
              </DialogTitle>

              <div className="mb-4">
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[#e0e0e0] dark:border-[#4a4a4a] rounded bg-white dark:bg-[#252526] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0fc25e]"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && configName.trim()) {
                      handleSaveConfig()
                    }
                  }}
                  placeholder={t('configNamePlaceholder')}
                  autoFocus
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  onClick={() => {
                    setShowConfigDialog(false)
                    setConfigName('')
                    setEditingConfig(null)
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  className="px-4 py-2 text-sm bg-[#0fc25e] hover:bg-[#0db350] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSaveConfig}
                  disabled={!configName.trim()}
                >
                  {t('confirm')}
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black bg-opacity-50" />

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-[#303133] p-6 shadow-xl">
              <DialogTitle
                as="h3"
                className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200"
              >
                {t('deleteConfirmTitle')}
              </DialogTitle>

              <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
                {t('deleteConfirm', { name: deleteTarget?.name })}
              </p>

              <div className="flex gap-2 justify-end">
                <button
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  onClick={() => setDeleteTarget(null)}
                >
                  {t('cancel')}
                </button>
                <button
                  className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded"
                  onClick={confirmDelete}
                >
                  {t('delete')}
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  )
})
