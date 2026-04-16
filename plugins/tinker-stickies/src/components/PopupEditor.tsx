import { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useEditor, EditorContent } from '@tiptap/react'
import { X, Circle } from 'lucide-react'
import { tw } from 'share/theme'
import store, { STICKY_COLORS, type Sticky } from '../store'
import { TEXT_COLOR, createEditorExtensions, formatTime } from '../lib/editor'

interface PopupEditorProps {
  sticky: Sticky
  onClose: () => void
}

export default observer(function PopupEditor({
  sticky,
  onClose,
}: PopupEditorProps) {
  const { i18n } = useTranslation()
  const [showColors, setShowColors] = useState(false)
  const popupEditor = useEditor({
    extensions: createEditorExtensions(),
    content: sticky.content,
    onUpdate: ({ editor }) => {
      store.updateSticky(sticky.id, editor.getHTML())
    },
  })

  useEffect(() => {
    return () => {
      popupEditor?.destroy()
    }
  }, [popupEditor])

  useEffect(() => {
    if (!popupEditor) return
    if (!popupEditor.isFocused && popupEditor.getHTML() !== sticky.content) {
      popupEditor.commands.setContent(sticky.content)
    }
  }, [sticky.content, popupEditor])

  return (
    <div
      className="h-screen flex flex-col"
      style={{
        backgroundColor: sticky.color,
        color: TEXT_COLOR,
      }}
    >
      <div
        className="px-3 py-2 flex items-center gap-1"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <span
          className="text-[10px] opacity-50"
          style={
            {
              color: TEXT_COLOR,
              WebkitAppRegion: 'no-drag',
            } as React.CSSProperties
          }
        >
          {formatTime(sticky.updatedAt, i18n.language)}
        </span>

        <div className="flex-1" />

        <div
          className="relative"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            className="p-1 rounded opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: TEXT_COLOR }}
            onClick={() => setShowColors(!showColors)}
          >
            <Circle size={13} />
          </button>
          {showColors && (
            <div
              className="absolute top-full right-[-8px] pt-0.5 z-10"
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
              <div
                className={`flex gap-1 p-1.5 rounded shadow-lg border ${tw.border} ${tw.bg.secondary}`}
              >
                {STICKY_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-5 h-5 rounded-full border transition-transform ${
                      tw.border
                    } ${
                      sticky.color === color
                        ? 'scale-110 ring-1 ring-offset-1'
                        : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      store.updateStickyColor(sticky.id, color)
                      setShowColors(false)
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          className="p-1 rounded opacity-50 hover:opacity-100 transition-opacity"
          style={
            {
              color: TEXT_COLOR,
              WebkitAppRegion: 'no-drag',
            } as React.CSSProperties
          }
          onClick={onClose}
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 px-4 pb-4 overflow-y-auto sticky-editor is-editing">
        <EditorContent editor={popupEditor} />
      </div>
    </div>
  )
})
