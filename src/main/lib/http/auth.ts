import crypto from 'crypto'
import startWith from 'licia/startWith'
import isArr from 'licia/isArr'
import isUndef from 'licia/isUndef'
import Url from 'licia/Url'

export interface HttpAuth {
  username: string
  password: string
}

export function parseHttpAuthArgv(
  argv: string[] = process.argv
): HttpAuth | undefined {
  let username: string | undefined
  let password: string | undefined

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--http-username') {
      const next = argv[i + 1]
      username = next && !startWith(next, '-') ? argv[++i] : ''
      continue
    }
    if (startWith(arg, '--http-username=')) {
      username = arg.slice('--http-username='.length)
      continue
    }
    if (arg === '--http-password') {
      const next = argv[i + 1]
      password = next && !startWith(next, '-') ? argv[++i] : ''
      continue
    }
    if (startWith(arg, '--http-password=')) {
      password = arg.slice('--http-password='.length)
    }
  }

  if (isUndef(username)) {
    return undefined
  }
  return { username, password: password ?? '' }
}

function safeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) {
    return false
  }
  return crypto.timingSafeEqual(aBuf, bBuf)
}

function parseBasicAuthorization(
  header: string | string[] | undefined
): HttpAuth | null {
  const value = isArr(header) ? header[0] : header
  if (!value || !startWith(value, 'Basic ')) {
    return null
  }
  try {
    const decoded = Buffer.from(value.slice(6), 'base64').toString('utf8')
    const idx = decoded.indexOf(':')
    if (idx < 0) {
      return { username: decoded, password: '' }
    }
    return {
      username: decoded.slice(0, idx),
      password: decoded.slice(idx + 1),
    }
  } catch {
    return null
  }
}

export function checkBasicAuth(
  header: string | string[] | undefined,
  auth: HttpAuth
) {
  const parsed = parseBasicAuthorization(header)
  if (!parsed) {
    return false
  }
  return (
    safeEqual(parsed.username, auth.username) &&
    safeEqual(parsed.password, auth.password)
  )
}

export function checkRequestAuth(
  req: { url?: string; headers: { authorization?: string | string[] } },
  auth: HttpAuth
) {
  if (checkBasicAuth(req.headers.authorization, auth)) {
    return true
  }
  try {
    const value = Url.parse(req.url || '/').query?.authorization
    if (!value) {
      return false
    }
    const header = startWith(value, 'Basic ') ? value : `Basic ${value}`
    return checkBasicAuth(header, auth)
  } catch {
    return false
  }
}
