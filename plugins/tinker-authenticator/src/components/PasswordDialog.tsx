import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import Dialog, { DialogButton } from 'share/components/Dialog'
import TextInput from 'share/components/TextInput'
import { tw } from 'share/theme'
import toast from 'react-hot-toast'
import store from '../store'

export default observer(function PasswordDialog() {
  const { t } = useTranslation()
  const open = store.showPasswordDialog
  const hasPassword = store.hasPassword

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [loading, setLoading] = useState(false)

  function handleClose() {
    store.closePasswordDialog()
    setCurrentPwd('')
    setNewPwd('')
    setConfirmPwd('')
  }

  function validateNewPassword(): boolean {
    if (!newPwd) {
      toast.error(t('passwordEmpty'))
      return false
    }
    if (newPwd !== confirmPwd) {
      toast.error(t('passwordMismatch'))
      return false
    }
    return true
  }

  async function handleSet(e: React.FormEvent) {
    e.preventDefault()
    if (!validateNewPassword()) return
    setLoading(true)
    await store.setPassword(newPwd)
    setLoading(false)
    toast.success(t('passwordSet'))
    handleClose()
  }

  async function handleChange(e: React.FormEvent) {
    e.preventDefault()
    if (!validateNewPassword()) return
    setLoading(true)
    const ok = await store.changePassword(currentPwd, newPwd)
    setLoading(false)
    if (!ok) {
      toast.error(t('wrongPassword'))
    } else {
      toast.success(t('passwordChanged'))
      handleClose()
    }
  }

  async function handleRemove() {
    if (!currentPwd) {
      toast.error(t('passwordEmpty'))
      return
    }
    setLoading(true)
    const ok = await store.removePassword(currentPwd)
    setLoading(false)
    if (!ok) {
      toast.error(t('wrongPassword'))
    } else {
      toast.success(t('passwordRemoved'))
      handleClose()
    }
  }

  const title = hasPassword ? t('managePassword') : t('setPassword')

  return (
    <Dialog open={open} onClose={handleClose} title={title}>
      {!hasPassword && (
        <form onSubmit={handleSet} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={`text-sm font-medium ${tw.text.secondary}`}>
              {t('newPassword')}
            </label>
            <TextInput
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder={t('newPasswordPlaceholder')}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={`text-sm font-medium ${tw.text.secondary}`}>
              {t('confirmPassword')}
            </label>
            <TextInput
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              placeholder={t('confirmPasswordPlaceholder')}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <DialogButton variant="text" type="button" onClick={handleClose}>
              {t('cancel')}
            </DialogButton>
            <DialogButton type="submit" disabled={loading}>
              {t('setPassword')}
            </DialogButton>
          </div>
        </form>
      )}

      {hasPassword && (
        <form onSubmit={handleChange} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={`text-sm font-medium ${tw.text.secondary}`}>
              {t('currentPassword')}
            </label>
            <TextInput
              type="password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              placeholder={t('currentPasswordPlaceholder')}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={`text-sm font-medium ${tw.text.secondary}`}>
              {t('newPassword')}
            </label>
            <TextInput
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder={t('newPasswordPlaceholder')}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={`text-sm font-medium ${tw.text.secondary}`}>
              {t('confirmPassword')}
            </label>
            <TextInput
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              placeholder={t('confirmPasswordPlaceholder')}
            />
          </div>
          <div className="flex justify-between gap-2 pt-1">
            <DialogButton
              variant="text"
              type="button"
              onClick={handleRemove}
              disabled={loading}
            >
              {t('removePassword')}
            </DialogButton>
            <div className="flex gap-2">
              <DialogButton variant="text" type="button" onClick={handleClose}>
                {t('cancel')}
              </DialogButton>
              <DialogButton type="submit" disabled={loading}>
                {t('save')}
              </DialogButton>
            </div>
          </div>
        </form>
      )}
    </Dialog>
  )
})
