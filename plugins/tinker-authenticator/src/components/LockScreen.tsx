import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Lock } from 'lucide-react'
import { tw } from 'share/theme'
import { DialogButton } from 'share/components/Dialog'
import TextInput from 'share/components/TextInput'
import toast from 'react-hot-toast'
import store from '../store'

export default observer(function LockScreen() {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    const ok = await store.unlock(password)
    setLoading(false)
    if (!ok) {
      toast.error(t('wrongPassword'))
    } else {
      setPassword('')
    }
  }

  return (
    <div
      className={`h-screen flex flex-col items-center justify-center gap-6 transition-colors ${tw.bg.primary}`}
    >
      <div className="flex flex-col items-center gap-2">
        <Lock size={40} className={tw.text.tertiary} />
        <p className={`text-sm ${tw.text.tertiary}`}>{t('lockedHint')}</p>
      </div>

      <form onSubmit={handleUnlock} className="flex flex-col gap-3 w-64">
        <TextInput
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('passwordPlaceholder')}
          autoFocus
        />
        <DialogButton type="submit" disabled={loading || !password}>
          {t('unlock')}
        </DialogButton>
      </form>
    </div>
  )
})
