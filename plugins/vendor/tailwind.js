import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import tailwindcss from '@tailwindcss/postcss'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const input = fs.readFileSync(path.join(__dirname, 'tailwind.css'), 'utf-8')

const result = await postcss([tailwindcss({ optimize: { minify: true } })]).process(
  input,
  {
    from: path.join(__dirname, 'tailwind.css'),
    to: path.join(__dirname, 'dist/tailwind.css'),
  }
)

fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true })
fs.writeFileSync(path.join(__dirname, 'dist/tailwind.css'), result.css)
console.log(`Written dist/tailwind.css (${result.css.length} bytes)`)
