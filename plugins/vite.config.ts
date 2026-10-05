import { defineConfig, UserConfig } from 'vite'
import fs from 'fs-extra'
import path from 'path'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import { shareDeps, globalsExternalPlugin } from './vendor/vite.config'

export default defineConfig(async (): Promise<UserConfig> => {
  const cwd = process.cwd()
  const pkg = await fs.readJSON(path.join(cwd, 'package.json'))

  return {
    root: cwd,
    base: '',
    plugins: [react(), svgr(), globalsExternalPlugin()],
    build: {
      outDir: path.dirname(pkg.tinker.main),
      rollupOptions: {
        input: {
          app: 'index.html',
        },
      },
    },
    worker: {
      format: 'es',
      rollupOptions: {
        output: {
          format: 'es',
        },
      },
    },
    resolve: {
      alias: {
        share: path.join(cwd, '../share/'),
      },
    },
    optimizeDeps: {
      include: ['shiki'],
      exclude: shareDeps.map((d) => (d.endsWith('/') ? d.slice(0, -1) : d)),
    },
  }
})
