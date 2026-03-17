import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSpacer,
  ToolbarSearch,
  ToolbarSeparator,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { Plus, QrCode, LockOpen, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { openImageFile } from 'share/lib/util'
import { parseOtpAuthUri } from '../lib/totp'
import { decodeQRFromUrl } from '../lib/qr'
import store from '../store'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  function openAddDialogFromUri(uri: string) {
    const parsed = parseOtpAuthUri(uri)
    if (!parsed?.secret) {
      toast.error(t('noQRFound'))
      return
    }
    store.openAddDialogWithPrefill({
      issuer: parsed.issuer ?? '',
      account: parsed.account ?? '',
      secret: parsed.secret,
      algorithm: parsed.algorithm ?? 'SHA1',
      period: parsed.period ?? 30,
      digits: parsed.digits ?? 6,
    })
  }

  async function handleScan() {
    const dataUrl = await tinker.captureScreen()
    if (!dataUrl) return
    try {
      const text = await decodeQRFromUrl(dataUrl)
      openAddDialogFromUri(text)
    } catch {
      toast.error(t('noQRFound'))
    }
  }

  async function handleOpenImage() {
    const result = await openImageFile({ title: t('openImage') })
    if (!result) return
    const url = URL.createObjectURL(result.file)
    try {
      const text = await decodeQRFromUrl(url)
      openAddDialogFromUri(text)
    } catch {
      toast.error(t('noQRFound'))
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  return (
    <Toolbar>
      <ToolbarButton
        onClick={() => store.openAddDialog()}
        title={t('addAccount')}
      >
        <Plus size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={handleScan}
        menu={[
          { label: t('importUri'), click: () => store.openImportDialog() },
          {
            label: t('openImage'),
            click: () => handleOpenImage(),
          },
        ]}
        title={t('scanScreen')}
      >
        <QrCode size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarSeparator />
      <ToolbarSearch
        value={store.searchQuery}
        onChange={(v) => store.setSearchQuery(v)}
        placeholder={t('search')}
      />
      <ToolbarSpacer />
      <ToolbarButton
        onClick={() => store.openPasswordDialog()}
        title={t('passwordProtection')}
      >
        <KeyRound size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      {store.hasPassword && (
        <ToolbarButton onClick={() => store.lock()} title={t('lock')}>
          <LockOpen size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      )}
    </Toolbar>
  )
})
