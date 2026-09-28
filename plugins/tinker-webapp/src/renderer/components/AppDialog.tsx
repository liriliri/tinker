import { observer } from 'mobx-react-lite'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import capitalize from 'licia/capitalize'
import debounce from 'licia/debounce'
import fileUrl from 'licia/fileUrl'
import isErr from 'licia/isErr'
import map from 'licia/map'
import startWith from 'licia/startWith'
import toStr from 'licia/toStr'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import Dialog, { DialogButton } from 'share/components/Dialog'
import Select from 'share/components/Select'
import TextInput from 'share/components/TextInput'
import { tw } from 'share/theme'
import {
  PLUGIN_CATEGORIES,
  PLUGIN_PREFIX,
  type PluginCategory,
} from '../../common/types'
import store from '../store'

function toSlugPart(id: string) {
  return startWith(id, PLUGIN_PREFIX) ? id.slice(PLUGIN_PREFIX.length) : id
}

export default observer(function AppDialog() {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [url, setUrl] = useState('https://')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<PluginCategory>('productivity')
  const [iconPath, setIconPath] = useState('')
  const [iconLoading, setIconLoading] = useState(false)
  const [error, setError] = useState('')
  const editing = store.editing
  const iconManualRef = useRef(false)
  const fetchSeqRef = useRef(0)

  const categoryOptions = useMemo(
    () =>
      map(PLUGIN_CATEGORIES, (value) => ({
        value,
        label: t(`category${capitalize(value)}`),
      })),
    [t]
  )

  const scheduleFetchIcon = useMemo(
    () =>
      debounce((pageUrl: string) => {
        void (async () => {
          if (iconManualRef.current) return
          const seq = ++fetchSeqRef.current
          setIconLoading(true)
          try {
            const path = await webapp.fetchIcon(pageUrl)
            if (seq !== fetchSeqRef.current || iconManualRef.current) return
            if (path) {
              setIconPath(path)
            }
          } finally {
            if (seq === fetchSeqRef.current) {
              setIconLoading(false)
            }
          }
        })()
      }, 600),
    []
  )

  useEffect(() => {
    if (!store.dialogOpen) return
    fetchSeqRef.current += 1
    setIconLoading(false)
    if (editing) {
      setName(editing.name)
      setSlug(toSlugPart(editing.id))
      setSlugTouched(true)
      setUrl(editing.url)
      setDescription(editing.description)
      setCategory(editing.category)
      setIconPath(editing.icon)
      iconManualRef.current = !!editing.icon
    } else {
      setName('')
      setSlug('')
      setSlugTouched(false)
      setUrl('https://')
      setDescription('')
      setCategory('productivity')
      setIconPath('')
      iconManualRef.current = false
    }
    setError('')
  }, [store.dialogOpen, editing])

  const handleNameChange = (value: string) => {
    setName(value)
    if (editing || slugTouched) return
    setSlug(webapp.suggestSlug(value))
  }

  const handleUrlChange = (value: string) => {
    setUrl(value)
    if (!iconManualRef.current) {
      scheduleFetchIcon(value)
    }
  }

  const pickIcon = async () => {
    const result = await tinker.showOpenDialog({
      properties: ['openFile'],
      filters: [
        {
          name: 'Images',
          extensions: ['png', 'jpg', 'jpeg', 'ico', 'webp', 'svg'],
        },
      ],
    })
    if (!result.canceled && result.filePaths[0]) {
      iconManualRef.current = true
      fetchSeqRef.current += 1
      setIconLoading(false)
      setIconPath(result.filePaths[0])
    }
  }

  const clearIcon = () => {
    iconManualRef.current = false
    setIconPath('')
    scheduleFetchIcon(url)
  }

  const handleSave = async () => {
    setError('')
    try {
      await store.save({
        id: editing ? undefined : slug,
        name,
        url,
        description,
        category,
        iconPath: iconPath || undefined,
      })
    } catch (e) {
      setError(isErr(e) ? e.message : toStr(e))
    }
  }

  return (
    <Dialog
      open={store.dialogOpen}
      onClose={() => store.closeDialog()}
      title={editing ? t('editApp') : t('addApp')}
      showClose
      className="w-[640px]"
    >
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-stretch gap-3">
          <div className="relative w-40 shrink-0">
            <button
              type="button"
              className={`flex h-full w-full items-center justify-center overflow-hidden rounded-xl border border-dashed ${tw.border} ${tw.bg.primary} ${tw.text.tertiary} ${tw.hover}`}
              onClick={() => void pickIcon()}
              title={t('pickIcon')}
            >
              {iconPath ? (
                <img
                  src={fileUrl(iconPath)}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                />
              ) : iconLoading ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <ImagePlus size={22} />
              )}
            </button>
            {iconPath ? (
              <button
                type="button"
                className={`absolute right-1.5 top-1.5 rounded-md p-1.5 ${tw.bg.primary} ${tw.text.secondary} ${tw.hover}`}
                onClick={clearIcon}
                title={t('removeIcon')}
              >
                <Trash2 size={14} />
              </button>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex gap-3">
              <label className="block min-w-0 flex-1">
                <span className={`mb-1 block text-sm ${tw.text.secondary}`}>
                  {t('name')}
                </span>
                <TextInput
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={t('namePlaceholder')}
                  autoFocus
                />
              </label>
              <label className="block min-w-0 flex-1">
                <span className={`mb-1 block text-sm ${tw.text.secondary}`}>
                  {t('id')}
                </span>
                <TextInput
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    setSlug(e.target.value)
                  }}
                  placeholder={t('idPlaceholder')}
                  disabled={!!editing}
                />
              </label>
            </div>

            <div className="flex gap-3">
              <label className="block min-w-0 flex-1">
                <span className={`mb-1 block text-sm ${tw.text.secondary}`}>
                  {t('url')}
                </span>
                <TextInput
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://example.com"
                />
              </label>
              <label className="block min-w-0 flex-1">
                <span className={`mb-1 block text-sm ${tw.text.secondary}`}>
                  {t('category')}
                </span>
                <Select
                  className="w-full h-[34px]"
                  value={category}
                  onChange={setCategory}
                  options={categoryOptions}
                />
              </label>
            </div>

            <label className="block">
              <span className={`mb-1 block text-sm ${tw.text.secondary}`}>
                {t('description')}
              </span>
              <TextInput
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('descriptionPlaceholder')}
              />
            </label>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-500 dark:text-red-400">{error}</div>
        )}

        <div className="mt-2 flex justify-end">
          <DialogButton
            variant="primary"
            disabled={store.saving}
            onClick={() => void handleSave()}
          >
            {store.saving ? t('saving') : t('save')}
          </DialogButton>
        </div>
      </div>
    </Dialog>
  )
})
