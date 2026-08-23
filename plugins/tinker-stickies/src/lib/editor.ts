import type { MenuItemConstructorOptions } from 'electron'
import type { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'

export const HIGHLIGHT_COLORS = [
  { color: '#bbf7d0', label: 'highlightGreen' },
  { color: '#bfdbfe', label: 'highlightBlue' },
  { color: '#fbcfe8', label: 'highlightPink' },
  { color: '#d8b4fe', label: 'highlightPurple' },
  { color: '#fed7aa', label: 'highlightOrange' },
]

export const TEXT_COLOR = '#1f2937'

export function createEditorExtensions() {
  return [
    StarterKit.configure({
      heading: false,
      codeBlock: false,
      blockquote: false,
      horizontalRule: false,
    }),
    Underline,
    Highlight.configure({ multicolor: true }),
  ]
}

export function showStickyEditorContextMenu(
  event: React.MouseEvent,
  editor: Editor,
  t: (key: string) => string
) {
  if (editor.state.selection.empty) return

  event.preventDefault()
  tinker.showContextMenu(event.clientX, event.clientY, [
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
    { type: 'separator' },
    {
      label: t('highlight'),
      submenu: [
        ...HIGHLIGHT_COLORS.map(({ color, label }) => ({
          label: t(label),
          type: 'checkbox' as const,
          checked: editor.isActive('highlight', { color }),
          click: () => editor.chain().focus().toggleHighlight({ color }).run(),
        })),
        { type: 'separator' as const },
        {
          label: t('removeHighlight'),
          enabled: editor.isActive('highlight'),
          click: () => editor.chain().focus().unsetHighlight().run(),
        },
      ],
    },
  ] satisfies MenuItemConstructorOptions[])
}

export function formatTime(timestamp: number, language: string): string {
  const date = new Date(timestamp)
  const locale = language === 'zh-CN' ? 'zh-CN' : 'en-US'
  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
