import startWith from 'licia/startWith.js'
import path from 'path'
import contain from 'licia/contain.js'
import isMac from 'licia/isMac.js'
import isWindows from 'licia/isWindows.js'
import each from 'licia/each.js'
import { endWith } from 'licia'

const pkg = await fs.readJson('package.json')
const electron = pkg.devDependencies.electron
delete pkg.devDependencies
pkg.devDependencies = {
  electron,
}
const optionalDependencies = []
if (isMac) {
  optionalDependencies.push('node-mac-permissions', 'file-icon')
} else if (isWindows) {
  optionalDependencies.push('registry-js', 'extract-file-icon')
}
each(optionalDependencies, (name) => {
  if (!pkg.optionalDependencies[name]) {
    return
  }
  pkg.dependencies[name] = pkg.optionalDependencies[name]
})
delete pkg.optionalDependencies
delete pkg.scripts
delete pkg.workspaces
pkg.scripts = {
  start: 'electron main/index.js',
}
pkg.main = 'main/index.js'

await $`npm run build:main`
await $`npm run build:preload`
await $`npm run build:renderer`

await $`npm run build:plugin`
await fs.remove('dist/plugins')
const files = await fs.readdir('plugins', { withFileTypes: true })
for (let i = 0, len = files.length; i < len; i++) {
  const file = files[i]
  if (file.isDirectory()) {
    if (startWith(file.name, 'tinker-')) {
      const pkg = await fs.readJson('plugins/' + file.name + '/package.json')
      if (pkg.embedded === false) {
        continue
      }
      await fs.copy('plugins/' + file.name, 'dist/plugins/' + file.name, {
        filter(src) {
          const basename = path.basename(src)

          if (
            contain(
              [
                'node_modules',
                'src',
                'references',
                'tailwind.config.js',
                '.claude',
                '.DS_Store',
              ],
              basename
            )
          ) {
            return false
          }

          return true
        },
      })
    } else if (file.name === 'vendor') {
      await fs.copy('plugins/vendor', 'dist/plugins/vendor', {
        filter(src) {
          const basename = path.basename(src)

          if (contain(['vite.config.ts', '.DS_Store'], basename)) {
            return false
          }
          if (endWith(basename, '.ts')) {
            return false
          }

          return true
        },
      })
    }
  }
}

await fs.copy('build', 'dist/build')
await fs.copy('resources', 'dist/resources')
cd('dist')

await fs.writeJson('package.json', pkg, {
  spaces: 2,
})

await $`npm i --production`
