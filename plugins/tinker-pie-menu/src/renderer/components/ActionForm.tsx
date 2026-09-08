import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useState, useEffect, type ComponentType } from 'react'
import isStrBlank from 'licia/isStrBlank'
import isEmpty from 'licia/isEmpty'
import fileUrl from 'licia/fileUrl'
import trim from 'licia/trim'
import { DialogButton } from 'share/components/Dialog'
import TextInput from 'share/components/TextInput'
import FileInput from 'share/components/FileInput'
import { tw } from 'share/theme'
import toast from 'react-hot-toast'
import { Monitor, Package, Play, Trash2 } from 'lucide-react'
import { confirm } from 'share/components/Confirm'
import type { ActionType, SlotActionInput } from '../types'
import { actionUsesIcon, filterByName, folderName } from '../lib/util'
import store from '../store'

const REQUIRED_MSG: Record<ActionType, string> = {
  command: 'commandRequired',
  plugin: 'pluginRequired',
  app: 'appRequired',
  directory: 'directoryRequired',
  url: 'urlRequired',
}

interface PickerItem {
  key: string
  name: string
  icon: string
}

interface ItemPickerProps {
  label: string
  selectedKey: string
  selectedName: string
  selectedIcon?: string
  placeholder: string
  searchPlaceholder: string
  loadingLabel: string
  emptyLabel: string
  items: PickerItem[]
  query: string
  onQueryChange: (query: string) => void
  loading: boolean
  FallbackIcon: ComponentType<{ size?: number; className?: string }>
  onSelect: (item: PickerItem) => void
}

function ItemPicker({
  label,
  selectedKey,
  selectedName,
  selectedIcon,
  placeholder,
  searchPlaceholder,
  loadingLabel,
  emptyLabel,
  items,
  query,
  onQueryChange,
  loading,
  FallbackIcon,
  onSelect,
}: ItemPickerProps) {
  const filtered = filterByName(items, query)

  return (
    <div className="flex flex-col gap-1.5">
      <label className={`text-xs font-medium ${tw.text.secondary}`}>
        {label}
      </label>
      <div
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded border ${tw.border} ${tw.bg.primary} mb-1 min-h-[34px]`}
      >
        {selectedKey ? (
          <>
            {selectedIcon ? (
              <img
                src={fileUrl(selectedIcon)}
                alt=""
                className="w-5 h-5 rounded shrink-0"
              />
            ) : (
              <FallbackIcon
                size={16}
                className={`shrink-0 ${tw.text.tertiary}`}
              />
            )}
            <span className={`text-xs truncate ${tw.text.primary}`}>
              {selectedName || selectedKey}
            </span>
          </>
        ) : (
          <span className={`text-xs ${tw.text.tertiary}`}>{placeholder}</span>
        )}
      </div>
      <TextInput
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={searchPlaceholder}
      />
      <div
        className={`h-36 overflow-y-auto rounded border ${tw.border} ${tw.bg.primary}`}
      >
        {loading ? (
          <p className={`text-xs px-3 py-4 text-center ${tw.text.tertiary}`}>
            {loadingLabel}
          </p>
        ) : isEmpty(filtered) ? (
          <p className={`text-xs px-3 py-4 text-center ${tw.text.tertiary}`}>
            {emptyLabel}
          </p>
        ) : (
          filtered.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left ${
                tw.hover
              } ${selectedKey === item.key ? tw.primary.bgFocused : ''}`}
              onClick={() => onSelect(item)}
            >
              {item.icon ? (
                <img
                  src={fileUrl(item.icon)}
                  alt=""
                  className="w-5 h-5 rounded shrink-0"
                />
              ) : (
                <FallbackIcon
                  size={16}
                  className={`shrink-0 ${tw.text.tertiary}`}
                />
              )}
              <span className={`text-xs truncate ${tw.text.primary}`}>
                {item.name}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

export default observer(function ActionForm() {
  const { t } = useTranslation()
  const editing = store.selectedAction
  const type = editing ? editing.type : store.formType
  const [form, setForm] = useState<SlotActionInput>({
    name: '',
    command: '',
    enabled: true,
    type: 'command',
  })
  const [apps, setApps] = useState<PickerItem[]>([])
  const [appQuery, setAppQuery] = useState('')
  const [loadingApps, setLoadingApps] = useState(false)
  const [plugins, setPlugins] = useState<PickerItem[]>([])
  const [pluginQuery, setPluginQuery] = useState('')
  const [loadingPlugins, setLoadingPlugins] = useState(false)

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        command: editing.command,
        enabled: editing.enabled,
        type: editing.type,
        appIcon: editing.appIcon,
      })
    } else {
      setForm({
        name: '',
        command: '',
        enabled: true,
        type,
        appIcon: undefined,
      })
    }
    setAppQuery('')
    setPluginQuery('')
  }, [store.selectedSlot, editing?.id, type, store.isAdding])

  useEffect(() => {
    if (type !== 'app' && type !== 'plugin') return
    let cancelled = false
    const isApp = type === 'app'
    const setLoading = isApp ? setLoadingApps : setLoadingPlugins
    setLoading(true)
    void (async () => {
      if (isApp) {
        const list = await tinker.getApps()
        if (cancelled) return
        setApps(
          list.map((app) => ({
            key: app.path,
            name: app.name,
            icon: app.icon,
          }))
        )
      } else {
        const list = await tinker.getPlugins()
        if (cancelled) return
        setPlugins(
          list.map((plugin) => ({
            key: plugin.id,
            name: plugin.name,
            icon: plugin.icon,
          }))
        )
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [type, store.selectedSlot])

  function set<
    K extends keyof SlotActionInput
  >(key: K, value: SlotActionInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function selectItem(item: PickerItem, itemType: 'app' | 'plugin') {
    setForm((f) => ({
      ...f,
      name: isStrBlank(f.name) ? item.name : f.name,
      command: item.key,
      appIcon: item.icon,
      type: itemType,
    }))
  }

  async function browseDirectory() {
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory'],
    })
    const [dirPath] = result.filePaths
    if (result.canceled || !dirPath) return
    setForm((f) => ({
      ...f,
      name: isStrBlank(f.name) ? folderName(dirPath) : f.name,
      command: dirPath,
      type: 'directory',
      appIcon: undefined,
    }))
  }

  async function handleSubmit() {
    if (isStrBlank(form.name)) {
      toast.error(t('nameRequired'))
      return
    }
    if (isStrBlank(form.command)) {
      toast.error(t(REQUIRED_MSG[type]))
      return
    }

    const input: SlotActionInput = {
      name: trim(form.name),
      command: trim(form.command),
      enabled: editing ? editing.enabled : form.enabled,
      type,
      appIcon: actionUsesIcon(type) ? form.appIcon : undefined,
    }

    await store.setSlot(store.selectedSlot, input)
    toast.success(editing ? t('actionUpdated') : t('actionAdded'))
    store.closeForm()
  }

  async function handleClear() {
    const name =
      editing?.name || t('slotLabel', { index: store.selectedSlot + 1 })
    const ok = await confirm({
      title: t('deleteConfirm', { name }),
    })
    if (ok) {
      await store.clearSlot(store.selectedSlot)
      store.closeForm()
    }
  }

  return (
    <div
      className={`flex flex-col gap-3 ${
        editing && !editing.enabled ? 'opacity-50' : ''
      }`}
    >
      <div className="flex flex-col gap-1.5">
        <label className={`text-xs font-medium ${tw.text.secondary}`}>
          {t('name')}
        </label>
        <TextInput
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder={t('namePlaceholder')}
        />
      </div>
      {type === 'command' || type === 'url' ? (
        <div className="flex flex-col gap-1.5">
          <label className={`text-xs font-medium ${tw.text.secondary}`}>
            {type === 'url' ? t('url') : t('command')}
          </label>
          <TextInput
            value={form.command}
            onChange={(e) => set('command', e.target.value)}
            placeholder={
              type === 'url' ? t('urlPlaceholder') : t('commandPlaceholder')
            }
            className="font-mono text-xs"
          />
        </div>
      ) : type === 'directory' ? (
        <div className="flex flex-col gap-1.5">
          <label className={`text-xs font-medium ${tw.text.secondary}`}>
            {t('directory')}
          </label>
          <FileInput
            value={form.command}
            onChange={(e) => set('command', e.target.value)}
            onBrowse={() => void browseDirectory()}
            placeholder={t('directoryPlaceholder')}
            inputClassName="font-mono text-xs"
          />
        </div>
      ) : type === 'plugin' ? (
        <ItemPicker
          label={t('plugin')}
          selectedKey={form.command}
          selectedName={form.name}
          selectedIcon={form.appIcon}
          placeholder={t('selectPluginPlaceholder')}
          searchPlaceholder={t('searchPlugins')}
          loadingLabel={t('loadingPlugins')}
          emptyLabel={t('noPlugins')}
          items={plugins}
          query={pluginQuery}
          onQueryChange={setPluginQuery}
          loading={loadingPlugins}
          FallbackIcon={Package}
          onSelect={(item) => selectItem(item, 'plugin')}
        />
      ) : (
        <ItemPicker
          label={t('application')}
          selectedKey={form.command}
          selectedName={form.name}
          selectedIcon={form.appIcon}
          placeholder={t('selectAppPlaceholder')}
          searchPlaceholder={t('searchApps')}
          loadingLabel={t('loadingApps')}
          emptyLabel={t('noApps')}
          items={apps}
          query={appQuery}
          onQueryChange={setAppQuery}
          loading={loadingApps}
          FallbackIcon={Monitor}
          onSelect={(item) => selectItem(item, 'app')}
        />
      )}
      <div className="flex items-center gap-2 pt-1">
        {editing && (
          <>
            <button
              type="button"
              className={`p-1.5 rounded ${tw.hover} ${tw.text.secondary}`}
              title={t('run')}
              onClick={() => void store.runSlot(store.selectedSlot)}
            >
              <Play size={14} />
            </button>
            <button
              type="button"
              className={`p-1.5 rounded ${tw.hover} ${tw.text.secondary}`}
              title={t('delete')}
              onClick={() => void handleClear()}
            >
              <Trash2 size={14} />
            </button>
            <div className="flex-1" />
          </>
        )}
        {!editing && (
          <>
            <DialogButton variant="text" onClick={() => store.closeForm()}>
              {t('cancel')}
            </DialogButton>
            <div className="flex-1" />
          </>
        )}
        <DialogButton onClick={() => void handleSubmit()}>
          {t('save')}
        </DialogButton>
      </div>
    </div>
  )
})
