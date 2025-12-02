import { defineConfig, UserConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig(async (): Promise<UserConfig> => {
  const cwd = process.cwd()
  const pkgPath = path.join(cwd, 'package.json')
  const pkg = require(pkgPath)

  return {
    root: cwd,
    base: '',
    plugins: [react()],
    build: {
      outDir: path.join(cwd, 'dist/renderer'),
      rollupOptions: {
        input: {
          app: path.join(cwd, 'index.html'),
        },
      },
    },
  }
})
