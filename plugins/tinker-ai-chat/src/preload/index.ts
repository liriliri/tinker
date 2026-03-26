import { contextBridge, shell } from 'electron'
import https from 'node:https'
import http from 'node:http'
import type { SearchResult } from '../common/types'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

const MAX_RESULTS = 5
const MAX_REDIRECTS = 5

interface SearchItem {
  title: string
  url: string
}

function fetchHtml(url: string, redirectCount = 0): Promise<string> {
  return new Promise((resolve, reject) => {
    if (redirectCount >= MAX_REDIRECTS) {
      reject(new Error('Too many redirects'))
      return
    }
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      reject(new Error(`Invalid URL: ${url}`))
      return
    }
    const client = parsed.protocol === 'https:' ? https : http
    const req = client.get(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        headers: {
          'User-Agent': USER_AGENT,
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      },
      (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          const redirectUrl = res.headers.location.startsWith('http')
            ? res.headers.location
            : `${parsed.protocol}//${parsed.host}${res.headers.location}`
          fetchHtml(redirectUrl, redirectCount + 1)
            .then(resolve)
            .catch(reject)
          res.resume()
          return
        }
        const chunks: Buffer[] = []
        res.on('data', (c: Buffer) => chunks.push(c))
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
        res.on('error', reject)
      }
    )
    req.setTimeout(15000, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
    req.on('error', reject)
  })
}

function decodeHtml(html: string): string {
  return html
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function stripTags(html: string): string {
  return decodeHtml(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

function parseResults(html: string, regex: RegExp): SearchItem[] {
  const results: SearchItem[] = []

  for (const match of html.matchAll(regex)) {
    const url = match[1]
    const title = stripTags(match[2])
    if (!url || !title) continue
    results.push({ title, url })
    if (results.length >= MAX_RESULTS) break
  }

  return results
}

function parseGoogleResults(html: string): SearchItem[] {
  const regex =
    /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>[\s\S]*?<\/a>/gi
  return parseResults(html, regex)
}

function parseBaiduResults(html: string): SearchItem[] {
  const regex =
    /<h3[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h3>/gi
  return parseResults(html, regex)
}

function htmlToText(html: string): string {
  return stripTags(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<(nav|header|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  ).slice(0, 2000)
}

async function fetchContent(url: string): Promise<string> {
  try {
    const html = await fetchHtml(url)
    return htmlToText(html)
  } catch {
    return ''
  }
}

async function search(query: string, lang: string): Promise<SearchResult[]> {
  const isZh = lang.startsWith('zh')
  const searchUrl = isZh
    ? `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`
    : `https://www.google.com/search?q=${encodeURIComponent(query)}`
  const parse = isZh ? parseBaiduResults : parseGoogleResults

  const html = await fetchHtml(searchUrl)
  const items = parse(html).filter((item) => item.url.startsWith('http'))

  const settled = await Promise.allSettled(
    items.map(async (item) => ({
      title: item.title,
      url: item.url,
      content: await fetchContent(item.url),
    }))
  )

  return settled
    .filter(
      (result): result is PromiseFulfilledResult<SearchResult> =>
        result.status === 'fulfilled'
    )
    .map((result) => result.value)
    .filter((result) => result.content.length > 0)
}

const aiChatObj = {
  openExternal(url: string): void {
    shell.openExternal(url)
  },
  search,
}

contextBridge.exposeInMainWorld('aiChat', aiChatObj)

declare global {
  const aiChat: typeof aiChatObj
}
