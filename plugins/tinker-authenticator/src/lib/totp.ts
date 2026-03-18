import type { OTPAlgorithm } from '../types'
import query from 'licia/query'
import trim from 'licia/trim'
import upperCase from 'licia/upperCase'

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const ALGORITHM_NAME_MAP: Record<OTPAlgorithm, string> = {
  SHA1: 'SHA-1',
  SHA256: 'SHA-256',
  SHA512: 'SHA-512',
}
const OTP_AUTH_URI_RE = /^otpauth:\/\/totp\/([^?#]*)(?:\?([^#]*))?/i
const keyCache = new Map<string, CryptoKey>()

function getQueryValue(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function parseInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function normalizeSecret(input: string): string {
  return upperCase(trim(input)).replace(/\s+/g, '').replace(/=+$/g, '')
}

function base32Decode(input: string): Uint8Array {
  const str = normalizeSecret(input)
  let bits = 0
  let value = 0
  let index = 0
  const output = new Uint8Array(Math.floor((str.length * 5) / 8))

  for (let i = 0; i < str.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(str[i])
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 0xff
      bits -= 8
    }
  }

  return output.slice(0, index)
}

function algorithmName(algorithm: OTPAlgorithm): string {
  return ALGORITHM_NAME_MAP[algorithm] || ALGORITHM_NAME_MAP.SHA1
}

export async function generateTOTP(
  secret: string,
  algorithm: OTPAlgorithm,
  period: number,
  digits: number
): Promise<string> {
  const secretBytes = base32Decode(secret)
  const secretBuffer = secretBytes.buffer.slice(
    secretBytes.byteOffset,
    secretBytes.byteOffset + secretBytes.byteLength
  ) as ArrayBuffer
  const counter = Math.floor(Date.now() / 1000 / period)

  const counterBuffer = new ArrayBuffer(8)
  const view = new DataView(counterBuffer)
  view.setUint32(0, Math.floor(counter / 0x100000000), false)
  view.setUint32(4, counter >>> 0, false)

  const cacheKey = `${secret}:${algorithm}`
  let key = keyCache.get(cacheKey)
  if (!key) {
    key = await crypto.subtle.importKey(
      'raw',
      secretBuffer,
      { name: 'HMAC', hash: { name: algorithmName(algorithm) } },
      false,
      ['sign']
    )
    keyCache.set(cacheKey, key)
  }

  const signature = await crypto.subtle.sign('HMAC', key, counterBuffer)
  const hmac = new Uint8Array(signature)

  const offset = hmac[hmac.length - 1] & 0x0f
  const code =
    (((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)) %
    Math.pow(10, digits)

  return code.toString().padStart(digits, '0')
}

export function parseOtpAuthUri(uri: string): Partial<{
  issuer: string
  account: string
  secret: string
  algorithm: OTPAlgorithm
  period: number
  digits: number
}> | null {
  try {
    const match = trim(uri).match(OTP_AUTH_URI_RE)
    if (!match) return null

    const label = decodeURIComponent(match[1] || '')
    const params = query.parse(match[2] || '') as Record<
      string,
      string | string[] | undefined
    >

    let issuer = trim(getQueryValue(params.issuer) || '')
    let account = label

    const labelDelimiterIdx = label.indexOf(':')
    if (labelDelimiterIdx !== -1) {
      const labelIssuer = trim(label.slice(0, labelDelimiterIdx))
      const labelAccount = trim(label.slice(labelDelimiterIdx + 1))
      if (!issuer) issuer = labelIssuer
      account = labelAccount
    }

    const secret = normalizeSecret(getQueryValue(params.secret) || '')
    const algorithmRaw = upperCase(getQueryValue(params.algorithm) || 'SHA1')
    const algorithm: OTPAlgorithm = ['SHA1', 'SHA256', 'SHA512'].includes(
      algorithmRaw
    )
      ? (algorithmRaw as OTPAlgorithm)
      : 'SHA1'
    const period = parseInteger(getQueryValue(params.period), 30)
    const digits = parseInteger(getQueryValue(params.digits), 6)

    return { issuer, account: trim(account), secret, algorithm, period, digits }
  } catch {
    return null
  }
}

export function buildOtpAuthUri(account: {
  issuer: string
  account: string
  secret: string
  algorithm: OTPAlgorithm
  period: number
  digits: number
}): string {
  const label = account.issuer
    ? `${encodeURIComponent(account.issuer)}:${encodeURIComponent(
        account.account
      )}`
    : encodeURIComponent(account.account)
  const params = new URLSearchParams({
    secret: account.secret,
    issuer: account.issuer,
    algorithm: account.algorithm,
    digits: String(account.digits),
    period: String(account.period),
  })
  return `otpauth://totp/${label}?${params.toString()}`
}

export function formatCode(code: string): string {
  if (code.length === 6) return `${code.slice(0, 3)} ${code.slice(3)}`
  if (code.length === 8) return `${code.slice(0, 4)} ${code.slice(4)}`
  return code
}
