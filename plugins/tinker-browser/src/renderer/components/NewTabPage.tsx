import { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import Dialog, { DialogButton } from 'share/components/Dialog'
import type { ISite } from '../types'
import store from '../store'

const SiteCard = observer(function SiteCard({ site }: { site: ISite }) {
  const { t } = useTranslation()
  const favicon = store.favicons.get(site.id)

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    tinker.showContextMenu(e.clientX, e.clientY, [
      {
        label: t('edit'),
        click: () => store.openSiteDialog(site),
      },
      { type: 'separator' },
      {
        label: t('delete'),
        click: () => store.removeSite(site.id),
      },
    ])
  }

  return (
    <button
      className={`flex flex-col items-center gap-2 w-20 p-2 rounded-lg ${tw.hover} transition-colors`}
      onClick={() => store.navigate(site.url)}
      onContextMenu={handleContextMenu}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center ${tw.bg.tertiary} overflow-hidden`}
      >
        {favicon ? (
          <img src={favicon} alt="" className="w-8 h-8 object-contain" />
        ) : (
          <span className={`text-lg font-medium ${tw.text.secondary}`}>
            {site.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <span
        className={`text-xs ${tw.text.secondary} truncate w-full text-center`}
      >
        {site.name}
      </span>
    </button>
  )
})

function AddButton() {
  const { t } = useTranslation()

  return (
    <button
      className={`flex flex-col items-center gap-2 w-20 p-2 rounded-lg ${tw.hover} transition-colors`}
      onClick={() => store.openSiteDialog()}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center ${tw.bg.tertiary}`}
      >
        <Plus size={20} className={tw.text.tertiary} />
      </div>
      <span className={`text-xs ${tw.text.tertiary}`}>{t('addSite')}</span>
    </button>
  )
}

const SiteDialog = observer(function SiteDialog() {
  const { t } = useTranslation()
  const isEdit = !!store.editingSite
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (store.showSiteDialog && store.editingSite) {
      setName(store.editingSite.name)
      setUrl(store.editingSite.url)
    } else {
      setName('')
      setUrl('')
    }
  }, [store.showSiteDialog])

  const handleSave = () => {
    const trimmedName = name.trim()
    const trimmedUrl = url.trim()
    if (!trimmedName || !trimmedUrl) return

    if (isEdit && store.editingSite) {
      store.updateSite(store.editingSite.id, trimmedName, trimmedUrl)
    } else {
      store.addSite(trimmedName, trimmedUrl)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    }
  }

  const inputClassName = `w-full px-3 py-2 text-sm rounded border ${tw.border} ${tw.bg.input} ${tw.text.primary} focus:outline-none focus:ring-2 ${tw.primary.focusRing}`

  return (
    <Dialog
      open={store.showSiteDialog}
      onClose={() => store.closeSiteDialog()}
      title={isEdit ? t('editSite') : t('addSite')}
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className={`block text-sm mb-1 ${tw.text.secondary}`}>
            {t('siteName')}
          </label>
          <input
            type="text"
            className={inputClassName}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>
        <div>
          <label className={`block text-sm mb-1 ${tw.text.secondary}`}>
            {t('siteUrl')}
          </label>
          <input
            type="text"
            className={inputClassName}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="example.com"
          />
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <DialogButton variant="text" onClick={() => store.closeSiteDialog()}>
            {t('cancel')}
          </DialogButton>
          <DialogButton
            onClick={handleSave}
            disabled={!name.trim() || !url.trim()}
          >
            {t('save')}
          </DialogButton>
        </div>
      </div>
    </Dialog>
  )
})

export default observer(function NewTabPage() {
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center ${tw.bg.primary}`}
    >
      <div className="flex flex-wrap justify-center gap-4 max-w-md">
        {store.sites.map((site) => (
          <SiteCard key={site.id} site={site} />
        ))}
        <AddButton />
      </div>
      <SiteDialog />
    </div>
  )
})
