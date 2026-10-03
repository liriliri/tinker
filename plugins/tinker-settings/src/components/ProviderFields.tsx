import { useState, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  Eye,
  EyeOff,
  Plus,
  Trash2,
  GripVertical,
  RotateCw,
  Loader2,
} from 'lucide-react'
import clone from 'licia/clone'
import concat from 'licia/concat'
import extend from 'licia/extend'
import filter from 'licia/filter'
import isEmpty from 'licia/isEmpty'
import isStrBlank from 'licia/isStrBlank'
import map from 'licia/map'
import trim from 'licia/trim'
import { tw } from 'share/theme'
import TextInput from 'share/components/TextInput'
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

export default function ProviderFields({
  mode,
  value,
  onChange,
}: ProviderFieldsProps) {
  const { t } = useTranslation()
  const [showApiKey, setShowApiKey] = useState(false)
  const [newModelId, setNewModelId] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [updating, setUpdating] = useState(false)

  const placeholder = modelPlaceholder(mode, value.apiType)
  const canUpdateModels = mode === 'chat' && value.apiType === 'openai'

  const handleModelIdChange = (index: number, name: string) => {
    onChange({
      models: map(value.models, (m, i) =>
        i === index ? extend(clone(m), { name }) : m
      ),
    })
  }

  const handleAddModel = () => {
    const name = trim(newModelId)
    if (isStrBlank(name)) return
    onChange({ models: concat(value.models, [{ name }]) })
    setNewModelId('')
  }

  const handleDeleteModel = (index: number) => {
    onChange({ models: filter(value.models, (_, i) => i !== index) })
  }

  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (e: DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    const models = clone(value.models)
    const [moved] = models.splice(dragIndex, 1)
    models.splice(targetIndex, 0, moved)
    onChange({ models })
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const handleUpdateModels = async () => {
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
      onChange({ models })
      toast.success(t('modelsUpdated'))
    } catch {
      toast.error(t('updateModelsFailed'))
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label className={`text-xs font-medium ${tw.text.secondary}`}>
          {t('apiUrl')}
        </label>
        <TextInput
          value={value.apiUrl}
          readOnly
          className={`${tw.text.secondary} cursor-default`}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={`text-xs font-medium ${tw.text.secondary}`}>
          {t('apiKey')}
        </label>
        <div className="relative">
          <TextInput
            type={showApiKey ? 'text' : 'password'}
            value={value.apiKey}
            onChange={(e) => onChange({ apiKey: e.target.value })}
            placeholder={t('apiKey')}
            className="pr-8"
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
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <label className={`text-xs font-medium ${tw.text.secondary}`}>
            {t('models')}
          </label>
          {canUpdateModels && (
            <button
              type="button"
              onClick={handleUpdateModels}
              disabled={updating}
              className={`flex-shrink-0 p-1 rounded ${tw.hover} ${tw.text.secondary} disabled:opacity-50`}
              title={t('updateModels')}
            >
              {updating ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <RotateCw size={13} />
              )}
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <TextInput
            value={newModelId}
            onChange={(e) => setNewModelId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddModel()
              }
            }}
            placeholder={placeholder}
            className="flex-1 text-sm"
          />
          <button
            type="button"
            onClick={handleAddModel}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium ${tw.hover} ${tw.text.secondary} border ${tw.border}`}
          >
            <Plus size={13} />
            {t('addModel')}
          </button>
        </div>
        {!isEmpty(value.models) && (
          <div className={`rounded border ${tw.border} divide-y ${tw.divide}`}>
            {map(value.models, (model, index) => (
              <div
                key={index}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                className={`flex items-center gap-2 px-2 py-1.5 transition-colors ${
                  dragOverIndex === index && dragIndex !== index
                    ? tw.bg.secondary
                    : ''
                }`}
              >
                <span
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnd={handleDragEnd}
                  className="flex-shrink-0 cursor-grab"
                >
                  <GripVertical size={14} className={tw.text.tertiary} />
                </span>
                <TextInput
                  value={model.name}
                  onChange={(e) => handleModelIdChange(index, e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteModel(index)}
                  className={`flex-shrink-0 p-1 rounded ${tw.hover} text-red-500 dark:text-red-400`}
                  title={t('delete')}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
