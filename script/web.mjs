import path from 'path'
import startWith from 'licia/startWith.js'

const root = path.resolve(__dirname, '..')
const pluginsDir = path.join(root, 'plugins')
const webRoot = path.join(root, 'dist-web')
const vendorOut = path.join(webRoot, 'vendor')
const pluginsOut = path.join(webRoot, 'plugins')

async function copyPlugin(pluginDir) {
  const dirname = path.basename(pluginDir)
  if (!startWith(dirname, 'tinker-')) {
    throw new Error(`Not a plugin directory: ${pluginDir}`)
  }

  const name = dirname.slice('tinker-'.length)
  const outDir = path.join(pluginsOut, name)
  await fs.remove(outDir)
  await fs.copy(path.join(pluginDir, 'dist'), outDir)
  echo(`Plugin ${name} written to ${outDir}`)
}

if (argv.copy) {
  await copyPlugin(process.cwd())
} else {
  cd(path.join(pluginsDir, 'vendor'))
  await $`npm run build`

  await fs.remove(vendorOut)
  await fs.copy(path.join(pluginsDir, 'vendor/dist'), vendorOut)
  echo(`Vendor written to ${vendorOut}`)

  await fs.remove(pluginsOut)

  const entries = await fs.readdir(pluginsDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory() || !startWith(entry.name, 'tinker-')) {
      continue
    }

    const pluginDir = path.join(pluginsDir, entry.name)
    const pkg = await fs.readJson(path.join(pluginDir, 'package.json'))
    if (!pkg.scripts?.['build:web']) {
      continue
    }

    cd(pluginDir)
    await $`npm run build:web`
  }
}
