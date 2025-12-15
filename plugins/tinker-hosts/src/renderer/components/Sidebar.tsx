import React from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { confirm } from 'share/components/Confirm'
import { prompt } from 'share/components/Prompt'
import { alert } from 'share/components/Alert'
import { FileText, Monitor, Plus, Upload, Download } from 'lucide-react'
import contain from 'licia/contain'
import each from 'licia/each'
import isArr from 'licia/isArr'
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

  const handleExport = async () => {
    const result = await tinker.showSaveDialog({
      defaultPath: 'hosts-configs.json',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })

    if (!result.canceled && result.filePath) {
      try {
        const dataStr = JSON.stringify(configs, null, 2)
        hosts.writeFile(result.filePath, dataStr)
      } catch (error) {
        console.error('Failed to export configs:', error)
        alert({ title: '导出失败' })
      }
    }
  }

  const handleImport = async () => {
    const result = await tinker.showOpenDialog({
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    })

    if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
      try {
        const filePath = result.filePaths[0]
        const dataStr = await hosts.readFile(filePath)
        const importedConfigs = JSON.parse(dataStr)

        if (isArr(importedConfigs)) {
          // Merge imported configs with existing ones
          // If id exists, replace; if not, add new
          const configMap: Record<string, HostsConfig> = {}
          each(configs, (c) => {
            configMap[c.id] = c
          })
          each(importedConfigs, (imported) => {
            configMap[imported.id] = imported
          })
          const newConfigs = Object.values(configMap)
          store.configs = newConfigs
          store.saveConfigs()
        }
      } catch (error) {
        console.error('Failed to import configs:', error)
        alert({ title: '导入失败', message: '文件格式不正确' })
      }
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
    const isActive = contain(activeIds, cfg.id)
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
        <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
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
      <div className="p-3 flex justify-center gap-2 flex-shrink-0">
        <button
          className="p-2 text-[#0fc25e] hover:bg-gray-200 dark:hover:bg-[#3a3a3c] rounded transition-colors"
          onClick={handleAddConfig}
          title="新增配置"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#3a3a3c] rounded transition-colors"
          onClick={handleExport}
          title="导出配置"
        >
          <Upload className="w-5 h-5" />
        </button>
        <button
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#3a3a3c] rounded transition-colors"
          onClick={handleImport}
          title="导入配置"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
})
