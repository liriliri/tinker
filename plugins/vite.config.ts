import { defineConfig, UserConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

export default defineConfig(async (): Promise<UserConfig> => {
  const cwd = process.cwd()
  const pkgPath = path.join(cwd, 'package.json')
  const pkg = require(pkgPath)

  return {
    root: cwd,
    base: '',
    plugins: [react(), svgr()],
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
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern',
        },
      },
    },
  }
})
