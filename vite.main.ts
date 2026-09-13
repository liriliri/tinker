import { defineConfig, Plugin, UserConfig } from 'vite'
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

const directRequireModules = [
  'node-pty',
  'uiohook-napi',
  'file-icon',
  'extract-file-icon',
  'registry-js',
  'node-mac-permissions',
  'licia/isWindows',
  'licia/isMac',
]

function lazyImportWrap(): Plugin {
  const direct = JSON.stringify(directRequireModules)
  return {
    name: 'lazy-import-wrap',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk' || chunk.name !== 'index') {
          continue
        }
        chunk.code = `!function(require){\n${chunk.code}\n}((()=>{const lazy=require("licia/lazyImport")(require);const direct=new Set(${direct});const isBuiltin=require("module").isBuiltin;return id=>direct.has(id)||isBuiltin(id)?require(id):lazy(id)})())`
      }
    },
  }
}

export default defineConfig(async ({ mode }): Promise<UserConfig> => {
  const pkg = await fs.readJSON(path.resolve(__dirname, 'package.json'))
  return {
    build: {
      outDir: 'dist/main',
      minify: mode === 'development' ? false : 'esbuild',
      lib: {
        entry: {
          bootstrap: resolve(__dirname, 'src/main/bootstrap.ts'),
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
    plugins: [lazyImportWrap()],
  }
})
