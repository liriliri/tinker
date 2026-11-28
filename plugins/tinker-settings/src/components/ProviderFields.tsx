import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Plus, X, RotateCw, Loader2 } from 'lucide-react'
import contain from 'licia/contain'
import concat from 'licia/concat'
import filter from 'licia/filter'
import isEmpty from 'licia/isEmpty'
import isStrBlank from 'licia/isStrBlank'
import lowerCase from 'licia/lowerCase'
import map from 'licia/map'
import some from 'licia/some'
import trim from 'licia/trim'
import { tw } from 'share/theme'
import TextInput from 'share/components/TextInput'
import {
  Toolbar,
  ToolbarButton,
  ToolbarLabel,
  ToolbarSearch,
  ToolbarSpacer,
  ToolbarTextInput,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import type { AiImageProvider, AiMode, AiProvider } from '../types'
import { fetchOpenAiModels } from '../lib/aiProvider'

interface ProviderFieldsProps {
  mode: AiMode
  value: AiProvider | AiImageProvider
  onChange: (patch: Partial<AiProvider | AiImageProvider>) => void
}

function modelPlaceholder(mode: AiMode, apiType: string): string {
  if (mode === 'image') {
    const placeholders: Record<string, string> = {
      gemini: 'gemini-3.1-flash-image',
      volcengine: 'doubao-seedream-5-0-pro-260628',
      openrouter: 'google/gemini-3.1-flash-image',
    }
    return placeholders[apiType] || 'gpt-image-1'
  }
  return apiType === 'claude' ? 'claude-opus-4-5' : 'gpt-4o'
}

function canFetchModels(apiType: string): boolean {
  return apiType === 'openai' || apiType === 'openrouter'
}

const MODEL_LIST_CLASS = 'flex-1 min-h-0 overflow-y-auto py-1'
const MODEL_ROW_CLASS =
  'group flex items-center gap-2 h-8 px-2.5 mx-1 rounded-md'
const MODEL_NAME_CLASS = 'flex-1 min-w-0 truncate font-mono text-xs'
const MODEL_ACTION_CLASS =
  'flex-shrink-0 p-1 rounded opacity-60 group-hover:opacity-100'
const PANE_CLASS = `flex flex-col min-h-0 rounded-md border overflow-hidden ${tw.border} ${tw.bg.secondary}`

function PaneEmpty({ children }: { children: ReactNode }) {
  return (
    <div
      className={`flex-1 flex items-center justify-center px-3 text-center text-xs ${tw.text.tertiary}`}
    >
      {children}
    </div>
  )
}

function ApiKeyInput({
  value,
  onChange,
  className = '',
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const { t } = useTranslation()
  const [showApiKey, setShowApiKey] = useState(false)

  return (
    <div className={`relative ${className}`}>
      <TextInput
        type={showApiKey ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('apiKey')}
        className="w-full pr-8"
      />
      <button
        type="button"
        onClick={() => setShowApiKey(!showApiKey)}
        className={`absolute right-2 top-1/2 -translate-y-1/2 ${tw.text.tertiary} hover:text-gray-600 dark:hover:text-gray-300`}
        title={showApiKey ? t('hideApiKey') : t('showApiKey')}
      >
        {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  )
}

export default function ProviderFields({
  mode,
  value,
  onChange,
}: ProviderFieldsProps) {
  const { t } = useTranslation()
  const [newModelId, setNewModelId] = useState('')
  const [catalog, setCatalog] = useState(() => map(value.models, (m) => m.name))
  const [availableQuery, setAvailableQuery] = useState('')
  const [updating, setUpdating] = useState(false)

  const placeholder = modelPlaceholder(mode, value.apiType)
  const showCatalog = mode === 'chat'
  const canFetch = showCatalog && canFetchModels(value.apiType)

  const selected = useMemo(
    () => new Set(map(value.models, (m) => lowerCase(m.name))),
    [value.models]
  )

  const availableRows = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const id of catalog) {
      const name = trim(id)
      if (!name) continue
      const key = lowerCase(name)
      if (seen.has(key)) continue
      seen.add(key)
      out.push(name)
    }
    return out
  }, [catalog])

  const visibleAvailable = useMemo(() => {
    const needle = lowerCase(trim(availableQuery))
    if (isEmpty(needle)) return availableRows
    return filter(availableRows, (id) => contain(lowerCase(id), needle))
  }, [availableQuery, availableRows])

  const setModels = (names: string[]) => {
    onChange({ models: map(names, (name) => ({ name })) })
  }

  const addFromAvailable = (id: string) => {
    if (selected.has(lowerCase(id))) return
    setModels(
      concat(
        map(value.models, (m) => m.name),
        [id]
      )
    )
  }

  const removeModel = (id: string) => {
    const key = lowerCase(id)
    setModels(
      map(
        filter(value.models, (m) => lowerCase(m.name) !== key),
        (m) => m.name
      )
    )
  }

  const handleAddModel = () => {
    const name = trim(newModelId)
    if (isStrBlank(name)) return
    if (!selected.has(lowerCase(name))) {
      setModels(
        concat(
          map(value.models, (m) => m.name),
          [name]
        )
      )
    }
    if (
      showCatalog &&
      !some(catalog, (id) => lowerCase(id) === lowerCase(name))
    ) {
      setCatalog(concat(catalog, [name]))
    }
    setNewModelId('')
  }

  const handleFetchModels = async () => {
    if (isStrBlank(value.apiKey)) {
      toast.error(t('apiKeyRequired'))
      return
    }
    if (isStrBlank(value.apiUrl)) {
      toast.error(t('apiUrlRequired'))
      return
    }
    setUpdating(true)
    try {
      const models = await fetchOpenAiModels(value.apiUrl, value.apiKey)
      setCatalog(map(models, (m) => m.name))
      toast.success(t('modelsUpdated', { count: models.length }))
    } catch {
      toast.error(t('updateModelsFailed'))
    } finally {
      setUpdating(false)
    }
  }

  const setApiKey = (apiKey: string) => onChange({ apiKey })

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      {showCatalog ? (
        <div className="grid grid-cols-2 gap-3 flex-none">
          <div className="flex flex-col gap-1.5 min-w-0">
            <label className={`text-xs font-medium ${tw.text.secondary}`}>
              {t('apiUrl')}
            </label>
            <TextInput
              value={value.apiUrl}
              readOnly
              className={`${tw.text.secondary} cursor-default`}
            />
          </div>
          <div className="flex flex-col gap-1.5 min-w-0">
            <label className={`text-xs font-medium ${tw.text.secondary}`}>
              {t('apiKey')}
            </label>
            <ApiKeyInput value={value.apiKey} onChange={setApiKey} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 flex-none">
          <div className="flex items-center gap-3">
            <label className={`w-20 shrink-0 text-sm ${tw.text.primary}`}>
              {t('apiUrl')}
            </label>
            <TextInput
              value={value.apiUrl}
              readOnly
              className={`flex-1 min-w-0 ${tw.text.secondary} cursor-default`}
            />
          </div>
          <div className="flex items-center gap-3">
            <label className={`w-20 shrink-0 text-sm ${tw.text.primary}`}>
              {t('apiKey')}
            </label>
            <ApiKeyInput
              value={value.apiKey}
              onChange={setApiKey}
              className="flex-1 min-w-0"
            />
          </div>
        </div>
      )}

      <div
        className={`flex-1 min-h-0 ${
          showCatalog ? 'grid grid-cols-2 gap-3' : ''
        }`}
      >
        {showCatalog ? (
          <div className={PANE_CLASS}>
            <Toolbar>
              <ToolbarLabel>{t('availableModels')}</ToolbarLabel>
              <ToolbarSpacer />
              <ToolbarSearch
                value={availableQuery}
                onChange={setAvailableQuery}
                placeholder={t('searchModels')}
                className="ml-0 w-36"
              />
              {canFetch ? (
                <ToolbarButton
                  onClick={handleFetchModels}
                  disabled={updating}
                  title={updating ? t('fetchingModels') : t('updateModels')}
                >
                  {updating ? (
                    <Loader2
                      size={TOOLBAR_ICON_SIZE}
                      className="animate-spin"
                    />
                  ) : (
                    <RotateCw size={TOOLBAR_ICON_SIZE} />
                  )}
                </ToolbarButton>
              ) : null}
            </Toolbar>

            {updating && isEmpty(availableRows) ? (
              <PaneEmpty>{t('fetchingModels')}</PaneEmpty>
            ) : isEmpty(availableRows) ? (
              <PaneEmpty>
                {canFetch ? t('availableEmpty') : t('availableEmptyManual')}
              </PaneEmpty>
            ) : isEmpty(visibleAvailable) ? (
              <PaneEmpty>{t('noModelMatches')}</PaneEmpty>
            ) : (
              <ul className={MODEL_LIST_CLASS}>
                {map(visibleAvailable, (id) => {
                  const added = selected.has(lowerCase(id))
                  return (
                    <li
                      key={id}
                      className={`${MODEL_ROW_CLASS} ${
                        added ? 'opacity-40' : tw.hover
                      }`}
                    >
                      <span
                        className={`${MODEL_NAME_CLASS} ${tw.text.primary}`}
                      >
                        {id}
                      </span>
                      <button
                        type="button"
                        onClick={() => addFromAvailable(id)}
                        disabled={added}
                        className={`${MODEL_ACTION_CLASS} ${tw.hover} ${tw.text.secondary} disabled:cursor-not-allowed disabled:opacity-40`}
                        title={t('addModel')}
                        aria-label={t('addModel')}
                      >
                        <Plus size={14} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ) : null}

        <div className={PANE_CLASS}>
          <Toolbar>
            <ToolbarLabel>
              {showCatalog ? t('chosenModels') : t('models')}
            </ToolbarLabel>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] tabular-nums ${tw.bg.primary} ${tw.text.secondary}`}
            >
              {value.models.length}
            </span>
            <ToolbarSpacer />
            <ToolbarTextInput
              value={newModelId}
              onChange={(e) => setNewModelId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddModel()
                }
              }}
              placeholder={placeholder}
              className="w-40 font-mono"
            />
            <ToolbarButton
              onClick={handleAddModel}
              disabled={isStrBlank(trim(newModelId))}
              title={t('addModel')}
            >
              <Plus size={TOOLBAR_ICON_SIZE} />
            </ToolbarButton>
          </Toolbar>

          {isEmpty(value.models) ? (
            <PaneEmpty>{t('chosenEmpty')}</PaneEmpty>
          ) : (
            <ul className={MODEL_LIST_CLASS}>
              {map(value.models, (model) => (
                <li
                  key={model.name}
                  className={`${MODEL_ROW_CLASS} ${tw.hover}`}
                >
                  <span className={`${MODEL_NAME_CLASS} ${tw.text.primary}`}>
                    {model.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeModel(model.name)}
                    className={`${MODEL_ACTION_CLASS} ${tw.hover} ${tw.text.tertiary}`}
                    title={t('removeModel')}
                    aria-label={t('removeModel')}
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
