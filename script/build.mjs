import startWith from 'licia/startWith.js'
import path from 'path'
import contain from 'licia/contain.js'
import isMac from 'licia/isMac.js'

const pkg = await fs.readJson('package.json')
const electron = pkg.devDependencies.electron
delete pkg.devDependencies
pkg.devDependencies = {
  electron,
}
if (isMac) {
  pkg.dependencies['node-mac-permissions'] =
    pkg.optionalDependencies['node-mac-permissions']
}
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
  if (file.isDirectory() && startWith(file.name, 'tinker-')) {
    const pkg = await fs.readJson('plugins/' + file.name + '/package.json')
    if (pkg.embedded === false) {
      continue
    }
    await fs.copy('plugins/' + file.name, 'dist/plugins/' + file.name, {
      filter(src) {
        const basename = path.basename(src)

        if (
          contain(
            ['node_modules', 'src', 'references', 'tailwind.config.js'],
            basename
          )
        ) {
          return false
        }

        return true
      },
    })
  }
}

await fs.copy('build', 'dist/build')
await fs.copy('resources', 'dist/resources')
cd('dist')

await fs.writeJson('package.json', pkg, {
  spaces: 2,
})

await $`npm i --production`
