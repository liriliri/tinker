import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

const g = globalThis as Record<string, unknown>

g.ReactMarkdown = ReactMarkdown
g.remarkGfm = remarkGfm
g.remarkBreaks = remarkBreaks

export { ReactMarkdown, remarkGfm, remarkBreaks }
