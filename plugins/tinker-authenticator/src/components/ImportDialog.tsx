import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import isStrBlank from 'licia/isStrBlank'
import Dialog, { DialogButton } from 'share/components/Dialog'
import { tw } from 'share/theme'
import toast from 'react-hot-toast'
import { parseOtpAuthUri } from '../lib/totp'
import store from '../store'

export default observer(function ImportDialog() {
  const { t } = useTranslation()
  const [uri, setUri] = useState('')

  function handleImport() {
    const parsed = parseOtpAuthUri(uri)
    if (!parsed || !parsed.secret) {
      toast.error(t('invalidUri'))
      return
    }

    setUri('')
    store.closeImportDialog()
    store.openAddDialogWithPrefill({
      issuer: parsed.issuer ?? '',
      account: parsed.account ?? '',
      secret: parsed.secret,
      algorithm: parsed.algorithm ?? 'SHA1',
      period: parsed.period ?? 30,
      digits: parsed.digits ?? 6,
    })
  }

  function handleClose() {
    setUri('')
    store.closeImportDialog()
  }

  return (
    <Dialog
      open={store.showImportDialog}
      onClose={handleClose}
      title={t('importUri')}
    >
      <div className="flex flex-col gap-3">
        <textarea
          value={uri}
          onChange={(e) => setUri(e.target.value)}
          placeholder="otpauth://totp/..."
          rows={3}
          className={`w-full px-3 py-2 border ${tw.border} ${tw.primary.focusBorder} rounded ${tw.bg.input} ${tw.text.primary} focus:outline-none focus:ring-1 ${tw.primary.focusRing} font-mono resize-none text-sm`}
          spellCheck={false}
        />
        <div className="flex justify-end gap-2">
          <DialogButton variant="text" onClick={handleClose}>
            {t('cancel')}
          </DialogButton>
          <DialogButton onClick={handleImport} disabled={isStrBlank(uri)}>
            {t('import')}
          </DialogButton>
        </div>
      </div>
    </Dialog>
  )
})
