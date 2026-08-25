import { minify } from 'terser'
import { glob } from 'glob'

async function minifyJs(pattern, label) {
  console.log(`Minifying ${label}...`)

  const jsFiles = await glob(pattern, {
    ignore: ['**/*.min.js', '**/*.min.mjs'],
    nodir: true,
  })

  let minifiedCount = 0
  let minifiedSaved = 0

  for (const file of jsFiles) {
    const stat = await fs.stat(file)

    try {
      const code = await fs.readFile(file, 'utf8')
      const result = await minify(code, {
        compress: { pure_getters: false },
      })
      if (!result.code) continue
      const newSize = Buffer.byteLength(result.code)
      if (newSize < stat.size) {
        await fs.writeFile(file, result.code)
        minifiedSaved += stat.size - newSize
        minifiedCount++
      }
    } catch {
      // Skip files that can't be transformed
    }
  }

  console.log(
    `Minified ${minifiedCount} files, saved ${(
      minifiedSaved /
      1024 /
      1024
    ).toFixed(2)}MB`
  )
}

cd('dist')

await minifyJs('node_modules/**/*.{js,mjs}', 'node_modules')
await minifyJs('resources/npm/**/*.{js,mjs,cjs}', 'resources/npm')
