// JavaScript RegEx Profile
import type { Profile } from './ExpressionLexer'

const y = true
const n = false

// Test browser support
function test(expr: string, flag?: string): boolean {
  try {
    new RegExp(expr, flag)
    return true
  } catch {
    return false
  }
}

const unicodeFlag = test('.', 'u')
const stickyFlag = test('.', 'y')
const dotallFlag = test('.', 's')
const lookbehind = test('(?<=A)')
const namedgroup = test('(?<A>B)')

export const javascriptProfile: Profile = {
  id: 'js',
  charTypes: {
    '.': 'dot',
    '^': 'bof',
    $: 'eof',
    '|': 'alt',
  },
  escCharTypes: {
    b: 'wordboundary',
    B: 'notwordboundary',
    d: 'digit',
    D: 'notdigit',
    s: 'whitespace',
    S: 'notwhitespace',
    w: 'word',
    W: 'notword',
  },
  escCharCodes: {
    t: 9, // tab
    n: 10, // line feed
    v: 11, // vertical tab
    f: 12, // form feed
    r: 13, // carriage return
    '0': 0, // null
  },
  escChars: {
    '[': y,
    ']': y,
    '(': y,
    ')': y,
    '{': y,
    '}': y,
    '?': y,
    '+': y,
    '*': y,
    '.': y,
    '\\': y,
    '/': y,
    '^': y,
    $: y,
    '|': y,
    '-': y,
  },
  badEscChars: {
    a: y,
    e: y,
  },
  flags: {
    g: y,
    i: y,
    m: y,
    s: dotallFlag,
    u: unicodeFlag,
    y: stickyFlag,
  },
  tokens: {
    namedgroup: namedgroup,
    poslookbehind: lookbehind,
    neglookbehind: lookbehind,
    escchar: y,
    escunicodeu: y,
    escunicodexb: n,
  },
  modes: {},
  config: {
    forwardref: n,
    nestedref: n,
    ctrlcodeerr: n,
  },
  posixCharClasses: n,
  unicodeScripts: n,
  unicodeCategories: n,
  unquantifiable: {
    quant: y,
    lazy: y,
    possessive: y,
    open: y,
    close: y,
    alt: y,
    bof: y,
    eof: y,
    bos: y,
    eos: y,
    abseos: y,
  },
}
