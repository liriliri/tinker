import React, { useState, Fragment } from 'react'
import { observer } from 'mobx-react-lite'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
  Switch,
} from '@headlessui/react'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { HostsConfig } from '../types'

export default observer(function Sidebar() {
  const { t } = useTranslation()
  const { configs, activeIds, selectedId, viewMode } = store
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newConfigName, setNewConfigName] = useState('')

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
      store.addConfig(newConfigName.trim())
      setNewConfigName('')
      setShowAddDialog(false)
    }
  }

  const handleDeleteConfig = (id: string, name: string) => {
    if (confirm(t('deleteConfirm', { name }))) {
      store.deleteConfig(id)
    }
  }

  const handleConfigContextMenu = (e: React.MouseEvent, cfg: HostsConfig) => {
    e.preventDefault()
    e.stopPropagation()

    tinker.showContextMenu(e.clientX, e.clientY, [
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
        <Switch
          checked={isActive}
          onChange={(checked) => {
            store.toggleActive(cfg.id)
          }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          className={`${
            isActive ? 'bg-[#0fc25e]' : 'bg-gray-300 dark:bg-gray-600'
          } relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0fc25e] focus:ring-offset-2`}
        >
          <span
            className={`${
              isActive ? 'translate-x-5' : 'translate-x-1'
            } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
          />
        </Switch>
      </div>
    )
  }

  return (
    <div className="w-64 flex-shrink-0 bg-[#f0f1f2] dark:bg-[#252526] border-r border-[#e0e0e0] dark:border-[#4a4a4a] flex flex-col relative">
      <div className="flex-1 overflow-y-auto">
        <div
          className={`px-3 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-[#3a3a3c] ${
            viewMode === 'system' ? 'bg-gray-300 dark:bg-[#4a4a4a]' : ''
          }`}
          onClick={handleSystemView}
        >
          <span className="text-sm text-gray-800 dark:text-gray-200">
            {t('viewSystemHosts')}
          </span>
        </div>

        {configs.map(renderConfigItem)}
      </div>

      <div className="p-3 border-t border-[#e0e0e0] dark:border-[#4a4a4a]">
        <button
          className="w-full px-3 py-2 text-sm bg-[#0fc25e] hover:bg-[#0db350] text-white rounded"
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
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-[#303133] p-6 shadow-xl transition-all">
                  <DialogTitle
                    as="h3"
                    className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200"
                  >
                    {t('newConfig')}
                  </DialogTitle>

                  <div className="mb-4">
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {t('configName')}
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-[#e0e0e0] dark:border-[#4a4a4a] rounded bg-white dark:bg-[#252526] text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0fc25e]"
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
                      className="px-4 py-2 text-sm bg-[#0fc25e] hover:bg-[#0db350] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleAdd}
                      disabled={!newConfigName.trim()}
                    >
                      {t('confirm')}
                    </button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
})
