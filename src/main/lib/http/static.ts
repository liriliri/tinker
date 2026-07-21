import path from 'path'
import fs from 'fs'
import { isDev } from 'share/common/util'

export function getRendererRoot() {
  return path.resolve(__dirname, '../renderer')
}

function ensureBaseHref(html: string) {
  if (/<base\s/i.test(html)) return html
  return html.replace(/<head([^>]*)>/i, '<head$1><base href="/" />')
}

async function readDevHtml() {
  const res = await fetch('http://localhost:8080/http.html')
  if (!res.ok) {
    throw new Error(
      'Dev renderer is not running. Start `npm run dev:renderer` first.'
    )
  }
  let html = await res.text()
  html = html.replace(/(src|href)="\//g, '$1="http://localhost:8080/')
  return ensureBaseHref(html)
}

function readBuiltHtml() {
  const filePath = path.join(getRendererRoot(), 'http.html')
  if (!fs.existsSync(filePath)) {
    throw new Error(
      'http.html not found. Run `npm run build:renderer` or start `npm run dev:renderer`.'
    )
  }
  return ensureBaseHref(fs.readFileSync(filePath, 'utf8'))
}

export async function loadAppHtml() {
  if (isDev()) {
    try {
      return await readDevHtml()
    } catch {
      // Vite may be down; fall back to last renderer build.
    }
  }
  return readBuiltHtml()
}
