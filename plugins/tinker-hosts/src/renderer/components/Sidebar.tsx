import React, { useState, Fragment } from 'react'
import { observer } from 'mobx-react-lite'
import { Dialog, Transition } from '@headlessui/react'
import { useTranslation } from 'react-i18next'
import { toJS } from 'mobx'
import store from '../store'
import { HostsConfig } from '../types'

export const Sidebar: React.FC = observer(() => {
  const { t } = useTranslation()
  const { config, selectedId, viewMode } = store
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newConfigName, setNewConfigName] = useState('')
  const [isApplying, setIsApplying] = useState(false)

  if (!config) return null

  const customConfigs = config.configs.filter((c) => c.group === 'custom')

  const handleSelect = (id: string) => {
    store.setSelectedId(id)
    store.setViewMode('config')
  }

  const handleSystemView = () => {
    store.setViewMode('system')
    store.setSelectedId('system')
  }

  const handleAdd = () => {
    if (newConfigName.trim()) {
      store.addConfig(newConfigName.trim(), 'custom')
      setNewConfigName('')
      setShowAddDialog(false)
    }
  }

  const handleToggleActive = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    store.toggleActive(id)
  }

  const handleApplyConfig = async () => {
    if (!config) return

    const activeConfigs = config.configs.filter((c) =>
      config.activeIds.includes(c.id)
    )

    if (activeConfigs.length === 0) {
      alert(t('noActiveConfig'))
      return
    }

    const hasContent = activeConfigs.some((c) => c.content.trim().length > 0)
    if (!hasContent) {
      alert(t('emptyConfig'))
      return
    }

    setIsApplying(true)
    try {
      console.log('Applying hosts config...')
      console.log('Active IDs:', toJS(config.activeIds))
      console.log('All configs:', toJS(config.configs))
      await store.applyHosts()
      alert(t('saveSuccess'))
    } catch (error) {
      console.error('Apply config error:', error)
      alert(
        t('saveFailed', {
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      )
    } finally {
      setIsApplying(false)
    }
  }

  const handleDeleteConfig = (id: string, name: string) => {
    if (confirm(t('deleteConfirm', { name }))) {
      store.deleteConfig(id)
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    const activeConfigs = config.configs.filter((c) =>
      config.activeIds.includes(c.id)
    )

    tinker.showContextMenu(e.clientX, e.clientY, [
      {
        label: t('applyConfig', { count: activeConfigs.length }),
        click: () => {
          handleApplyConfig()
        },
      },
    ])
  }

  const handleConfigContextMenu = (e: React.MouseEvent, cfg: HostsConfig) => {
    e.preventDefault()
    e.stopPropagation()

    const activeConfigs = config.configs.filter((c) =>
      config.activeIds.includes(c.id)
    )

    const menuItems = [
      {
        label: t('applyConfig', { count: activeConfigs.length }),
        click: () => {
          handleApplyConfig()
        },
      },
      {
        label: t('delete'),
        click: () => {
          handleDeleteConfig(cfg.id, cfg.name)
        },
      },
    ]

    tinker.showContextMenu(e.clientX, e.clientY, menuItems)
  }

  const renderConfigItem = (cfg: HostsConfig) => {
    const isActive = config.activeIds.includes(cfg.id)
    const isSelected = selectedId === cfg.id

    return (
      <div
        key={cfg.id}
        className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 ${
          isSelected ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        onClick={() => handleSelect(cfg.id)}
        onContextMenu={(e) => handleConfigContextMenu(e, cfg)}
      >
        <div
          className={`w-3 h-3 rounded-full border-2 cursor-pointer ${
            isActive
              ? 'bg-green-500 border-green-500'
              : 'border-gray-400 dark:border-gray-500'
          }`}
          onClick={(e) => handleToggleActive(e, cfg.id)}
        />
        <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 truncate">
          {cfg.name}
        </span>
      </div>
    )
  }

  return (
    <div
      className="w-64 bg-[#f8f8f8] dark:bg-[#252526] border-r border-gray-300 dark:border-gray-700 flex flex-col relative"
      onContextMenu={handleContextMenu}
    >
      {isApplying && (
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 px-6 py-3 rounded shadow-lg text-gray-800 dark:text-gray-200">
            {t('applying')}
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        <div className="mb-4">
          <div
            className={`px-3 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 ${
              viewMode === 'system' ? 'bg-gray-200 dark:bg-gray-700' : ''
            }`}
            onClick={handleSystemView}
          >
            <span className="text-sm text-gray-800 dark:text-gray-200">
              {t('viewSystemHosts')}
            </span>
          </div>
        </div>

        <div>
          <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 font-semibold">
            {t('custom')}
          </div>
          {customConfigs.map(renderConfigItem)}
        </div>
      </div>

      <div className="p-3 border-t border-gray-300 dark:border-gray-700">
        <button
          className="w-full px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
          onClick={() => setShowAddDialog(true)}
        >
          + {t('addConfig')}
        </button>
      </div>

      {/* Add dialog */}
      <Transition appear show={showAddDialog} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => {
            setShowAddDialog(false)
            setNewConfigName('')
          }}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200"
                  >
                    {t('newConfig')}
                  </Dialog.Title>

                  <div className="mb-4">
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {t('configName')}
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newConfigName}
                      onChange={(e) => setNewConfigName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newConfigName.trim()) {
                          handleAdd()
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
                        setShowAddDialog(false)
                        setNewConfigName('')
                      }}
                    >
                      {t('cancel')}
                    </button>
                    <button
                      className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleAdd}
                      disabled={!newConfigName.trim()}
                    >
                      {t('confirm')}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
})
