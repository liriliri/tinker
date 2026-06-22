import { defineConfig, UserConfig, type Plugin } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import * as lucide from './lucide'
import keys from 'licia/keys'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

const globals: Record<string, string> = {
  react: 'React',
  'react-dom': 'ReactDOM',
  'react-dom/client': 'ReactDOMClient',
  'react/jsx-runtime': 'ReactJSXRuntime',
  'use-sync-external-store/shim': 'UseSyncExternalStoreShim',
  'use-sync-external-store/shim/with-selector':
    'UseSyncExternalStoreShimWithSelector',
  'use-sync-external-store/with-selector': 'UseSyncExternalStoreWithSelector',
  mobx: 'mobx',
  'mobx-react-lite': 'mobxReactLite',
  mathjs: 'mathjs',
  '@monaco-editor/react': 'MonacoEditorReact',
  idb: 'idb',
  'ag-grid-community': 'AgGridCommunity',
  'ag-grid-react': 'AgGridReact',
  'lucide-react': 'lucideReact',
  'licia/': 'licia',
  '@zxing/library': 'zxing',
  'html-to-image': 'htmlToImage',
  'react-syntax-highlighter': 'reactSyntaxHighlighter',
  'react-syntax-highlighter/dist/esm/styles/prism':
    'reactSyntaxHighlighterPrismStyles',
  'react-markdown': 'ReactMarkdown',
  'remark-gfm': 'remarkGfm',
  'remark-breaks': 'remarkBreaks',
  '@headlessui/react': 'headlessui',
  'react-hot-toast': 'reactHotToast',
  'react-resizable-panels': 'reactResizablePanels',
  'react-hex-editor': 'ReactHexEditor',
  'styled-components': 'styledComponents',
  'wavesurfer.js': 'wavesurfer',
  'wavesurfer.js/plugins/regions': 'wavesurferRegionsPlugin',
  'wavesurfer.js/plugins/timeline': 'wavesurferTimelinePlugin',
  '@videojs/react': 'videojsReact',
  '@videojs/react/video': 'videojsReactVideo',
  '@tiptap/react': 'tiptapReact',
  '@tiptap/starter-kit': 'tiptapStarterKit',
  '@tiptap/extension-underline': 'tiptapExtensionUnderline',
  '@tiptap/extension-highlight': 'tiptapExtensionHighlight',
  i18next: 'i18next',
  'react-i18next': 'reactI18next',
  'crypto-js': 'CryptoJS',
  'prettier/standalone': 'prettier',
  'prettier/plugins/babel': 'prettierPluginBabel',
  'prettier/plugins/estree': 'prettierPluginEstree',
  'prettier/plugins/postcss': 'prettierPluginPostcss',
  'prettier/plugins/html': 'prettierPluginHtml',
  'prettier/plugins/typescript': 'prettierPluginTypescript',
  '@xterm/xterm': 'xterm',
  '@xterm/addon-fit': 'xtermAddonFit',
  codemirror: 'CodeMirror',
  'overlayscrollbars-react': 'overlayscrollbarsReact',
}

export const shareExternal = ['systeminformation']

export const shareDeps = keys(globals)

export const shareGlobals: Record<string, string> = {
  'share/components/FileIcon': 'ShareFileIcon',
}

const shareComponentsDir = path.resolve(__dirname, '../share/components')

const globalsExports: Record<string, string[]> = {
  'lucide-react': keys(lucide),
  '@xterm/xterm': ['Terminal'],
  '@xterm/addon-fit': ['FitAddon'],
  codemirror: [],
  'overlayscrollbars-react': [
    'OverlayScrollbarsComponent',
    'useOverlayScrollbars',
  ],
}

function moduleKeys(id: string) {
  return keys(require(id)).filter((key) => key !== 'default')
}

export function globalsExternalPlugin(): Plugin {
  const hasShareGlobals = Object.keys(shareGlobals).length > 0

  return {
    name: 'plugin-globals-external',
    enforce: 'pre' as const,
    resolveId(source: string, importer: string | undefined) {
      if (importer && /\.worker\.[jt]sx?$/.test(importer)) return null

      // Share component paths have been aliased by vite:resolve at this point
      if (hasShareGlobals) {
        const normalized = source.replace(/\/+/g, '/')
        if (normalized.startsWith(shareComponentsDir)) {
          const baseName = path.basename(source).replace(/\.(tsx?|jsx?)$/, '')
          const key = `share/components/${baseName}`
          const globalName = shareGlobals[key]
          if (globalName) {
            return `\0virtual:share-${globalName}`
          }
        }
      }

      if (globals[source]) {
        return source
      }
      for (const key of Object.keys(globals)) {
        if (key.endsWith('/') && source.startsWith(key)) return source
      }
      return null
    },
    load(id: string) {
      // Virtual modules for share components
      if (id.startsWith('\0virtual:share-')) {
        const globalName = id.slice('\0virtual:share-'.length)
        return `const m = globalThis.${globalName};\nexport default m;`
      }

      for (const [key, globalName] of Object.entries(globals)) {
        if (key.endsWith('/') && id.startsWith(key)) {
          const mod = id.slice(key.length)
          return `const m = globalThis.${globalName}[${JSON.stringify(
            mod
          )}];\nexport default m;`
        }
      }

      const globalName = globals[id]
      if (!globalName) return null

      const exports = globalsExports[id] || moduleKeys(id)
      const code = [
        `const m = globalThis.${globalName};`,
        'export default m;',
        ...exports.map((key) => {
          return `export const ${key} = m[${JSON.stringify(key)}];`
        }),
      ].join('\n')

      return code
    },
  }
}

function createConfig(
  name: string,
  globalsName: string,
  external: string[] = [],
  outDir = 'dist',
  entry?: string
): UserConfig {
  const _globals: Record<string, string> = {}
  for (const ext of external) {
    if (globals[ext]) {
      _globals[ext] = globals[ext]
    }
  }

  return {
    root: __dirname,
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    worker: {
      format: 'es',
      rollupOptions: {
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name][extname]',
        },
      },
    },
    build: {
      outDir,
      emptyOutDir: false,
      lib: {
        entry: path.resolve(__dirname, entry || `${name}.ts`),
        name: globalsName,
        fileName: () => `${name}.js`,
        formats: ['iife'],
      },
      rollupOptions: {
        external,
        output: {
          chunkFileNames: '[name].js',
          entryFileNames: '[name].js',
          assetFileNames: '[name][extname]',
          globals: _globals,
        },
      },
    },
    optimizeDeps: {
      include: external,
    },
  }
}

export default defineConfig(({ mode }) => {
  const target = process.env.VENDOR_TARGET || mode || 'react'

  if (target === 'mobx') {
    return createConfig('mobx', 'PluginVendorMobx', [
      'react',
      'react-dom',
      'use-sync-external-store/shim',
      'react/jsx-runtime',
    ])
  }

  if (target === 'mathjs') {
    return createConfig('mathjs', 'PluginVendorMathjs')
  }

  if (target === 'idb') {
    return createConfig('idb', 'PluginVendorIdb')
  }

  if (target === 'monaco') {
    return createConfig(
      'monaco',
      'PluginVendorMonaco',
      ['react'],
      'dist/monaco'
    )
  }

  if (target === 'aggrid') {
    return createConfig('aggrid', 'PluginVendorAgGrid', [
      'react',
      'react-dom',
      'react/jsx-runtime',
    ])
  }

  if (target === 'lucide') {
    return createConfig('lucide', 'PluginVendorLucide', [
      'react',
      'react/jsx-runtime',
    ])
  }

  if (target === 'licia') {
    return createConfig('licia', 'PluginVendorLicia')
  }

  if (target === 'htmltoimage') {
    return createConfig('htmltoimage', 'PluginVendorHtmlToImage')
  }

  if (target === 'hexeditor') {
    return createConfig('hexeditor', 'PluginVendorHexEditor', [
      'react',
      'react/jsx-runtime',
    ])
  }

  if (target === 'wavesurfer') {
    return createConfig('wavesurfer', 'PluginVendorWavesurfer')
  }

  if (target === 'zxing') {
    return createConfig('zxing', 'PluginVendorZxing')
  }

  if (target === 'resizablepanels') {
    return createConfig('resizablepanels', 'PluginVendorResizablePanels', [
      'react',
      'react/jsx-runtime',
    ])
  }

  if (target === 'syntaxhighlighter') {
    return createConfig('syntaxhighlighter', 'PluginVendorSyntaxHighlighter', [
      'react',
      'react/jsx-runtime',
    ])
  }

  if (target === 'markdown') {
    return createConfig('markdown', 'PluginVendorMarkdown', [
      'react',
      'react/jsx-runtime',
    ])
  }

  if (target === 'headlessui') {
    return createConfig('headlessui', 'PluginVendorHeadlessui', [
      'react',
      'react-dom',
      'react/jsx-runtime',
    ])
  }

  if (target === 'hottoast') {
    return createConfig('hottoast', 'PluginVendorHottoast', [
      'react',
      'react-dom',
      'react/jsx-runtime',
    ])
  }

  if (target === 'tiptap') {
    return createConfig('tiptap', 'PluginVendorTiptap', [
      'react',
      'react-dom',
      'react/jsx-runtime',
    ])
  }

  if (target === 'videojs') {
    return createConfig(
      'videojs',
      'PluginVendorVideojs',
      ['react', 'react-dom', 'react/jsx-runtime'],
      'dist/videojs'
    )
  }

  if (target === 'cryptojs') {
    return createConfig('cryptojs', 'PluginVendorCryptoJS')
  }

  if (target === 'prettier') {
    return createConfig('prettier', 'PluginVendorPrettier')
  }

  if (target === 'i18next') {
    return createConfig('i18next', 'PluginVendorI18next', [
      'react',
      'use-sync-external-store/shim',
      'use-sync-external-store/shim/with-selector',
      'use-sync-external-store/with-selector',
      'react/jsx-runtime',
    ])
  }

  if (target === 'xterm') {
    return createConfig('xterm', 'PluginVendorXterm', [], 'dist/xterm')
  }

  if (target === 'codemirror') {
    return createConfig(
      'codemirror',
      'PluginVendorCodeMirror',
      [],
      'dist/codemirror'
    )
  }

  if (target === 'overlayscrollbars') {
    return createConfig(
      'overlayscrollbars',
      'PluginVendorOverlayscrollbars',
      ['react', 'react-dom', 'react/jsx-runtime'],
      'dist/overlayscrollbars'
    )
  }

  if (target === 'share:fileicon') {
    return createConfig(
      'fileicon',
      'PluginVendorFileIcon',
      ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'],
      'dist/share',
      'share/fileicon.ts'
    )
  }

  return createConfig('react', 'PluginVendorReact')
})
