import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, Trash2 } from 'lucide-react'
import TextInput from 'share/components/TextInput'
import { tw } from 'share/theme'
import store from '../store'
import CopyButton from 'share/components/CopyButton'
import { confirm } from 'share/components/Confirm'
import * as kdbxweb from 'kdbxweb'

export default observer(function EntryDetail() {
  const { t } = useTranslation()

  const entry = store.selectedEntry

  if (!entry) {
    return (
      <div
        className={`h-full flex items-center justify-center text-sm ${tw.bg.tertiary} ${tw.text.both.secondary}`}
      >
        {t('noEntries')}
      </div>
    )
  }

  const handleTogglePassword = () => {
    store.togglePasswordVisibility()
  }

  const handleUpdateField = (field: string, value: string) => {
    if (field === 'Password') {
      store.updateEntry(
        entry.uuid,
        field,
        kdbxweb.ProtectedValue.fromString(value)
      )
    } else {
      store.updateEntry(entry.uuid, field, value)
    }
  }

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: t('confirmDeleteEntry'),
    })

    if (confirmed) {
      store.deleteEntry(entry.uuid)
    }
  }

  const passwordText = store.showPassword
    ? entry.password.getText()
    : '••••••••'

  return (
    <div className={`h-full overflow-y-auto ${tw.bg.tertiary}`}>
      <div className="p-4">
        <div className="max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">{entry.title}</h2>
            <button
              onClick={handleDelete}
              className={`p-2 rounded ${tw.hover.both} text-red-600 dark:text-red-400`}
              title={t('deleteEntry')}
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${tw.text.both.secondary}`}
              >
                {t('title')}
              </label>
              <TextInput
                type="text"
                value={entry.title}
                onChange={(e) => handleUpdateField('Title', e.target.value)}
                className={`focus:ring-2 ${tw.primary.focusRing}`}
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-1 ${tw.text.both.secondary}`}
              >
                {t('username')}
              </label>
              <div className="flex gap-2">
                <TextInput
                  type="text"
                  value={entry.username}
                  onChange={(e) =>
                    handleUpdateField('UserName', e.target.value)
                  }
                  className={`flex-1 min-w-0 font-mono focus:ring-2 ${tw.primary.focusRing}`}
                />
                <CopyButton text={entry.username} title={t('copyUsername')} />
              </div>
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-1 ${tw.text.both.secondary}`}
              >
                {t('password')}
              </label>
              <div className="flex gap-2">
                <div className="flex-1 min-w-0 relative">
                  <TextInput
                    type={store.showPassword ? 'text' : 'password'}
                    value={passwordText}
                    onChange={(e) =>
                      handleUpdateField('Password', e.target.value)
                    }
                    className={`pr-10 font-mono focus:ring-2 ${tw.primary.focusRing}`}
                  />
                  <button
                    onClick={handleTogglePassword}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded ${tw.hover.both}`}
                    title={
                      store.showPassword ? t('hidePassword') : t('showPassword')
                    }
                  >
                    {store.showPassword ? (
                      <Eye size={16} />
                    ) : (
                      <EyeOff size={16} />
                    )}
                  </button>
                </div>
                <CopyButton
                  text={entry.password.getText()}
                  title={t('copyPassword')}
                />
              </div>
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-1 ${tw.text.both.secondary}`}
              >
                {t('url')}
              </label>
              <TextInput
                type="text"
                value={entry.url}
                onChange={(e) => handleUpdateField('URL', e.target.value)}
                className={`focus:ring-2 ${tw.primary.focusRing}`}
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-1 ${tw.text.both.secondary}`}
              >
                {t('notes')}
              </label>
              <textarea
                value={entry.notes}
                onChange={(e) => handleUpdateField('Notes', e.target.value)}
                rows={6}
                className={`w-full px-3 py-2 rounded border ${tw.border} ${tw.bg.input} resize-none focus:outline-none focus:ring-2 ${tw.primary.focusRing}`}
              />
            </div>

            <div className={`pt-4 border-t ${tw.border}`}>
              <div className={`text-xs ${tw.text.both.secondary} space-y-1`}>
                <div>
                  {t('created')}:{' '}
                  {new Date(entry.times.creationTime).toLocaleString()}
                </div>
                <div>
                  {t('modified')}:{' '}
                  {new Date(entry.times.lastModTime).toLocaleString()}
                </div>
                <div>
                  {t('accessed')}:{' '}
                  {new Date(entry.times.lastAccessTime).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
