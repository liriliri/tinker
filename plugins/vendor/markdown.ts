import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { expose } from './util'

expose({ ReactMarkdown, remarkGfm, remarkBreaks })

export { ReactMarkdown, remarkGfm, remarkBreaks }
