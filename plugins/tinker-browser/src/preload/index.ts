import { contextBridge } from 'electron'
import https from 'https'
import http, { IncomingMessage } from 'http'

function fetchUrl(
  url: string,
  redirects = 3
): Promise<{ data: Buffer; contentType: string }> {
  return new Promise((resolve, reject) => {
    const callback = (res: IncomingMessage) => {
      if (
        res.statusCode &&
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        if (redirects <= 0) {
          reject(new Error('Too many redirects'))
          return
        }
        let redirectUrl = res.headers.location
        if (redirectUrl.startsWith('/')) {
          const parsed = new URL(url)
          redirectUrl = `${parsed.protocol}//${parsed.host}${redirectUrl}`
        }
        fetchUrl(redirectUrl, redirects - 1).then(resolve, reject)
        return
      }

      if (!res.statusCode || res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }

      const chunks: Buffer[] = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        resolve({
          data: Buffer.concat(chunks),
          contentType: res.headers['content-type'] || 'image/x-icon',
        })
      })
      res.on('error', reject)
    }

    const req = url.startsWith('https')
      ? https.get(url, { timeout: 5000 }, callback)
      : http.get(url, { timeout: 5000 }, callback)
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Timeout'))
    })
  })
}

const browserObj = {
  async fetchFavicon(url: string): Promise<string> {
    try {
      const parsed = new URL(url)
      const faviconUrl = `${parsed.protocol}//${parsed.host}/favicon.ico`
      const { data, contentType } = await fetchUrl(faviconUrl)
      if (data.length === 0) return ''
      const mimeType = contentType.split(';')[0].trim()
      return `data:${mimeType};base64,${data.toString('base64')}`
    } catch {
      return ''
    }
  },
}

contextBridge.exposeInMainWorld('browser', browserObj)

declare global {
  const browser: typeof browserObj
}
