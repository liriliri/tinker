import { defineConfig } from 'vite'
import { resolve } from 'path'
import { builtinModules } from 'node:module'
import { alias } from './vite.config'

const builtins = builtinModules.filter((e) => !e.startsWith('_'))
builtins.push('electron', 'ffmpeg-static', ...builtins.map((m) => `node:${m}`))

export default defineConfig({
  build: {
    outDir: 'dist/preload',
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
      external: builtins,
    },
  },
  resolve: {
    alias,
  },
})
