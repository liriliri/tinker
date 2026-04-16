import { useState, useEffect, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Underline,
      Highlight,
    ],
    content: sticky.content,
    editable: false,
    onUpdate: ({ editor }) => {
      store.updateSticky(sticky.id, editor.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    if (isEditing) {
      editor.setEditable(true)
      editor.commands.focus('end')
    } else {
      editor.setEditable(false)
    }
  }, [isEditing, editor])

  useEffect(() => {
    if (!editor || isEditing) return
    const currentHTML = editor.getHTML()
    if (currentHTML !== sticky.content) {
      editor.commands.setContent(sticky.content)
    }
  }, [sticky.content, editor, isEditing])

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (!editor || editor.state.selection.empty) return

      e.preventDefault()
      tinker.showContextMenu(e.clientX, e.clientY, [
        {
          label: t('bold'),
          click: () => editor.chain().focus().toggleBold().run(),
        },
        {
          label: t('italic'),
          click: () => editor.chain().focus().toggleItalic().run(),
        },
        {
          label: t('underline'),
          click: () => editor.chain().focus().toggleUnderline().run(),
        },
        {
          label: t('strikethrough'),
          click: () => editor.chain().focus().toggleStrike().run(),
        },
        { type: 'separator' as const },
        {
          label: t('highlight'),
          click: () => editor.chain().focus().toggleHighlight().run(),
        },
      ])
    },
    [editor, t]
  )

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

  const cardBg = store.isDark ? `${sticky.color}30` : `${sticky.color}90`
  const borderColor = store.isDark ? `${sticky.color}50` : `${sticky.color}`
  const textColor = store.isDark ? '#e5e7eb' : '#1f2937'

  return (
    <div
      className="rounded-sm border overflow-hidden flex flex-col cursor-pointer transition-shadow hover:shadow-md h-[180px]"
      style={{
        backgroundColor: cardBg,
        borderColor,
      }}
      onClick={() => !isEditing && setIsEditing(true)}
    >
      <div
        className="flex-1 p-3 overflow-hidden"
        onContextMenu={handleContextMenu}
      >
        <div
          className={`sticky-editor text-sm h-full ${
            isEditing ? 'is-editing' : ''
          }`}
          style={{ color: textColor }}
          onBlur={() => setIsEditing(false)}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      <div
        className="px-3 py-2 flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[10px] opacity-50" style={{ color: textColor }}>
          {formatTime(sticky.updatedAt, i18n.language)}
        </span>

        <div className="flex-1" />

        <div className="group/color relative">
          <div
            className={`w-4 h-4 rounded-full border cursor-pointer ${tw.border}`}
            style={{ backgroundColor: sticky.color }}
          />
          <div
            className={`absolute bottom-full right-0 pb-2 opacity-0 scale-95 pointer-events-none transition-all duration-150 group-hover/color:opacity-100 group-hover/color:scale-100 group-hover/color:pointer-events-auto`}
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
                  onClick={() => store.updateStickyColor(sticky.id, color)}
                />
              ))}
            </div>
          </div>
        </div>

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
