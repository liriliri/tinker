import { defineConfig, UserConfig, type Plugin } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import * as lucide from './lucide'
import keys from 'licia/keys'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

const globals = {
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
  '@tiptap/react': 'tiptapReact',
  '@tiptap/starter-kit': 'tiptapStarterKit',
  '@tiptap/extension-underline': 'tiptapExtensionUnderline',
  '@tiptap/extension-highlight': 'tiptapExtensionHighlight',
}

export const shareExternal = ['systeminformation']

export const shareDeps = keys(globals)

const globalsExports: Record<string, string[]> = {
  'lucide-react': keys(lucide),
}

function moduleKeys(id: string) {
  return keys(require(id)).filter((key) => key !== 'default')
}

export function globalsExternalPlugin(): Plugin {
  return {
    name: 'plugin-globals-external',
    enforce: 'pre' as const,
    resolveId(source: string) {
      if (globals[source]) {
        return source
      }
      return null
    },
    load(id: string) {
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
  outDir = 'dist'
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
        entry: path.resolve(__dirname, `${name}.ts`),
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
    return createConfig('aggrid', 'PluginVendorAgGrid', ['react', 'react-dom'])
  }

  if (target === 'lucide') {
    return createConfig('lucide', 'PluginVendorLucide', ['react'])
  }

  if (target === 'htmltoimage') {
    return createConfig('htmltoimage', 'PluginVendorHtmlToImage')
  }

  if (target === 'hexeditor') {
    return createConfig('hexeditor', 'PluginVendorHexEditor', ['react'])
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
    ])
  }

  if (target === 'syntaxhighlighter') {
    return createConfig('syntaxhighlighter', 'PluginVendorSyntaxHighlighter', [
      'react',
    ])
  }

  if (target === 'markdown') {
    return createConfig('markdown', 'PluginVendorMarkdown', ['react'])
  }

  if (target === 'headlessui') {
    return createConfig('headlessui', 'PluginVendorHeadlessui', [
      'react',
      'react-dom',
    ])
  }

  if (target === 'hottoast') {
    return createConfig('hottoast', 'PluginVendorHottoast', [
      'react',
      'react-dom',
    ])
  }

  if (target === 'tiptap') {
    return createConfig('tiptap', 'PluginVendorTiptap', ['react', 'react-dom'])
  }

  return createConfig('react', 'PluginVendorReact')
})
