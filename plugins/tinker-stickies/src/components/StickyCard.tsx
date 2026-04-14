import { useState, useRef, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { tw } from 'share/theme'
import { confirm } from 'share/components/Confirm'
import store, { STICKY_COLORS, type Sticky } from '../store'

function formatTime(timestamp: number, language: string): string {
  const date = new Date(timestamp)
  const locale = language === 'zh-CN' ? 'zh-CN' : 'en-US'
  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface StickyCardProps {
  sticky: Sticky
}

export default observer(function StickyCard({ sticky }: StickyCardProps) {
  const { t, i18n } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      const len = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(len, len)
    }
  }, [isEditing])

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    const confirmed = await confirm({
      title: t('deleteConfirmTitle'),
      message: t('deleteConfirmMessage'),
    })
    if (confirmed) {
      store.deleteSticky(sticky.id)
    }
  }

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    store.updateSticky(sticky.id, e.target.value)
  }

  const cardBg = store.isDark ? `${sticky.color}30` : `${sticky.color}90`
  const borderColor = store.isDark ? `${sticky.color}50` : `${sticky.color}`

  return (
    <div
      className="rounded-sm border overflow-hidden flex flex-col cursor-pointer transition-shadow hover:shadow-md h-[180px]"
      style={{
        backgroundColor: cardBg,
        borderColor,
      }}
      onClick={() => !isEditing && setIsEditing(true)}
    >
      <div className="flex-1 p-3 overflow-hidden">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={sticky.content}
            onChange={handleContentChange}
            onBlur={() => setIsEditing(false)}
            className="w-full h-full bg-transparent resize-none outline-none text-sm"
            style={{ color: store.isDark ? '#e5e7eb' : '#1f2937' }}
          />
        ) : (
          <p
            className="text-sm whitespace-pre-wrap break-words line-clamp-6"
            style={{ color: store.isDark ? '#e5e7eb' : '#1f2937' }}
          >
            {sticky.content || (
              <span className="opacity-40 italic">{t('addSticky')}...</span>
            )}
          </p>
        )}
      </div>

      <div
        className="px-3 py-2 flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {STICKY_COLORS.map((color) => (
          <button
            key={color}
            className={`w-4 h-4 rounded-full border transition-transform ${
              sticky.color === color ? 'scale-125 ring-1 ring-offset-1' : ''
            }`}
            style={{
              backgroundColor: color,
              borderColor: color,
            }}
            onClick={() => store.updateStickyColor(sticky.id, color)}
          />
        ))}

        <div className="flex-1" />

        <span
          className="text-[10px] opacity-50 mr-1"
          style={{ color: store.isDark ? '#e5e7eb' : '#1f2937' }}
        >
          {formatTime(sticky.updatedAt, i18n.language)}
        </span>

        <button
          className={`p-1 rounded opacity-40 hover:opacity-100 transition-opacity ${tw.hover}`}
          onClick={handleDelete}
          title={t('deleteSticky')}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
})
