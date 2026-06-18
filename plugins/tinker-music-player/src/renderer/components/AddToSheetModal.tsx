import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Dialog } from '@headlessui/react'
import { Music } from 'lucide-react'
import { tw } from 'share/theme'
import store from '../store'

const AddToSheetModal = observer(() => {
  const { t } = useTranslation()
  const isOpen = store.addToSheetTrackId !== ''
  const sheets = store.sheets

  const handleSelect = (sheetId: string) => {
    store.addTrackToSheet(store.addToSheetTrackId, sheetId)
    store.hideAddToSheet()
  }

  return (
    <Dialog open={isOpen} onClose={() => store.hideAddToSheet()}>
      <div className="fixed inset-0 bg-black/30 z-[100]" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center z-[100]">
        <Dialog.Panel
          className={`${tw.bg.primary} border ${tw.border} rounded-lg shadow-xl w-72 max-h-96 flex flex-col overflow-hidden`}
        >
          <Dialog.Title
            className={`px-4 py-3 text-sm font-medium border-b ${tw.border} ${tw.text.primary}`}
          >
            {t('addToSheet')}
          </Dialog.Title>
          <div className="overflow-y-auto flex-1 py-1">
            {sheets.map((sheet) => (
              <button
                key={sheet.id}
                className={`w-full px-4 py-2 text-left text-sm ${tw.hover} ${tw.text.primary} flex items-center gap-2 transition-colors`}
                onClick={() => handleSelect(sheet.id)}
              >
                <Music className="w-4 h-4 shrink-0 opacity-60" />
                <span className="truncate">
                  {sheet.id === 'favorite' ? t('favorite') : sheet.title}
                </span>
                <span className={`ml-auto text-xs ${tw.text.tertiary}`}>
                  {sheet.trackIds.length}
                </span>
              </button>
            ))}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
})

export default AddToSheetModal
