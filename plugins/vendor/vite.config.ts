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
]

const globals = {
  react: 'React',
  'react-dom': 'ReactDOM',
  'react-dom/client': 'ReactDOMClient',
  'react/jsx-runtime': 'ReactJSXRuntime',
  'use-sync-external-store/shim': 'UseSyncExternalStoreShim',
  mobx: 'mobx',
  'mobx-react-lite': 'mobxReactLite',
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
  globals: Record<string, string> = {}
): UserConfig {
  return {
    root: __dirname,
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    build: {
      outDir: 'dist',
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
          globals,
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
    return createConfig(
      'mobx',
      'mobx.ts',
      'PluginVendorMobx',
      ['react', 'react-dom', 'use-sync-external-store/shim'],
      {
        react: 'React',
        'react-dom': 'ReactDOM',
        'use-sync-external-store/shim': 'UseSyncExternalStoreShim',
      }
    )
  }

  return createConfig('react', 'react.ts', 'PluginVendorReact')
})
