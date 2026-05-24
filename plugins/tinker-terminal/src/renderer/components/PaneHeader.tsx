import { observer } from 'mobx-react-lite'
import { X, Columns2 } from 'lucide-react'
import { tw } from 'share/theme'
import { useTranslation } from 'react-i18next'
import store from '../store'

interface PaneHeaderProps {
  paneId: string
  paneIndex: number
}

export default observer(function PaneHeader({
  paneId,
  paneIndex,
}: PaneHeaderProps) {
  const title = store.paneTitles[paneId] || `Terminal ${paneIndex}`
  const { t } = useTranslation()
  const isActive = store.activePaneId === paneId

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    store.closePane(paneId)
  }

  const handleFocus = () => {
    store.setActivePane(paneId)
  }

  return (
    <div
      className={`group flex items-center h-6 px-2 shrink-0 select-none cursor-pointer ${
        isActive ? tw.bg.secondary : tw.bg.tertiary
      }`}
      style={{ borderBottom: '1px solid var(--color-border)' }}
      onMouseDown={handleFocus}
    >
      <span
        className={`flex-1 truncate text-[10px] leading-none ${
          isActive
            ? `font-semibold ${tw.text.primary}`
            : `font-medium ${tw.text.tertiary}`
        }`}
      >
        {title}
      </span>
      <div className="flex items-center gap-0.5 ml-1 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation()
            store.splitPane(paneId, 'horizontal')
          }}
          className="w-4 h-4 flex items-center justify-center rounded opacity-40 hover:opacity-100 hover:bg-white/10 transition-all"
          title={t('splitVertical')}
        >
          <Columns2 size={10} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            store.splitPane(paneId, 'vertical')
          }}
          className="w-4 h-4 flex items-center justify-center rounded opacity-40 hover:opacity-100 hover:bg-white/10 transition-all"
          title={t('splitHorizontal')}
        >
          <Columns2 size={10} className="rotate-90" />
        </button>
        <button
          onClick={handleClose}
          className="w-4 h-4 flex items-center justify-center rounded opacity-40 hover:opacity-100 hover:bg-rose-500/15 hover:text-rose-400 transition-all"
          title={t('closePane')}
        >
          <X size={10} />
        </button>
      </div>
    </div>
  )
})
