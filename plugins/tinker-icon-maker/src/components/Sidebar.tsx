import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { tw } from 'share/theme'
import store from '../store'
import EditorPanel from './EditorPanel'
import ExportDialog from './ExportDialog'

const Sidebar = observer(function Sidebar() {
  const { t } = useTranslation()
  const [exportOpen, setExportOpen] = useState(false)

  return (
    <aside
      className={`w-80 shrink-0 h-full flex flex-col overflow-hidden border-r ${tw.border} ${tw.bg.tertiary}`}
    >
      <EditorPanel />

      <div className={`shrink-0 border-t p-4 ${tw.border}`}>
        <button
          type="button"
          disabled={!store.hasSource}
          className={className(
            'w-full rounded py-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed',
            tw.primary.bg,
            tw.primary.bgHover
          )}
          onClick={() => setExportOpen(true)}
        >
          {t('export')}
        </button>
      </div>

      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
    </aside>
  )
})

export default Sidebar
