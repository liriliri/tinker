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
