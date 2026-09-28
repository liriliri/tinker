import contain from 'licia/contain'
import endWith from 'licia/endWith'
import lowerCase from 'licia/lowerCase'
import startWith from 'licia/startWith'
import toNum from 'licia/toNum'
import trim from 'licia/trim'
import unique from 'licia/unique'

const LINK_RE = /<link\b[^>]*>/gi

function getAttr(tag: string, name: string): string {
  const re = new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i')
  const match = tag.match(re)
  return match ? trim(match[1]) : ''
}

function scoreIcon(href: string, sizes: string): number {
  const lowerHref = lowerCase(href)
  if (endWith(lowerHref, '.svg') || contain(lowerHref, '.svg?')) return 1000
  const value = lowerCase(trim(sizes))
  if (!value || value === 'any') return 128
  const nums = value.match(/\d+/g)
  if (!nums) return 16
  return Math.max(...nums.map((n) => toNum(n)))
}

/** Collect absolute icon URLs from HTML, largest / SVG first, then /favicon.ico. */
export function collectIconUrls(html: string, baseUrl: string): string[] {
  const candidates: { href: string; score: number }[] = []

  for (const match of html.matchAll(LINK_RE)) {
    const tag = match[0]
    const rel = lowerCase(getAttr(tag, 'rel'))
    if (!rel || !contain(rel, 'icon')) continue
    const href = getAttr(tag, 'href')
    if (!href) continue
    try {
      const absolute = new URL(href, baseUrl).href
      candidates.push({
        href: absolute,
        score: scoreIcon(href, getAttr(tag, 'sizes')),
      })
    } catch {
      // skip malformed href
    }
  }

  candidates.sort((a, b) => b.score - a.score)

  try {
    candidates.push({ href: new URL('/favicon.ico', baseUrl).href, score: 0 })
  } catch {
    // skip if baseUrl cannot resolve relative paths
  }

  return unique(candidates.map((c) => c.href))
}

/** Favicons are almost always ico/png/svg — just reject HTML error pages. */
export function isImagePayload(contentType: string, data: Buffer): boolean {
  if (data.length < 16) return false
  const head = lowerCase(data.subarray(0, 256).toString('utf8'))
  if (contain(head, '<!doctype') || contain(head, '<html')) return false
  const type = lowerCase(contentType.split(';')[0] || '')
  return (
    !type ||
    startWith(type, 'image/') ||
    type === 'application/octet-stream' ||
    contain(head, '<svg')
  )
}

export function extForIcon(contentType: string, url: string): string {
  const type = lowerCase(contentType.split(';')[0] || '')
  if (contain(type, 'svg')) return '.svg'
  if (contain(type, 'png')) return '.png'
  if (contain(type, 'icon') || contain(type, 'ico')) return '.ico'

  try {
    const pathname = lowerCase(new URL(url).pathname)
    if (endWith(pathname, '.svg')) return '.svg'
    if (endWith(pathname, '.png')) return '.png'
    if (endWith(pathname, '.ico')) return '.ico'
  } catch {
    // default below
  }
  return '.png'
}
