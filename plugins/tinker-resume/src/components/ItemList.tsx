import { useState } from 'react'
import { ChevronDown, Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import { FieldArea, FieldText } from './FormField'

interface ItemField {
  key: string
  label: string
  multiline?: boolean
  span?: 1 | 2
}

interface ItemListProps<T extends { id: string; visible: boolean }> {
  items: T[]
  fields: ItemField[]
  onAdd: () => void
  onChange: (id: string, key: string, value: string) => void
  onRemove: (id: string) => void
  onToggleVisible: (id: string, visible: boolean) => void
  titleKey: (item: T) => string
}

export default function ItemList<T extends { id: string; visible: boolean }>({
  items,
  fields,
  onAdd,
  onChange,
  onRemove,
  onToggleVisible,
  titleKey,
}: ItemListProps<T>) {
  const { t } = useTranslation()
  const [expandedId, setExpandedId] = useState<string | null>(
    items[0]?.id ?? null
  )

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const expanded = expandedId === item.id
        return (
          <div
            key={item.id}
            className={`overflow-hidden rounded-lg border ${tw.border} ${
              tw.bg.primary
            } ${tw.primary.hoverBorder} ${item.visible ? '' : 'opacity-60'}`}
          >
            <div
              className={`flex cursor-pointer select-none items-center justify-between px-4 py-3 ${
                expanded ? tw.bg.tertiary : ''
              }`}
              onClick={() => setExpandedId(expanded ? null : item.id)}
            >
              <h3
                className={`min-w-0 flex-1 truncate text-sm font-medium ${tw.text.primary}`}
              >
                {titleKey(item) || t('untitled')}
              </h3>
              <div className="ml-3 flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  className={`rounded-md p-1.5 ${tw.hover} ${
                    item.visible ? tw.primary.text : tw.text.tertiary
                  }`}
                  title={item.visible ? t('hideItem') : t('showItem')}
                  onClick={(event) => {
                    event.stopPropagation()
                    onToggleVisible(item.id, !item.visible)
                  }}
                >
                  {item.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  type="button"
                  className={`rounded-md p-1.5 text-red-500 ${tw.hover}`}
                  title={t('delete')}
                  onClick={(event) => {
                    event.stopPropagation()
                    onRemove(item.id)
                    if (expandedId === item.id) setExpandedId(null)
                  }}
                >
                  <Trash2 size={16} />
                </button>
                <ChevronDown
                  size={18}
                  className={`ml-0.5 ${tw.text.tertiary} transition-transform ${
                    expanded ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </div>
            {expanded ? (
              <div className="space-y-4 px-4 pb-4">
                <div className={`h-px w-full ${tw.bg.border}`} />
                <div className="grid grid-cols-2 gap-4">
                  {fields.map((field) => {
                    const value = String(item[field.key as keyof T] ?? '')
                    const spanClass =
                      field.multiline || field.span === 2 ? 'col-span-2' : ''
                    if (field.multiline) {
                      return (
                        <div key={field.key} className={spanClass}>
                          <FieldArea
                            label={field.label}
                            value={value}
                            onChange={(next) =>
                              onChange(item.id, field.key, next)
                            }
                          />
                        </div>
                      )
                    }
                    return (
                      <div key={field.key} className={spanClass}>
                        <FieldText
                          label={field.label}
                          value={value}
                          onChange={(next) =>
                            onChange(item.id, field.key, next)
                          }
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )
      })}
      <button
        type="button"
        className={`inline-flex w-full items-center justify-center gap-2 rounded-md py-2 text-sm text-white ${tw.primary.bg} ${tw.primary.bgHover}`}
        onClick={onAdd}
      >
        <Plus size={16} />
        {t('addItem')}
      </button>
    </div>
  )
}
