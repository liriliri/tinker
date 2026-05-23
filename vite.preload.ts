import { defineConfig } from 'vite'
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

export default defineConfig(({ mode }) => ({
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
