import * as tiptapReact from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import * as allStarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import * as allUnderline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import * as allHighlight from '@tiptap/extension-highlight'
import { expose } from './util'

expose({ tiptapReact })
expose('tiptapStarterKit', StarterKit, allStarterKit)
expose('tiptapExtensionUnderline', Underline, allUnderline)
expose('tiptapExtensionHighlight', Highlight, allHighlight)

export { tiptapReact, StarterKit, Underline, Highlight }
