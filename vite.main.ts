import { defineConfig, UserConfig } from 'vite'
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

export default defineConfig(async ({ mode }): Promise<UserConfig> => {
  const pkg = await fs.readJSON(path.resolve(__dirname, 'package.json'))
  return {
    build: {
      outDir: 'dist/main',
      minify: mode === 'development' ? false : 'esbuild',
      lib: {
        entry: {
          index: resolve(__dirname, 'src/main/index.ts'),
          cli: resolve(__dirname, 'src/main/cli/index.ts'),
        },
        name: 'Main',
        formats: ['cjs'],
      },
      rollupOptions: {
        external: (id) =>
          external.some((pkg) => id === pkg || id.startsWith(pkg + '/')),
      },
    },
    resolve: {
      mainFields: ['main', 'module'],
      alias,
    },
    define: {
      PRODUCT_NAME: JSON.stringify(pkg.productName),
      VERSION: JSON.stringify(pkg.version),
    },
  }
})
