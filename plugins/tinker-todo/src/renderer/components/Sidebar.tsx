import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  List,
  Calendar,
  Star,
  CheckCircle2,
  FolderOpen,
  RefreshCw,
} from 'lucide-react'
import store, { FilterType } from '../store'
import { tw } from 'share/theme'

interface CategoryItem {
  id: FilterType
  icon: typeof List
  labelKey: string
  getCount: () => number
}

const categories: CategoryItem[] = [
  {
    id: 'all',
    icon: List,
    labelKey: 'all',
    getCount: () => store.stats.total,
  },
  {
    id: 'today',
    icon: Calendar,
    labelKey: 'today',
    getCount: () => store.stats.today,
  },
  {
    id: 'important',
    icon: Star,
    labelKey: 'important',
    getCount: () => store.stats.important,
  },
  {
    id: 'completed',
    icon: CheckCircle2,
    labelKey: 'completed',
    getCount: () => store.stats.completed,
  },
]

export default observer(function Sidebar() {
  const { t } = useTranslation()

  const handleSelectFile = async () => {
    const result = await tinker.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })

    if (result && result.filePaths && result.filePaths.length > 0) {
      await store.setFilePath(result.filePaths[0])
    }
  }

  const getFileName = () => {
    if (!store.filePath) return 'No file'
    const parts = store.filePath.split('/')
    return parts[parts.length - 1]
  }

  return (
    <div
      className={`w-52 ${tw.bg.secondary} ${tw.border.right} flex flex-col flex-shrink-0`}
    >
      <div
        className={`h-14 px-4 ${tw.border.bottom} flex items-center flex-shrink-0`}
      >
        <h1
          className={`text-lg font-semibold ${tw.text.primary} flex items-center gap-2`}
        >
          <CheckCircle2 size={20} className={tw.primary.text} />
          {t('title')}
        </h1>
      </div>

      <div className={`p-3 ${tw.border.bottom}`}>
        <div className={`text-xs ${tw.text.secondary} mb-1.5`}>{t('file')}</div>
        <div
          className={`text-xs ${tw.text.primary} mb-2 truncate`}
          title={store.filePath}
        >
          {getFileName()}
        </div>
        <div className="flex gap-1.5">
          <button
            className={`flex-1 px-2 py-1.5 text-xs ${tw.text.secondary} ${tw.bg.hover} rounded-md transition-colors flex items-center justify-center gap-1`}
            onClick={handleSelectFile}
          >
            <FolderOpen size={12} />
            {t('selectFile')}
          </button>
          <button
            className={`px-2 py-1.5 text-xs ${tw.text.secondary} ${tw.bg.hover} rounded-md transition-colors`}
            onClick={() => store.reloadTodos()}
            title={t('reload')}
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-0.5">
          {categories.map((category) => {
            const Icon = category.icon
            const isActive = store.currentFilter === category.id

            return (
              <button
                key={category.id}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                  isActive
                    ? `${tw.primary.bg} ${tw.primary.textOnBg} shadow-sm`
                    : `${tw.bg.hover} ${tw.text.primary}`
                }`}
                onClick={() => store.setCurrentFilter(category.id)}
              >
                <Icon size={16} />
                <span className="flex-1 text-left font-medium">
                  {t(category.labelKey)}
                </span>
                <span
                  className={`text-xs font-semibold tabular-nums min-w-[20px] text-right ${
                    isActive ? 'opacity-70' : tw.text.secondary
                  }`}
                >
                  {category.getCount()}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className={`p-3 ${tw.border.top}`}>
        <button
          className={`w-full px-3 py-1.5 text-xs ${tw.text.secondary} ${tw.bg.hover} rounded-md transition-colors`}
          onClick={() => store.clearCompleted()}
        >
          {t('clearCompleted')}
        </button>
      </div>
    </div>
  )
})
