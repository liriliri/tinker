import https from 'node:https'
import http from 'node:http'
import queryString from 'licia/query'
import stripHtmlTag from 'licia/stripHtmlTag'
import unescape from 'licia/unescape'
import type { WebSearchResult } from './web'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

const MAX_RESULTS = 5
const MAX_REDIRECTS = 5

interface SearchItem {
  title: string
  url: string
}

interface FetchHtmlOptions {
  body?: string
  headers?: Record<string, string>
  method?: 'GET' | 'POST'
  redirectCount?: number
}

function fetchHtml(
  url: string,
  { body, headers, method = 'GET', redirectCount = 0 }: FetchHtmlOptions = {}
): Promise<string> {
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
    const req = client.request(
      {
        hostname: parsed.hostname,
        method,
        path: parsed.pathname + parsed.search,
        port: parsed.port || undefined,
        servername: parsed.hostname,
        headers: {
          'User-Agent': USER_AGENT,
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          Origin: `${parsed.protocol}//${parsed.host}`,
          Referer: `${parsed.protocol}//${parsed.host}/`,
          ...headers,
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
          fetchHtml(redirectUrl, {
            body,
            headers,
            method,
            redirectCount: redirectCount + 1,
          })
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
    if (body) {
      req.write(body)
    }
    req.end()
  })
}

function stripTags(html: string): string {
  return unescape(stripHtmlTag(html))
    .replace(/&nbsp;/g, ' ')
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

function parseDuckDuckGoResults(html: string): SearchItem[] {
  const regex =
    /<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
  return parseResults(html, regex)
}

function parseBaiduResults(html: string): SearchItem[] {
  const regex =
    /<h3[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h3>/gi
  return parseResults(html, regex)
}

const MAX_HTML_CHARS = 200_000

function htmlToText(html: string): string {
  const truncated =
    html.length > MAX_HTML_CHARS ? html.slice(0, MAX_HTML_CHARS) : html
  return stripTags(
    truncated
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<(nav|header|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  ).slice(0, 2000)
}

async function fetchTextContent(
  url: string,
  options?: FetchHtmlOptions
): Promise<string> {
  const html = await fetchHtml(url, options)
  return htmlToText(html)
}

export async function webFetch(url: string): Promise<string> {
  try {
    const text = await fetchTextContent(url)

    if (!text) {
      return `Error: Could not extract content from ${url}`
    }

    return `[Content from ${url}]\n\n${text}`
  } catch (e) {
    return `Error fetching ${url}: ${
      e instanceof Error ? e.message : String(e)
    }`
  }
}

export async function webSearch(query: string): Promise<WebSearchResult[]> {
  const lang = await tinker.getLanguage()
  const isZh = lang.startsWith('zh')
  const searchUrl = isZh
    ? `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`
    : 'https://html.duckduckgo.com/html/'
  const parse = isZh ? parseBaiduResults : parseDuckDuckGoResults

  const html = await fetchHtml(
    searchUrl,
    isZh
      ? undefined
      : {
          method: 'POST',
          body: queryString.stringify({ q: query }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
  )
  const items = parse(html).filter((item) => item.url.startsWith('http'))

  const settled = await Promise.allSettled(
    items.map(async (item) => ({
      title: item.title,
      url: item.url,
      content: await fetchTextContent(item.url).catch(() => ''),
    }))
  )

  return settled
    .filter(
      (result): result is PromiseFulfilledResult<WebSearchResult> =>
        result.status === 'fulfilled'
    )
    .map((result) => result.value)
    .filter((result) => result.content.length > 0)
}
