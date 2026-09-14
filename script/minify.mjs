import { minify } from 'terser'
import { glob } from 'glob'
import path from 'path'

const RM_PACKAGES = ['cpu-features', 'nan']

const REMAIN_EXTENSIONS = {
  cjs: true,
  js: true,
  mjs: true,
  json: true,
  wasm: true,
  node: true,
  dylib: true,
  so: true,
  dll: true,
  exe: true,
  cmd: true,
  ps1: true,
  sh: true,
}

const FORCE_REMAIN_PATTERNS = [/(^|\/)bin\//, /playwright-core\/lib\/xdg-open$/]

// Whitelist relative to package root. Unlisted native packages are left untouched.
const NATIVE_MODULE_KEEP = {
  'node-pty': [
    'package.json',
    'lib/**/*.js',
    'build/Release/pty.node',
    'build/Release/spawn-helper',
    'build/Release/*.node',
    'build/Release/*.dll',
    'build/Release/*.exe',
    'build/Release/conpty/**',
  ],
  'uiohook-napi': ['package.json', 'dist/index.js', 'build/Release/*.node'],
  'node-mac-permissions': ['package.json', 'index.js', 'build/Release/*.node'],
  'extract-file-icon': [
    'package.json',
    'dist/index.js',
    'build/Release/*.node',
  ],
  'registry-js': ['package.json', 'dist/lib/**/*.js', 'build/Release/*.node'],
  'ffmpeg-static': ['package.json', 'index.js', 'ffmpeg'],
  'file-icon': ['package.json', 'index.js', 'file-icon'],
  'pdu-static': ['package.json', 'index.js', 'pdu'],
  '@vscode/ripgrep': ['package.json', 'lib/index.js', 'bin/rg'],
}

const PLATFORM_ONLY_PACKAGES = {
  darwin: ['node-mac-permissions', 'file-icon'],
  win32: ['registry-js', 'extract-file-icon'],
}

const CURRENT_PLATFORM = `${process.platform}-${process.arch}`

const PKG_GLOB = {
  nodir: true,
  absolute: true,
  dot: true,
  follow: false,
  ignore: ['**/node_modules/**'],
}

function posixRel(from, to) {
  return path.relative(from, to).replace(/\\/g, '/')
}

function shouldForceRemain(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/')
  return FORCE_REMAIN_PATTERNS.some((pattern) => pattern.test(normalized))
}

function getNativeKeep(pkgName) {
  if (NATIVE_MODULE_KEEP[pkgName]) return NATIVE_MODULE_KEEP[pkgName]
  if (pkgName.startsWith('pdu-static')) return NATIVE_MODULE_KEEP['pdu-static']
  return null
}

function currentPduPackageName() {
  if (process.platform === 'darwin') {
    return process.arch === 'arm64'
      ? 'pdu-static-darwin-arm64'
      : 'pdu-static-darwin'
  }
  if (process.platform === 'linux') return 'pdu-static-linux'
  if (process.platform === 'win32') return 'pdu-static-win32'
  return null
}

function shouldRemovePlatformPackage(pkgName) {
  for (const [platform, names] of Object.entries(PLATFORM_ONLY_PACKAGES)) {
    if (names.includes(pkgName) && process.platform !== platform) return true
  }
  if (pkgName.startsWith('pdu-static-')) {
    return pkgName !== currentPduPackageName()
  }
  return false
}

async function listPackageDirs(nodeModulesDir) {
  const result = []
  if (!(await fs.exists(nodeModulesDir))) return result

  for (const name of await fs.readdir(nodeModulesDir)) {
    if (name.startsWith('.')) continue
    const full = path.join(nodeModulesDir, name)
    if (!(await fs.lstat(full).catch(() => null))?.isDirectory()) continue

    if (name.startsWith('@')) {
      for (const scoped of await fs.readdir(full)) {
        const scopedDir = path.join(full, scoped)
        if ((await fs.lstat(scopedDir).catch(() => null))?.isDirectory()) {
          result.push({ name: `${name}/${scoped}`, dir: scopedDir })
        }
      }
    } else {
      result.push({ name, dir: full })
    }
  }
  return result
}

async function isNativePackage(pkgName, pkgDir) {
  if (getNativeKeep(pkgName)) return true
  if (await fs.exists(path.join(pkgDir, 'binding.gyp'))) return true
  if (await fs.exists(path.join(pkgDir, 'prebuilds'))) return true
  const nodes = await glob('**/*.node', {
    cwd: pkgDir,
    nodir: true,
    ignore: ['**/node_modules/**'],
  })
  return nodes.length > 0
}

async function slimByKeep(pkgDir, patterns) {
  const keep = new Set()
  for (const pattern of patterns) {
    for (const file of await glob(pattern, { cwd: pkgDir, ...PKG_GLOB })) {
      const rel = posixRel(pkgDir, file)
      if (rel.endsWith('.test.js') || rel.includes('/test/')) continue
      keep.add(path.normalize(file))
    }
  }

  let count = 0
  for (const file of await glob('**/*', { cwd: pkgDir, ...PKG_GLOB })) {
    if (keep.has(path.normalize(file))) continue
    await fs.remove(file)
    count++
  }
  return count
}

async function rmOtherPlatformPrebuilds(pkgName, pkgDir) {
  const prebuildsDir = path.join(pkgDir, 'prebuilds')
  if (!(await fs.exists(prebuildsDir))) return

  for (const platform of await fs.readdir(prebuildsDir)) {
    if (platform === CURRENT_PLATFORM) continue
    console.log(`rmPrebuild: ${pkgName}/prebuilds/${platform}`)
    await fs.remove(path.join(prebuildsDir, platform))
  }
}

async function prepareNativeModules(nodeModulesDir) {
  const nativeNames = new Set()
  if (!(await fs.exists(nodeModulesDir))) return nativeNames

  for (const { name, dir } of await listPackageDirs(nodeModulesDir)) {
    if (shouldRemovePlatformPackage(name)) {
      console.log(`rmPlatformPkg: ${name}`)
      await fs.remove(dir)
      continue
    }

    await rmOtherPlatformPrebuilds(name, dir)

    if (!(await isNativePackage(name, dir))) continue
    nativeNames.add(name)

    const keep = getNativeKeep(name)
    if (!keep) continue

    const count = await slimByKeep(dir, keep)
    console.log(`native keep: ${name} removed ${count} files`)
  }

  return nativeNames
}

function isUnderNativePackage(relativePath, nativeNames) {
  const rel = relativePath.replace(/\\/g, '/')
  for (const name of nativeNames) {
    if (rel === name || rel.startsWith(name + '/')) return true
  }
  return false
}

async function rmPackages(dirPath, names = RM_PACKAGES) {
  if (!(await fs.exists(dirPath))) return

  for (const name of names) {
    const dirs = [
      path.join(dirPath, ...name.split('/')),
      ...(await glob(`**/node_modules/${name}`, {
        cwd: dirPath,
        absolute: true,
        follow: false,
      })),
    ]
    for (const dir of dirs) {
      if (!(await fs.exists(dir))) continue
      console.log(`rmPackages: ${path.relative(dirPath, dir)}`)
      await fs.remove(dir)
    }
  }
}

async function slim(dirPath, nativeNames = new Set()) {
  if (!(await fs.exists(dirPath))) {
    console.log(`slim skip, not found: ${dirPath}`)
    return
  }

  const files = await glob(`${dirPath}/**`, {
    nodir: true,
    follow: false,
    dot: true,
  })

  let size = 0
  let count = 0

  for (const file of files) {
    const relativePath = path.relative(dirPath, file)
    if (isUnderNativePackage(relativePath, nativeNames)) continue

    const ext = path.extname(relativePath).replace(/^\./, '')
    if (REMAIN_EXTENSIONS[ext]) continue
    if (!ext && shouldForceRemain(relativePath)) continue

    try {
      const stat = await fs.lstat(file)
      size += stat.size
      count++
      await fs.remove(file)
    } catch {}
  }

  console.log(
    `slim ${dirPath}: deleted ${(size / 1024 / 1024).toFixed(
      2
    )}MB (${count} files)`
  )
}

async function stringifyJSON(dirPath) {
  if (!(await fs.exists(dirPath))) return

  const jsonFiles = await glob(`${dirPath}/**/*.json`, {
    nodir: true,
    follow: false,
  })

  console.log(`Compacting ${jsonFiles.length} json files under ${dirPath}...`)

  let originSize = 0
  let compressedSize = 0
  let errorCount = 0

  for (let i = 0; i < jsonFiles.length; i++) {
    const file = jsonFiles[i]
    if (i > 0 && i % 1000 === 0) {
      console.log(`json progress ${i}/${jsonFiles.length}`)
    }

    const content = await fs.readFile(file, 'utf8')
    try {
      originSize += content.length
      const result = JSON.stringify(JSON.parse(content))
      compressedSize += result.length
      if (result.length < content.length) {
        await fs.writeFile(file, result)
      }
    } catch {
      compressedSize += content.length
      errorCount++
    }
  }

  console.log(
    `json ${dirPath}: ${(originSize / 1024 / 1024).toFixed(2)}MB → ${(
      compressedSize /
      1024 /
      1024
    ).toFixed(2)}MB` + (errorCount ? ` (${errorCount} errors)` : '')
  )
}

async function minifyJs(dirPath) {
  if (!(await fs.exists(dirPath))) {
    console.log(`minify skip, not found: ${dirPath}`)
    return
  }

  console.log(`Minifying ${dirPath}...`)

  const jsFiles = await glob(`${dirPath}/**/*.{js,mjs,cjs}`, {
    ignore: ['**/*.min.js', '**/*.min.mjs', '**/*.min.cjs'],
    nodir: true,
    follow: false,
  })

  let minifiedCount = 0
  let originSize = 0
  let compressedSize = 0
  let errorCount = 0

  const minifyOptions = {
    compress: {
      passes: 2,
      pure_getters: false,
    },
  }

  for (let i = 0; i < jsFiles.length; i++) {
    const file = jsFiles[i]
    if (i > 0 && i % 500 === 0) {
      console.log(`minify progress ${i}/${jsFiles.length}`)
    }

    try {
      const code = await fs.readFile(file, 'utf8')
      if (code.split('\n').length < 2) continue

      const oldSize = Buffer.byteLength(code)
      originSize += oldSize
      const result = await minify(code, minifyOptions)
      if (!result?.code) {
        errorCount++
        compressedSize += oldSize
        continue
      }

      const newSize = Buffer.byteLength(result.code)
      compressedSize += newSize
      if (newSize < oldSize) {
        await fs.writeFile(file, result.code)
        minifiedCount++
      }
    } catch {
      errorCount++
    }
  }

  console.log(
    `Minified ${minifiedCount}/${jsFiles.length} files, ${(
      originSize /
      1024 /
      1024
    ).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB` +
      (errorCount ? ` (${errorCount} errors)` : '')
  )
}

async function compact(dirPath) {
  console.log(`\n=== ${dirPath} ===`)
  const nativeNames =
    path.basename(dirPath) === 'node_modules'
      ? await prepareNativeModules(dirPath)
      : new Set()
  await slim(dirPath, nativeNames)
  await stringifyJSON(dirPath)
  await minifyJs(dirPath)
}

cd('dist')

await rmPackages('node_modules')
await compact('node_modules')
await compact('resources/npm')
