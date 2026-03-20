import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, Plus, Trash2, GripVertical } from 'lucide-react'
import { tw } from 'share/theme'
import TextInput from 'share/components/TextInput'
import type { AiProvider, AiModel } from '../types'

interface Props {
  value: AiProvider
  onChange: (patch: Partial<AiProvider>) => void
}

export default function ProviderFields({ value, onChange }: Props) {
  const { t } = useTranslation()
  const [showApiKey, setShowApiKey] = useState(false)
  const [newModelId, setNewModelId] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const isClaude = value.apiType === 'claude'

  const handleModelIdChange = (index: number, name: string) => {
    const models = value.models.map((m, i) =>
      i === index ? { ...m, name } : m
    )
    onChange({ models })
  }

  const handleAddModel = () => {
    const name = newModelId.trim()
    if (!name) return
    onChange({ models: [...value.models, { name }] })
    setNewModelId('')
  }

  const handleDeleteModel = (index: number) => {
    onChange({ models: value.models.filter((_, i) => i !== index) })
  }

  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    const models = [...value.models]
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label className={`text-xs font-medium ${tw.text.secondary}`}>
          {t('apiUrl')}
        </label>
        <TextInput
          value={value.apiUrl}
          onChange={(e) => onChange({ apiUrl: e.target.value })}
          placeholder={
            isClaude ? 'https://api.anthropic.com' : 'https://api.openai.com/v1'
          }
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
        <label className={`text-xs font-medium ${tw.text.secondary}`}>
          {t('models')}
        </label>
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
            placeholder={isClaude ? 'claude-opus-4-5' : 'gpt-4o'}
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
        {value.models.length > 0 && (
          <div className={`rounded border ${tw.border} divide-y ${tw.divide}`}>
            {value.models.map((model: AiModel, index: number) => (
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
                  placeholder={isClaude ? 'claude-opus-4-5' : 'gpt-4o'}
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
