import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Plus, X } from 'lucide-react'
import Checkbox from 'share/components/Checkbox'
import { tw } from 'share/theme'
import type { KeyValuePair } from '../../common/types'

interface KeyValueEditorProps {
  items: KeyValuePair[]
  onUpdate: (
    index: number,
    field: keyof KeyValuePair,
    value: string | boolean
  ) => void
  onAdd: () => void
  onRemove: (index: number) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
}

export default observer(function KeyValueEditor({
  items,
  onUpdate,
  onAdd,
  onRemove,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
}: KeyValueEditorProps) {
  const { t } = useTranslation()
  const inputClass = `flex-1 px-2 py-1 text-xs border ${tw.border} rounded ${tw.bg.input} ${tw.text.primary} focus:outline-none focus:ring-1 ${tw.primary.focusRing}`

  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <Checkbox
            checked={item.enabled}
            onChange={(checked) => onUpdate(index, 'enabled', checked)}
          />
          <input
            type="text"
            value={item.key}
            onChange={(e) => onUpdate(index, 'key', e.target.value)}
            placeholder={keyPlaceholder}
            className={inputClass}
          />
          <input
            type="text"
            value={item.value}
            onChange={(e) => onUpdate(index, 'value', e.target.value)}
            placeholder={valuePlaceholder}
            className={inputClass}
          />
          <button
            onClick={() => onRemove(index)}
            className={`p-1 rounded ${tw.hover} ${tw.text.tertiary}`}
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button
        onClick={onAdd}
        className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${tw.hover} ${tw.text.secondary} self-start`}
      >
        <Plus size={12} />
        {t('add')}
      </button>
    </div>
  )
})
