import { defineConfig, UserConfig, type Plugin } from 'vite'
import fs from 'fs-extra'
import path from 'path'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import { shareDeps, globalsExternalPlugin } from './vendor/vite.config'

function ignoreVendorAssetsPlugin(): Plugin {
  return {
    name: 'ignore-vendor-assets',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace(
          /<(script|link)(?=[^>]*\b(?:src|href)="\/vendor\/)/gi,
          '<$1 vite-ignore'
        )
      },
    },
  }
}

export default defineConfig(async (): Promise<UserConfig> => {
  const cwd = process.cwd()
  const pkg = await fs.readJSON(path.join(cwd, 'package.json'))

  return {
    root: cwd,
    base: '',
    plugins: [
      react(),
      svgr(),
      globalsExternalPlugin(),
      ignoreVendorAssetsPlugin(),
    ],
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
