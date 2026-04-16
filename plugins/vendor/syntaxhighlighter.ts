import * as reactSyntaxHighlighter from 'react-syntax-highlighter'
import * as prismStyles from 'react-syntax-highlighter/dist/esm/styles/prism'
import { expose } from './util'

expose({
  reactSyntaxHighlighter,
  reactSyntaxHighlighterPrismStyles: prismStyles,
})

export { reactSyntaxHighlighter, prismStyles }
