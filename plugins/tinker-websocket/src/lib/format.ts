import truncate from 'licia/truncate'
import dateFormat from 'licia/dateFormat'
import strToBytes from 'licia/strToBytes'
import bytesToStr from 'licia/bytesToStr'
import convertBin from 'licia/convertBin'
import hex from 'licia/hex'
import isJson from 'licia/isJson'

export function isValidWsUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'ws:' || parsed.protocol === 'wss:'
  } catch {
    return false
  }
}

export function formatMessageTime(timestamp: number): string {
  return dateFormat(new Date(timestamp), 'HH:MM:ss.l')
}

export function formatMessagePreview(data: string, maxLen = 120): string {
  const compact = data.replace(/\s+/g, ' ').trim()
  return truncate(compact, maxLen)
}

export function tryFormatJson(data: string): string | null {
  if (!isJson(data)) return null
  return JSON.stringify(JSON.parse(data), null, 2)
}

export function getByteSize(data: string): number {
  return strToBytes(data).length
}

export function formatBytesAsHex(bytes: number[] | Uint8Array): string {
  const encoded = hex.encode(convertBin(bytes, 'Array') as number[])
  return encoded.match(/.{1,2}/g)?.join(' ') || ''
}

export function bytesToText(bytes: number[] | Uint8Array): string {
  return bytesToStr(convertBin(bytes, 'Array') as number[])
}

export function textToBytes(text: string): Uint8Array {
  return convertBin(strToBytes(text), 'Uint8Array') as Uint8Array
}

export function shortUrl(url: string, maxLen = 40): string {
  try {
    const parsed = new URL(url)
    const display = `${parsed.host}${parsed.pathname}${parsed.search}`
    return truncate(display, maxLen)
  } catch {
    return truncate(url, maxLen)
  }
}
