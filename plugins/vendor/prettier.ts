import * as prettier from 'prettier/standalone'
import babel from 'prettier/plugins/babel'
import estree from 'prettier/plugins/estree'
import postcss from 'prettier/plugins/postcss'
import html from 'prettier/plugins/html'
import typescript from 'prettier/plugins/typescript'
import { expose } from './util'

expose({
  prettier,
  prettierPluginBabel: babel,
  prettierPluginEstree: estree,
  prettierPluginPostcss: postcss,
  prettierPluginHtml: html,
  prettierPluginTypescript: typescript,
})

export { prettier, babel, estree, postcss, html, typescript }
