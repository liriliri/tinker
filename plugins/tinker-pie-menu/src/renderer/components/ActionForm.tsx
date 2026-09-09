import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useState, useEffect, type ComponentType } from 'react'
import isStrBlank from 'licia/isStrBlank'
import isEmpty from 'licia/isEmpty'
import fileUrl from 'licia/fileUrl'
import TextInput from 'share/components/TextInput'
import FileInput from 'share/components/FileInput'
import { tw } from 'share/theme'
import { Monitor, Package } from 'lucide-react'
import { filterByName, folderName } from '../lib/util'
import store from '../store'

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
    <div className="flex flex-col gap-1.5 flex-1 min-h-0">
      <label className={`text-xs font-medium shrink-0 ${tw.text.secondary}`}>
        {label}
      </label>
      <div
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded border ${tw.border} ${tw.bg.primary} mb-1 min-h-[34px] shrink-0`}
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
      <div className="shrink-0">
        <TextInput
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={searchPlaceholder}
        />
      </div>
      <div
        className={`flex-1 min-h-0 overflow-y-auto rounded border ${tw.border} ${tw.bg.primary}`}
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
  const action = store.selectedAction
  const [apps, setApps] = useState<PickerItem[]>([])
  const [appQuery, setAppQuery] = useState('')
  const [loadingApps, setLoadingApps] = useState(false)
  const [plugins, setPlugins] = useState<PickerItem[]>([])
  const [pluginQuery, setPluginQuery] = useState('')
  const [loadingPlugins, setLoadingPlugins] = useState(false)

  const type = action?.type

  useEffect(() => {
    setAppQuery('')
    setPluginQuery('')
  }, [store.selectedSlot, store.selectedRing, action?.id])

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
  }, [type, store.selectedSlot, store.selectedRing])

  if (!action || !type) return null

  function patch(partial: Parameters<typeof store.patchSlot>[1]) {
    store.patchSlot(store.selectedSlot, partial)
  }

  function selectItem(item: PickerItem, itemType: 'app' | 'plugin') {
    patch({
      name: isStrBlank(action!.name) ? item.name : action!.name,
      command: item.key,
      appIcon: item.icon,
      type: itemType,
    })
  }

  async function browseDirectory() {
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory'],
    })
    const [dirPath] = result.filePaths
    if (result.canceled || !dirPath) return
    patch({
      name: isStrBlank(action!.name) ? folderName(dirPath) : action!.name,
      command: dirPath,
      type: 'directory',
      appIcon: undefined,
    })
  }

  return (
    <div
      className={`h-full min-h-0 flex flex-col gap-3 ${
        action.enabled ? '' : 'opacity-50'
      }`}
    >
      <div className="flex flex-col gap-1.5 shrink-0">
        <label className={`text-xs font-medium ${tw.text.secondary}`}>
          {t('name')}
        </label>
        <TextInput
          value={action.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder={t('namePlaceholder')}
        />
      </div>
      {type === 'command' || type === 'url' ? (
        <div className="flex flex-col gap-1.5 shrink-0">
          <label className={`text-xs font-medium ${tw.text.secondary}`}>
            {type === 'url' ? t('url') : t('command')}
          </label>
          <TextInput
            value={action.command}
            onChange={(e) => patch({ command: e.target.value })}
            placeholder={
              type === 'url' ? t('urlPlaceholder') : t('commandPlaceholder')
            }
            className="font-mono text-xs"
          />
        </div>
      ) : type === 'directory' ? (
        <div className="flex flex-col gap-1.5 shrink-0">
          <label className={`text-xs font-medium ${tw.text.secondary}`}>
            {t('directory')}
          </label>
          <FileInput
            value={action.command}
            onChange={(e) => patch({ command: e.target.value })}
            onBrowse={() => void browseDirectory()}
            placeholder={t('directoryPlaceholder')}
            inputClassName="font-mono text-xs"
          />
        </div>
      ) : type === 'plugin' ? (
        <ItemPicker
          label={t('plugin')}
          selectedKey={action.command}
          selectedName={action.name}
          selectedIcon={action.appIcon}
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
          selectedKey={action.command}
          selectedName={action.name}
          selectedIcon={action.appIcon}
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
    </div>
  )
})
