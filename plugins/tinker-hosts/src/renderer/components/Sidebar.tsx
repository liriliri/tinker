import React, { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Dialog, confirm, prompt } from 'share/renderer/components'
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
      message: t('configNamePlaceholder'),
      placeholder: t('configNamePlaceholder'),
    })

    if (name) {
      store.addConfig(name)
    }
  }

  const handleEditConfig = async (id: string, name: string) => {
    const newName = await prompt({
      title: t('editConfig'),
      message: t('configNamePlaceholder'),
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

  const handleExport = () => {
    const dataStr = JSON.stringify(configs, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `hosts-configs-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            const importedConfigs = JSON.parse(event.target?.result as string)
            if (Array.isArray(importedConfigs)) {
              // Merge imported configs with existing ones
              const newConfigs = [...configs, ...importedConfigs]
              store.configs = newConfigs
              store.saveConfigs()
            }
          } catch (error) {
            console.error('Failed to import configs:', error)
            alert('导入失败：文件格式不正确')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleConfigContextMenu = (e: React.MouseEvent, cfg: HostsConfig) => {
    e.preventDefault()
    e.stopPropagation()

    const isActive = activeIds.includes(cfg.id)

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
        <svg
          className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
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
          <svg
            className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
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
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
        <button
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#3a3a3c] rounded transition-colors"
          onClick={handleExport}
          title="导出配置"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </button>
        <button
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#3a3a3c] rounded transition-colors"
          onClick={handleImport}
          title="导入配置"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
        </button>
      </div>
    </div>
  )
})
