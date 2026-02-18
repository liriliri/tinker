import React from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { confirm } from 'share/components/Confirm'
import { prompt } from 'share/components/Prompt'
import { tw } from 'share/theme'
import { FileText, Monitor, Plus } from 'lucide-react'
import contain from 'licia/contain'
import className from 'licia/className'
import store from '../store'
import { HostsConfig } from '../types'

export default observer(function Sidebar() {
  const { t } = useTranslation()
  const { configs, activeIds, selectedId, viewMode } = store

  const handleSelect = (id: string) => {
    store.setSelectedId(id)
    store.setViewMode('config')
  }

  const handleSystemView = () => {
    store.setViewMode('system')
    store.setSelectedId('system')
  }

  const handleAddConfig = async () => {
    const name = await prompt({
      title: t('newConfig'),
      placeholder: t('configNamePlaceholder'),
    })

    if (name) {
      store.addConfig(name)
    }
  }

  const handleEditConfig = async (id: string, name: string) => {
    const newName = await prompt({
      title: t('editConfig'),
      defaultValue: name,
      placeholder: t('configNamePlaceholder'),
    })

    if (newName) {
      store.renameConfig(id, newName)
    }
  }

  const handleDeleteConfig = async (id: string, name: string) => {
    const result = await confirm({
      title: t('deleteConfirmTitle'),
      message: t('deleteConfirm', { name }),
      confirmText: t('delete'),
      cancelText: t('cancel'),
    })

    if (result) {
      store.deleteConfig(id)
    }
  }

  const handleConfigContextMenu = (e: React.MouseEvent, cfg: HostsConfig) => {
    e.preventDefault()
    e.stopPropagation()

    const isActive = contain(activeIds, cfg.id)

    tinker.showContextMenu(e.clientX, e.clientY, [
      {
        label: isActive ? t('deactivate') : t('apply'),
        click: () => {
          store.toggleActive(cfg.id)
        },
      },
      {
        label: t('rename'),
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
    const isActive = contain(activeIds, cfg.id)
    const isSelected = selectedId === cfg.id

    return (
      <div
        key={cfg.id}
        className={className(
          'flex items-center gap-2 px-3 py-2 cursor-pointer',
          tw.hover.both,
          isSelected && tw.active.both
        )}
        onClick={() => handleSelect(cfg.id)}
        onContextMenu={(e) => handleConfigContextMenu(e, cfg)}
      >
        <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
        <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 truncate">
          {cfg.name}
        </span>
        <div
          className={className(
            'w-3 h-3 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors',
            isActive
              ? [tw.primary.border, tw.primary.bg]
              : 'border-gray-400 dark:border-gray-500'
          )}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
            store.toggleActive(cfg.id)
          }}
        />
      </div>
    )
  }

  return (
    <div
      className={`w-64 flex-shrink-0 ${tw.bg.tertiary} border-r ${tw.border} flex flex-col relative`}
    >
      {/* System Hosts - Fixed at top */}
      <div
        className={className(
          'px-3 py-2 cursor-pointer border-b flex-shrink-0',
          tw.hover.both,
          tw.border,
          viewMode === 'system' && tw.active.both
        )}
        onClick={handleSystemView}
      >
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-800 dark:text-gray-200 truncate">
            {t('viewSystemHosts')}
          </span>
        </div>
      </div>

      {/* Config list - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {configs.map(renderConfigItem)}
      </div>

      {/* Action buttons - Fixed at bottom */}
      <div className="p-3 flex justify-center flex-shrink-0">
        <button
          className={`w-full ${tw.primary.bg} ${tw.primary.bgHover} text-white px-3 py-1.5 text-xs rounded-md flex items-center justify-center gap-2 transition-colors`}
          onClick={handleAddConfig}
          title={t('newConfig')}
        >
          <Plus size={14} />
          <span className="text-sm font-medium">{t('newConfig')}</span>
        </button>
      </div>
    </div>
  )
})
