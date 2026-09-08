import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useState, useEffect, type ComponentType } from 'react'
import isStrBlank from 'licia/isStrBlank'
import isEmpty from 'licia/isEmpty'
import fileUrl from 'licia/fileUrl'
import trim from 'licia/trim'
import Dialog, { DialogButton } from 'share/components/Dialog'
import TextInput from 'share/components/TextInput'
import FileInput from 'share/components/FileInput'
import { tw } from 'share/theme'
import toast from 'react-hot-toast'
import { Monitor, Package } from 'lucide-react'
import type { ActionInput, ActionType } from '../types'
import { actionUsesIcon, filterByName, folderName } from '../lib/util'
import store from '../store'
import ShortcutInput from './ShortcutInput'

const ADD_TITLE: Record<ActionType, string> = {
  command: 'addCommand',
  plugin: 'addPlugin',
  app: 'addApp',
  directory: 'addDirectory',
  url: 'addUrl',
}

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
      <label className={`text-sm font-medium ${tw.text.secondary}`}>
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

export default observer(function ActionDialog() {
  const { t } = useTranslation()
  const editing = store.editingAction
  const type = store.dialogType
  const [form, setForm] = useState<ActionInput>({
    name: '',
    shortcut: '',
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
    if (!store.showDialog) return
    if (editing) {
      setForm({
        name: editing.name,
        shortcut: editing.shortcut,
        command: editing.command,
        enabled: editing.enabled,
        type: editing.type,
        appIcon: editing.appIcon,
      })
    } else {
      setForm({
        name: '',
        shortcut: '',
        command: '',
        enabled: true,
        type,
        appIcon: undefined,
      })
    }
    setAppQuery('')
    setPluginQuery('')
  }, [store.showDialog, editing, type])

  useEffect(() => {
    if (!store.showDialog || type !== 'app') return
    let cancelled = false
    setLoadingApps(true)
    void tinker.getApps().then((list) => {
      if (cancelled) return
      setApps(
        list.map((app) => ({
          key: app.path,
          name: app.name,
          icon: app.icon,
        }))
      )
      setLoadingApps(false)
    })
    return () => {
      cancelled = true
    }
  }, [store.showDialog, type])

  useEffect(() => {
    if (!store.showDialog || type !== 'plugin') return
    let cancelled = false
    setLoadingPlugins(true)
    void tinker.getPlugins().then((list) => {
      if (cancelled) return
      setPlugins(
        list.map((plugin) => ({
          key: plugin.id,
          name: plugin.name,
          icon: plugin.icon,
        }))
      )
      setLoadingPlugins(false)
    })
    return () => {
      cancelled = true
    }
  }, [store.showDialog, type])

  function set<K extends keyof ActionInput>(key: K, value: ActionInput[K]) {
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
    if (isStrBlank(form.shortcut)) {
      toast.error(t('shortcutRequired'))
      return
    }
    if (isStrBlank(form.command)) {
      toast.error(t(REQUIRED_MSG[type]))
      return
    }

    const input: ActionInput = {
      name: trim(form.name),
      shortcut: trim(form.shortcut),
      command: trim(form.command),
      enabled: form.enabled,
      type,
      appIcon: actionUsesIcon(type) ? form.appIcon : undefined,
    }

    if (editing) {
      await store.updateAction(editing.id, input)
      toast.success(t('actionUpdated'))
    } else {
      await store.addAction(input)
      toast.success(t('actionAdded'))
    }
    store.closeDialog()
  }

  return (
    <Dialog
      open={store.showDialog}
      onClose={() => store.closeDialog()}
      title={editing ? t('editAction') : t(ADD_TITLE[type])}
      showClose
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5 min-w-0">
            <label className={`text-sm font-medium ${tw.text.secondary}`}>
              {t('name')}
            </label>
            <TextInput
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder={t('namePlaceholder')}
            />
          </div>
          <div className="flex flex-col gap-1.5 min-w-0">
            <label className={`text-sm font-medium ${tw.text.secondary}`}>
              {t('shortcut')}
            </label>
            <ShortcutInput
              value={form.shortcut}
              onChange={(value) => set('shortcut', value)}
            />
          </div>
        </div>
        {type === 'command' || type === 'url' ? (
          <div className="flex flex-col gap-1.5">
            <label className={`text-sm font-medium ${tw.text.secondary}`}>
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
            <label className={`text-sm font-medium ${tw.text.secondary}`}>
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
        <div className="flex justify-end gap-2 pt-1">
          <DialogButton onClick={() => void handleSubmit()}>
            {t('save')}
          </DialogButton>
        </div>
      </div>
    </Dialog>
  )
})
