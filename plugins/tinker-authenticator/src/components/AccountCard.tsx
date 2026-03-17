import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Copy, Check, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { tw } from 'share/theme'
import { confirm } from 'share/components/Confirm'
import toast from 'react-hot-toast'
import type { Account } from '../types'
import { formatCode } from '../lib/totp'
import store from '../store'

interface AccountCardProps {
  account: Account
}

export default observer(function AccountCard({ account }: AccountCardProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const code = store.getCode(account.id)
  const formattedCode = formatCode(code)
  const remaining = store.remainingSeconds(account.period)
  const progress = store.timeProgress(account.period)
  const isUrgent = remaining <= 5

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t('copyFailed'))
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: t('deleteAccount'),
      message: t('deleteConfirm', { name: account.issuer || account.account }),
    })
    if (ok) {
      store.deleteAccount(account.id)
    }
  }

  return (
    <div
      className={`rounded-lg border ${tw.border} ${tw.bg.secondary} p-3 flex flex-col gap-2`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className={`font-semibold truncate ${tw.text.primary}`}>
            {account.issuer || account.account}
          </div>
          {account.issuer && (
            <div className={`text-xs truncate mt-0.5 ${tw.text.secondary}`}>
              {account.account}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          <button
            onClick={copyCode}
            className={`p-1 rounded ${tw.hover} ${
              copied ? tw.primary.text : tw.text.secondary
            } transition-colors`}
            title={t('copy')}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
          <button
            onClick={() => store.openAddDialog(account)}
            className={`p-1 rounded ${tw.hover} ${tw.text.secondary}`}
            title={t('editAccount')}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={handleDelete}
            className={`p-1 rounded ${tw.hover} ${tw.text.secondary}`}
            title={t('deleteAccount')}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="flex items-center">
        <span
          className={`font-mono text-xl font-bold tracking-widest select-all ${
            isUrgent ? 'text-red-500' : tw.primary.text
          }`}
        >
          {formattedCode}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div
          className={`flex-1 h-1 rounded-full ${tw.bg.tertiary} overflow-hidden`}
        >
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              isUrgent ? 'bg-red-500' : tw.primary.bg
            }`}
            style={{ width: `${100 - progress}%` }}
          />
        </div>
        <span
          className={`text-xs tabular-nums w-5 text-right flex-shrink-0 ${
            isUrgent ? 'text-red-500 font-semibold' : tw.text.tertiary
          }`}
        >
          {remaining}
        </span>
      </div>
    </div>
  )
})
