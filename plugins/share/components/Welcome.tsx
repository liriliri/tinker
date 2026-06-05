import React from 'react'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'
import { addI18nNamespace } from '../lib/i18n'

const I18N_NS = 'welcome'

addI18nNamespace(I18N_NS, {
  'en-US': {
    open: 'Open',
    showInFolder: 'Show in Folder',
    removeFromRecent: 'Remove from Recent',
  },
  'zh-CN': {
    open: '打开',
    showInFolder: '在文件夹中显示',
    removeFromRecent: '从最近记录中移除',
  },
})

export interface WelcomeAction {
  icon: React.ReactNode
  label: string
  onClick: () => void
}

export interface WelcomeProps {
  title: string
  description: string
  actions: WelcomeAction[]
  recentFiles: string[]
  onOpenRecent: (path: string) => void
  onRemoveRecent: (path: string) => void
}

const Welcome: React.FC<WelcomeProps> = ({
  title,
  description,
  actions,
  recentFiles,
  onOpenRecent,
  onRemoveRecent,
}) => {
  const { t } = useTranslation(I18N_NS)

  const handleContextMenu = (e: React.MouseEvent, path: string) => {
    e.preventDefault()
    tinker.showContextMenu(e.clientX, e.clientY, [
      { label: t('open'), click: () => onOpenRecent(path) },
      { label: t('showInFolder'), click: () => tinker.showItemInPath(path) },
      { type: 'separator' },
      {
        label: t('removeFromRecent'),
        click: () => onRemoveRecent(path),
      },
    ])
  }

  return (
    <div
      className={`h-screen flex items-center justify-center ${tw.bg.secondary}`}
    >
      <div className="max-w-md w-full px-8">
        <div className="mb-8 text-center">
          <h1 className={`text-2xl font-bold mb-2 ${tw.text.primary}`}>
            {title}
          </h1>
          <p className={`text-sm ${tw.text.secondary}`}>{description}</p>
        </div>
        <div className="space-y-3 mb-8">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${tw.bg.tertiary} ${tw.hover} transition-colors border ${tw.border} ${tw.primary.hoverBorder}`}
            >
              <span className={tw.primary.text}>{action.icon}</span>
              <span className="font-medium">{action.label}</span>
            </button>
          ))}
        </div>

        {recentFiles.length > 0 && (
          <div className={`border ${tw.border} rounded-lg overflow-hidden`}>
            {recentFiles.map((path) => (
              <button
                key={path}
                onClick={() => onOpenRecent(path)}
                onContextMenu={(e) => handleContextMenu(e, path)}
                className={`w-full text-left px-2 py-1 ${tw.bg.primary} ${tw.hover} transition-colors`}
              >
                <div className={`text-sm font-medium ${tw.text.primary}`}>
                  {path.split('/').pop()}
                </div>
                <div className={`text-xs mt-0.5 ${tw.text.tertiary} truncate`}>
                  {path}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Welcome
