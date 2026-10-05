import { defineConfig, UserConfig } from 'vite'
import { builtinModules } from 'node:module'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import keys from 'licia/keys'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const rootPkg = fs.readJSONSync(path.resolve(__dirname, '../package.json'))
const vendorPkg = fs.readJSONSync(
  path.resolve(__dirname, 'vendor/package.json')
)
const external = builtinModules.filter((e) => !e.startsWith('_'))
external.push(
  'electron',
  ...keys(rootPkg.optionalDependencies || {}),
  ...keys(rootPkg.dependencies || {}),
  ...keys(vendorPkg.dependencies || {}),
  ...external.map((m) => `node:${m}`)
)

export default defineConfig(async (): Promise<UserConfig> => {
  const cwd = process.cwd()
  const pkg = await fs.readJSON(path.join(cwd, 'package.json'))

  return {
    root: cwd,
    base: '',
    build: {
      outDir: path.dirname(pkg.tinker.preload),
      lib: {
        entry: 'src/preload/index.ts',
        name: 'Main',
        fileName: 'index',
        formats: ['cjs'],
      },
      rollupOptions: {
        external: (id) =>
          external.some((pkg) => id === pkg || id.startsWith(pkg + '/')),
      },
    },
    resolve: {
      alias: {
        share: path.join(cwd, '../share/'),
      },
    },
  }
})
