import { minify } from 'terser'
import { glob } from 'glob'
import path from 'path'

const RM_PACKAGES = ['cpu-features', 'nan']

const NATIVE_MODULES_WITH_PREBUILDS = ['node-pty', 'uiohook-napi']

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

const FORCE_REMAIN_PATTERNS = [
  /(^|\/)bin\//,
  /\/prebuilds\//,
  /ffmpeg-static\/ffmpeg$/,
  /file-icon\/file-icon$/,
  /pdu-static[^/]*\/pdu$/,
  /playwright-core\/lib\/xdg-open$/,
]

function shouldForceRemain(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/')
  return FORCE_REMAIN_PATTERNS.some((pattern) => pattern.test(normalized))
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

async function rmOtherPlatformPrebuilds(dirPath) {
  if (!(await fs.exists(dirPath))) return

  const currentPlatform = `${process.platform}-${process.arch}`

  for (const pkg of NATIVE_MODULES_WITH_PREBUILDS) {
    const prebuildsDir = path.join(dirPath, pkg, 'prebuilds')
    if (!(await fs.exists(prebuildsDir))) continue

    for (const name of await fs.readdir(prebuildsDir)) {
      if (name === currentPlatform) continue
      const target = path.join(prebuildsDir, name)
      console.log(`rmPrebuild: ${path.relative(dirPath, target)}`)
      await fs.remove(target)
    }
  }
}

async function slim(dirPath) {
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
  await slim(dirPath)
  await stringifyJSON(dirPath)
  await minifyJs(dirPath)
}

cd('dist')

await rmPackages('node_modules')
await rmOtherPlatformPrebuilds('node_modules')
await compact('node_modules')
await compact('resources/npm')
