import { defineConfig, Plugin, build as viteBuild } from 'vite'
import { resolve } from 'path'
import { builtinModules } from 'node:module'
import fs from 'fs-extra'
import path from 'path'
import keys from 'licia/keys'
import { alias } from './vite.config'

const pkg = fs.readJSONSync(path.resolve(__dirname, 'package.json'))
const external = builtinModules.filter((e) => !e.startsWith('_'))
external.push(
  'electron',
  ...keys(pkg.optionalDependencies || {}),
  ...keys(pkg.dependencies || {}),
  ...external.map((m) => `node:${m}`)
)

function bundlePluginRenderer(mode: string): Plugin {
  const entry = resolve(__dirname, 'src/preload/pluginRenderer.ts')

  return {
    name: 'bundle-plugin-renderer',
    apply: 'build',
    buildStart() {
      this.addWatchFile(entry)
    },
    async writeBundle() {
      await viteBuild({
        configFile: false,
        resolve: { alias },
        build: {
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
      })
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
