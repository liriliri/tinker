import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import isStrBlank from 'licia/isStrBlank'
import Dialog, { DialogButton } from 'share/components/Dialog'
import TextInput from 'share/components/TextInput'
import Select from 'share/components/Select'
import type { SelectOption } from 'share/components/Select'
import { tw } from 'share/theme'
import toast from 'react-hot-toast'
import type { Account, OTPAlgorithm } from '../types'
import { normalizeSecret } from '../lib/totp'
import store from '../store'

type FormData = Omit<Account, 'id'>

const DEFAULT_FORM: FormData = {
  issuer: '',
  account: '',
  secret: '',
  algorithm: 'SHA1',
  period: 30,
  digits: 6,
}

const ALGORITHM_OPTIONS: SelectOption<OTPAlgorithm>[] = [
  { label: 'SHA-1', value: 'SHA1' },
  { label: 'SHA-256', value: 'SHA256' },
  { label: 'SHA-512', value: 'SHA512' },
]

const PERIOD_OPTIONS: SelectOption<number>[] = [
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
]

const DIGITS_OPTIONS: SelectOption<number>[] = [
  { label: '6', value: 6 },
  { label: '8', value: 8 },
]

export default observer(function AddDialog() {
  const { t } = useTranslation()
  const editing = store.editingAccount

  const [form, setForm] = useState<FormData>(DEFAULT_FORM)

  useEffect(() => {
    if (store.showAddDialog) {
      if (editing) {
        setForm({
          issuer: editing.issuer,
          account: editing.account,
          secret: editing.secret,
          algorithm: editing.algorithm,
          period: editing.period,
          digits: editing.digits,
        })
      } else if (store.prefillData) {
        setForm({ ...store.prefillData })
      } else {
        setForm(DEFAULT_FORM)
      }
    }
  }, [store.showAddDialog, editing, store.prefillData])

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit() {
    if (isStrBlank(form.secret)) {
      toast.error(t('secretRequired'))
      return
    }
    if (isStrBlank(form.account) && isStrBlank(form.issuer)) {
      toast.error(t('nameRequired'))
      return
    }

    const data: Omit<Account, 'id'> = {
      issuer: form.issuer.trim(),
      account: form.account.trim(),
      secret: normalizeSecret(form.secret),
      algorithm: form.algorithm,
      period: form.period,
      digits: form.digits,
    }

    if (editing) {
      store.updateAccount(editing.id, data)
      toast.success(t('accountUpdated'))
    } else {
      store.addAccount(data)
      toast.success(t('accountAdded'))
    }
    store.closeAddDialog()
  }

  return (
    <Dialog
      open={store.showAddDialog}
      onClose={() => store.closeAddDialog()}
      title={editing ? t('editAccount') : t('addAccount')}
      showClose
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={`text-sm font-medium ${tw.text.secondary}`}>
            {t('issuer')}
          </label>
          <TextInput
            value={form.issuer}
            onChange={(e) => set('issuer', e.target.value)}
            placeholder={t('issuerPlaceholder')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={`text-sm font-medium ${tw.text.secondary}`}>
            {t('accountLabel')}
          </label>
          <TextInput
            value={form.account}
            onChange={(e) => set('account', e.target.value)}
            placeholder={t('accountPlaceholder')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={`text-sm font-medium ${tw.text.secondary}`}>
            {t('secret')} <span className="text-red-500">*</span>
          </label>
          <TextInput
            value={form.secret}
            onChange={(e) => set('secret', e.target.value)}
            placeholder={t('secretPlaceholder')}
            className="font-mono"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={`text-sm font-medium ${tw.text.secondary}`}>
              {t('algorithm')}
            </label>
            <Select<OTPAlgorithm>
              value={form.algorithm}
              onChange={(v) => set('algorithm', v)}
              options={ALGORITHM_OPTIONS}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={`text-sm font-medium ${tw.text.secondary}`}>
              {t('period')}
            </label>
            <Select<number>
              value={form.period}
              onChange={(v) => set('period', v)}
              options={PERIOD_OPTIONS}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={`text-sm font-medium ${tw.text.secondary}`}>
              {t('digits')}
            </label>
            <Select<number>
              value={form.digits}
              onChange={(v) => set('digits', v)}
              options={DIGITS_OPTIONS}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <DialogButton variant="text" onClick={() => store.closeAddDialog()}>
            {t('cancel')}
          </DialogButton>
          <DialogButton onClick={handleSubmit}>
            {editing ? t('save') : t('add')}
          </DialogButton>
        </div>
      </div>
    </Dialog>
  )
})
