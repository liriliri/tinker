import { minify } from 'terser'
import { glob } from 'glob'

console.log('Minifying node_modules...')

cd('dist')

const jsFiles = await glob('node_modules/**/*.{js,mjs}', {
  ignore: ['node_modules/**/*.min.js', 'node_modules/**/*.min.mjs'],
  nodir: true,
})

let minifiedCount = 0
let minifiedSaved = 0

for (const file of jsFiles) {
  const stat = await fs.stat(file)

  try {
    const code = await fs.readFile(file, 'utf8')
    const result = await minify(code, { mangle: true, compress: true })
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
