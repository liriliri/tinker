// Morse code mapping
const MORSE_CODE_MAP: Record<string, string> = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  "'": '.----.',
  '!': '-.-.--',
  '/': '-..-.',
  '(': '-.--.',
  ')': '-.--.-',
  '&': '.-...',
  ':': '---...',
  ';': '-.-.-.',
  '=': '-...-',
  '+': '.-.-.',
  '-': '-....-',
  _: '..--.-',
  '"': '.-..-.',
  $: '...-..-',
  '@': '.--.-.',
  ' ': '/',
}

// Reverse morse code mapping
const MORSE_TO_CHAR_MAP: Record<string, string> = Object.entries(
  MORSE_CODE_MAP
).reduce((acc, [char, morse]) => {
  acc[morse] = char
  return acc
}, {} as Record<string, string>)

// URL Encoding
export function urlEncode(text: string): string {
  try {
    return encodeURIComponent(text)
  } catch {
    throw new Error('Failed to encode URL')
  }
}

export function urlDecode(text: string): string {
  try {
    return decodeURIComponent(text)
  } catch {
    throw new Error('Failed to decode URL')
  }
}

// Morse Code
export function morseEncode(text: string): string {
  return text
    .toUpperCase()
    .split('')
    .map((char) => MORSE_CODE_MAP[char] || char)
    .join(' ')
}

export function morseDecode(morse: string): string {
  return morse
    .split(' ')
    .map((code) => MORSE_TO_CHAR_MAP[code] || code)
    .join('')
}
