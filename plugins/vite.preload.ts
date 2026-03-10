import { defineConfig, UserConfig } from 'vite'
import { builtinModules } from 'node:module'
import path from 'path'
import { shareExternal } from './vendor/vite.config'

const external = builtinModules.filter((e) => !e.startsWith('_'))
external.push('electron', ...shareExternal, ...external.map((m) => `node:${m}`))

export default defineConfig(async (): Promise<UserConfig> => {
  const cwd = process.cwd()
  const pkgPath = path.join(cwd, 'package.json')
  const pkg = require(pkgPath)

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
        external,
      },
    },
  }
})
