import * as reactMarkdown from 'react-markdown'
import * as remarkGfm from 'remark-gfm'
import * as remarkBreaks from 'remark-breaks'

const g = globalThis as Record<string, unknown>

g.reactMarkdown = reactMarkdown
g.remarkGfm = remarkGfm
g.remarkBreaks = remarkBreaks

export { reactMarkdown, remarkGfm, remarkBreaks }
