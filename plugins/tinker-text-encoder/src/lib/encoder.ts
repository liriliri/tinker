import { encode, decode } from 'xmorse'
import decodeUriComponent from 'licia/decodeUriComponent'

// URL Encoding
export function urlEncode(text: string): string {
  try {
    return encodeURIComponent(text)
  } catch {
    throw new Error('Failed to encode URL')
  }
}

export function urlDecode(text: string): string {
  return decodeUriComponent(text)
}

// Morse Code
export function morseEncode(text: string): string {
  return encode(text)
}

export function morseDecode(morse: string): string {
  return decode(morse)
}

// Unicode Encoding
export function unicodeEncode(text: string): string {
  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0)
      // For ASCII printable characters, keep them as is
      if (code >= 32 && code <= 126) {
        return char
      }
      // For other characters, convert to \uXXXX format
      return '\\u' + code.toString(16).toUpperCase().padStart(4, '0')
    })
    .join('')
}

export function unicodeDecode(text: string): string {
  // Replace \uXXXX with actual characters
  return text.replace(/\\u([0-9A-Fa-f]{4})/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16))
  })
}
