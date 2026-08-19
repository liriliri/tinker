import { defineConfig, Plugin, build as viteBuild, InlineConfig } from 'vite'
import { resolve } from 'path'
import { builtinModules } from 'node:module'
import fs from 'fs-extra'
import keys from 'licia/keys'
import { alias } from './vite.config'

const pkg = fs.readJSONSync(resolve(__dirname, 'package.json'))
const external = builtinModules.filter((e) => !e.startsWith('_'))
external.push(
  'electron',
  ...keys(pkg.optionalDependencies || {}),
  ...keys(pkg.dependencies || {}),
  ...external.map((m) => `node:${m}`)
)

function bundlePluginRenderer(mode: string): Plugin {
  const entry = resolve(__dirname, 'src/preload/pluginRenderer.ts')
  let watcher: { close: () => Promise<void> } | null = null

  function config(watch: boolean): InlineConfig {
    return {
      configFile: false,
      mode,
      resolve: { alias },
      build: {
        watch: watch ? {} : null,
        outDir: 'dist/preload',
        emptyOutDir: false,
        minify: mode === 'development' ? false : 'esbuild',
        lib: {
          entry,
          name: '_tinkerRenderer',
          fileName: () => 'pluginRenderer.js',
          formats: ['iife'],
        },
      },
    }
  }

  return {
    name: 'bundle-plugin-renderer',
    apply: 'build',
    async buildStart() {
      if (!this.meta.watchMode || watcher) return
      watcher = (await viteBuild(config(true))) as {
        close: () => Promise<void>
      }
    },
    async writeBundle() {
      if (this.meta.watchMode) return
      await viteBuild(config(false))
    },
    async closeWatcher() {
      await watcher?.close()
      watcher = null
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [bundlePluginRenderer(mode)],
  build: {
    outDir: 'dist/preload',
    minify: mode === 'development' ? false : 'esbuild',
    lib: {
      entry: [
        resolve(__dirname, 'src/preload/index.ts'),
        resolve(__dirname, 'src/preload/plugin.ts'),
      ],
      name: 'Main',
      fileName: (format, entryName) => `${entryName}.js`,
      formats: ['cjs'],
    },
    rollupOptions: {
      external: (id) =>
        external.some((pkg) => id === pkg || id.startsWith(pkg + '/')),
    },
  },
  resolve: {
    alias,
  },
}))
