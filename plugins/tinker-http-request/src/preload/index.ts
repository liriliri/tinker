import { contextBridge } from 'electron'
import * as http from 'http'
import * as https from 'https'
import * as querystring from 'querystring'
import filter from 'licia/filter'
import each from 'licia/each'
import type { RequestConfig, HttpResponse, KeyValuePair } from '../common/types'

const MAX_RESPONSE_SIZE = 50 * 1024 * 1024

let currentRequest: http.ClientRequest | null = null

function getEnabledPairs(pairs: KeyValuePair[]): KeyValuePair[] {
  return filter(pairs, (p: KeyValuePair) => p.enabled && p.key.trim() !== '')
}

function createErrorResponse(startTime: number, message: string): HttpResponse {
  return {
    status: 0,
    statusText: '',
    headers: {},
    body: '',
    bodyBytes: [],
    duration: Date.now() - startTime,
    size: 0,
    error: message,
  }
}

const httpRequestObj = {
  async send(config: RequestConfig): Promise<HttpResponse> {
    return new Promise((resolve) => {
      const startTime = Date.now()

      try {
        let urlStr = config.url.trim()
        if (!urlStr.match(/^https?:\/\//)) {
          urlStr = 'http://' + urlStr
        }

        const url = new URL(urlStr)

        const enabledParams = getEnabledPairs(config.params)
        each(enabledParams, (p: KeyValuePair) => {
          url.searchParams.append(p.key, p.value)
        })

        const isHttps = url.protocol === 'https:'

        const headers: Record<string, string> = {}
        const enabledHeaders = getEnabledPairs(config.headers)
        each(enabledHeaders, (h: KeyValuePair) => {
          headers[h.key] = h.value
        })

        if (config.authType === 'basic') {
          const credentials = Buffer.from(
            `${config.authBasicUser}:${config.authBasicPass}`
          ).toString('base64')
          headers['Authorization'] = `Basic ${credentials}`
        } else if (config.authType === 'bearer') {
          headers['Authorization'] = `Bearer ${config.authBearerToken}`
        }

        let bodyData: string | undefined

        if (
          config.method !== 'GET' &&
          config.method !== 'HEAD' &&
          config.bodyType !== 'none'
        ) {
          if (config.bodyType === 'json') {
            if (!headers['Content-Type']) {
              headers['Content-Type'] = 'application/json'
            }
            bodyData = config.body
          } else if (config.bodyType === 'form-urlencoded') {
            if (!headers['Content-Type']) {
              headers['Content-Type'] = 'application/x-www-form-urlencoded'
            }
            const enabledFormData = getEnabledPairs(config.formData)
            const formObj: Record<string, string> = {}
            each(enabledFormData, (p: KeyValuePair) => {
              formObj[p.key] = p.value
            })
            bodyData = querystring.stringify(formObj)
          } else if (config.bodyType === 'text') {
            bodyData = config.body
          }
        }

        const options: http.RequestOptions = {
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: url.pathname + url.search,
          method: config.method,
          headers,
        }

        const callback = (res: http.IncomingMessage) => {
          const chunks: Buffer[] = []
          let totalSize = 0

          res.on('data', (chunk: Buffer) => {
            totalSize += chunk.length
            if (totalSize > MAX_RESPONSE_SIZE) {
              res.destroy()
              currentRequest = null
              resolve(
                createErrorResponse(
                  startTime,
                  `Response exceeded ${MAX_RESPONSE_SIZE / 1024 / 1024}MB limit`
                )
              )
              return
            }
            chunks.push(chunk)
          })

          res.on('end', () => {
            currentRequest = null
            const buffer = Buffer.concat(chunks)
            const body = buffer.toString('utf-8')
            const bodyBytes = Array.from(buffer)
            const duration = Date.now() - startTime

            const responseHeaders: Record<string, string> = {}
            const rawHeaders = res.headers
            for (const key of Object.keys(rawHeaders)) {
              const val = rawHeaders[key]
              if (val !== undefined) {
                responseHeaders[key] = Array.isArray(val) ? val.join(', ') : val
              }
            }

            resolve({
              status: res.statusCode || 0,
              statusText: res.statusMessage || '',
              headers: responseHeaders,
              body,
              bodyBytes,
              duration,
              size: buffer.length,
            })
          })
        }

        const req = isHttps
          ? https.request(options, callback)
          : http.request(options, callback)

        req.on('error', (error) => {
          currentRequest = null
          resolve(createErrorResponse(startTime, error.message))
        })

        currentRequest = req

        if (bodyData) {
          req.write(bodyData)
        }
        req.end()
      } catch (error) {
        currentRequest = null
        resolve(
          createErrorResponse(
            startTime,
            error instanceof Error ? error.message : String(error)
          )
        )
      }
    })
  },

  abort(): void {
    if (currentRequest) {
      currentRequest.destroy()
      currentRequest = null
    }
  },
}

contextBridge.exposeInMainWorld('httpRequest', httpRequestObj)

declare global {
  const httpRequest: typeof httpRequestObj
}
