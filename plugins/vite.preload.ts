import { defineConfig, UserConfig } from 'vite'
import { resolve } from 'path'
import { builtinModules } from 'node:module'
import path from 'path'

const builtins = builtinModules.filter((e) => !e.startsWith('_'))
builtins.push('electron', ...builtins.map((m) => `node:${m}`))

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
        external: builtins,
      },
    },
  }
})
