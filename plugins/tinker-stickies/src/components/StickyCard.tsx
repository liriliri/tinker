import { useState, useEffect, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useEditor, EditorContent } from '@tiptap/react'
import { Trash2, ExternalLink, Circle } from 'lucide-react'
import { createRoot } from 'react-dom/client'
import { tw } from 'share/theme'
import { confirm } from 'share/components/Confirm'
import store, { STICKY_COLORS, type Sticky } from '../store'
import {
  HIGHLIGHT_COLORS,
  TEXT_COLOR,
  createEditorExtensions,
  formatTime,
} from '../lib/editor'
import PopupEditor from './PopupEditor'

interface StickyCardProps {
  sticky: Sticky
}

export default observer(function StickyCard({ sticky }: StickyCardProps) {
  const { t, i18n } = useTranslation()
  const [isEditing, setIsEditing] = useState(() => {
    if (store.editingId === sticky.id) {
      store.editingId = ''
      return true
    }
    return false
  })

  const editor = useEditor({
    extensions: createEditorExtensions(),
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
          type: 'checkbox',
          checked: editor.isActive('bold'),
          click: () => editor.chain().focus().toggleBold().run(),
        },
        {
          label: t('italic'),
          type: 'checkbox',
          checked: editor.isActive('italic'),
          click: () => editor.chain().focus().toggleItalic().run(),
        },
        {
          label: t('underline'),
          type: 'checkbox',
          checked: editor.isActive('underline'),
          click: () => editor.chain().focus().toggleUnderline().run(),
        },
        {
          label: t('strikethrough'),
          type: 'checkbox',
          checked: editor.isActive('strike'),
          click: () => editor.chain().focus().toggleStrike().run(),
        },
        { type: 'separator' as const },
        {
          label: t('highlight'),
          submenu: [
            ...HIGHLIGHT_COLORS.map(({ color, label }) => ({
              label: t(label),
              type: 'checkbox' as const,
              checked: editor.isActive('highlight', { color }),
              click: () =>
                editor.chain().focus().toggleHighlight({ color }).run(),
            })),
            { type: 'separator' as const },
            {
              label: t('removeHighlight'),
              enabled: editor.isActive('highlight'),
              click: () => editor.chain().focus().unsetHighlight().run(),
            },
          ],
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

  function handleOpenWindow(e: React.MouseEvent) {
    e.stopPropagation()

    const popup = window.open(
      '',
      '_blank',
      'width=400,height=350,minWidth=300,minHeight=200,alwaysOnTop=true,frame=no'
    )
    if (!popup) return

    const styles = document.querySelectorAll('style, link[rel="stylesheet"]')
    styles.forEach((node) => {
      popup.document.head.appendChild(node.cloneNode(true))
    })

    const container = popup.document.createElement('div')
    container.id = 'popup-root'
    popup.document.body.style.margin = '0'
    popup.document.documentElement.className =
      document.documentElement.className
    popup.document.body.appendChild(container)

    const root = createRoot(container)
    root.render(<PopupEditor sticky={sticky} onClose={() => popup.close()} />)

    popup.addEventListener('beforeunload', () => {
      root.unmount()
    })
  }

  return (
    <div
      className="rounded-sm border overflow-hidden flex flex-col h-[180px]"
      style={{
        backgroundColor: sticky.color,
        borderColor: sticky.color,
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
          style={{ color: TEXT_COLOR }}
          onBlur={() => setIsEditing(false)}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      <div
        className="px-3 py-2 flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[10px] opacity-50" style={{ color: TEXT_COLOR }}>
          {formatTime(sticky.updatedAt, i18n.language)}
        </span>

        <div className="flex-1" />

        <div className="group/color relative">
          <button
            className="p-1 rounded opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: TEXT_COLOR }}
          >
            <Circle size={13} />
          </button>
          <div
            className={`absolute bottom-full right-[-8px] pb-0.5 opacity-0 scale-95 pointer-events-none transition-all duration-150 group-hover/color:opacity-100 group-hover/color:scale-100 group-hover/color:pointer-events-auto`}
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
          className="p-1 rounded opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: TEXT_COLOR }}
          onClick={handleOpenWindow}
          title={t('openWindow')}
        >
          <ExternalLink size={13} />
        </button>

        <button
          className="p-1 rounded opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: TEXT_COLOR }}
          onClick={handleDelete}
          title={t('deleteSticky')}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
})
