import * as reactSyntaxHighlighter from 'react-syntax-highlighter'
import * as prismStyles from 'react-syntax-highlighter/dist/esm/styles/prism'

const g = globalThis as Record<string, unknown>

g.reactSyntaxHighlighter = reactSyntaxHighlighter
g.reactSyntaxHighlighterPrismStyles = prismStyles

export { reactSyntaxHighlighter, prismStyles }
