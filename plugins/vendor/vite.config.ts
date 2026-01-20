import { defineConfig, UserConfig, type Plugin } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

export const shareDeps = [
  'react',
  'react-dom',
  'react-dom/client',
  'react/jsx-runtime',
  'use-sync-external-store/shim',
  'mobx',
  'mobx-react-lite',
  'mathjs',
  '@monaco-editor/react',
]

const globals = {
  react: 'React',
  'react-dom': 'ReactDOM',
  'react-dom/client': 'ReactDOMClient',
  'react/jsx-runtime': 'ReactJSXRuntime',
  'use-sync-external-store/shim': 'UseSyncExternalStoreShim',
  mobx: 'mobx',
  'mobx-react-lite': 'mobxReactLite',
  mathjs: 'mathjs',
  '@monaco-editor/react': 'MonacoEditorReact',
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

      const mod = require(id)
      const exports = Object.keys(mod).filter((key) => key !== 'default')
      const code = [
        `const m = globalThis.${globalName};`,
        'export default m;',
        ...exports.map((key) => {
          const safeKey = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
            ? key
            : JSON.stringify(key)
          return `export const ${safeKey} = m[${JSON.stringify(key)}];`
        }),
      ].join('\n')

      return code
    },
  }
}

function createConfig(
  name: string,
  entry: string,
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
        entry: path.resolve(__dirname, entry),
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
    return createConfig('mobx', 'mobx.ts', 'PluginVendorMobx', [
      'react',
      'react-dom',
      'use-sync-external-store/shim',
    ])
  }

  if (target === 'mathjs') {
    return createConfig('mathjs', 'mathjs.ts', 'PluginVendorMathjs')
  }

  if (target === 'monaco') {
    return createConfig(
      'monaco',
      'monaco.ts',
      'PluginVendorMonaco',
      ['react'],
      'dist/monaco'
    )
  }

  return createConfig('react', 'react.ts', 'PluginVendorReact')
})
