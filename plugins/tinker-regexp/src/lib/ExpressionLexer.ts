// Simplified ExpressionLexer for JavaScript RegEx
// Based on RegExr by gskinner.com

export interface Token {
  i: number // index
  l: number // length
  type: string
  clss?: string
  code?: number
  value?: string
  error?: { id: string; warning?: boolean }
  modes?: Record<string, boolean>
  prev?: Token | null
  next?: Token | null
  prv?: Token | null // previous active token
  open?: Token
  close?: Token | null
  related?: Token[]
  ignore?: boolean
  capture?: boolean
  num?: number
  name?: string
  min?: number
  max?: number
  startPos?: { line: number; ch: number }
  endPos?: { line: number; ch: number }
  depth?: number
  set?: Token[]
  proxy?: Token
}

export interface Profile {
  id: string
  charTypes: Record<string, string>
  escCharTypes: Record<string, string>
  escCharCodes: Record<string, number | false>
  escChars: Record<string, boolean>
  badEscChars: Record<string, boolean>
  flags: Record<string, boolean>
  tokens: Record<string, boolean>
  modes: Record<string, boolean>
  config: Record<string, boolean>
  posixCharClasses: Record<string, boolean> | false
  unicodeScripts: Record<string, boolean> | false
  unicodeCategories: Record<string, boolean> | false
  unquantifiable: Record<string, boolean>
}

const ANCHOR_TYPES: Record<string, boolean> = {
  bof: true,
  eof: true,
  bos: true,
  eos: true,
  abseos: true,
  wordboundary: true,
  notwordboundary: true,
  prevmatchend: true,
}

export class ExpressionLexer {
  profile: Profile | null = null
  string: string | null = null
  token: Token | null = null
  errors: Token[] = []
  captureGroups: Token[] = []
  namedGroups: Record<string, Token> = {}
  private _modes: Record<string, boolean> = {}
  private branchResetGroups: Token[] = []

  parse(str: string): Token | null {
    if (!this.profile) return null
    if (str === this.string) return this.token

    this.token = null
    this._modes = {}
    this.string = str
    this.errors = []
    this.captureGroups = []
    this.namedGroups = {}
    const brgroups = (this.branchResetGroups = [])
    const groups: Token[] = []
    let i = 0
    const l = str.length
    let token: Token
    let charset: Token | null = null
    let prev: Token | null = null
    let prv: Token | null = null
    const profile = this.profile
    const unquantifiable = profile.unquantifiable
    const charTypes = profile.charTypes
    const closeIndex = str.lastIndexOf('/')

    for (let i = closeIndex + 1; i < l; i++) {
      this._modes[str[i]] = true
    }

    while (i < l) {
      const c = str[i]

      token = { i, l: 1, prev, prv, modes: this._modes, type: '' }
      if (prev) prev.next = token
      else this.token = token

      if (i === 0 || i >= closeIndex) {
        this.parseFlag(str, token)
      } else if (c === '(' && !charset) {
        this.parseParen(str, token)
        if (token.close === null) {
          token.depth = groups.length
          groups.push(token)
        }
        if (token.capture) this.addCaptureGroup(token)
      } else if (c === ')' && !charset) {
        token.type = 'groupclose'
        if (groups.length) {
          const o = (token.open = groups.pop()!)
          o.close = token
          if (o.type === 'branchreset') {
            brgroups.pop()
          }
        } else {
          token.error = { id: 'groupclose' }
        }
      } else if (c === '[') {
        charset = this.parseSquareBracket(str, token, charset)
      } else if (c === ']' && charset) {
        token.type = 'setclose'
        token.open = charset
        charset.close = token
        charset = null
      } else if ((c === '+' || c === '*') && !charset) {
        token.type = charTypes[c]
        token.clss = 'quant'
        token.min = c === '+' ? 1 : 0
        token.max = -1
      } else if (
        c === '{' &&
        !charset &&
        str.substr(i).search(/^{\d+,?\d*}/) !== -1
      ) {
        this.parseQuant(str, token)
      } else if (c === '\\') {
        this.parseBackSlash(str, token, charset, closeIndex)
      } else if (c === '?' && !charset) {
        if (!prv || prv.clss !== 'quant') {
          token.type = charTypes[c]
          token.clss = 'quant'
          token.min = 0
          token.max = 1
        } else {
          token.type = 'lazy'
          token.related = [prv]
        }
      } else if (
        c === '-' &&
        charset &&
        prv &&
        prv.code !== undefined &&
        prv.prv &&
        prv.prv.type !== 'range'
      ) {
        token.type = 'range'
      } else {
        this.parseChar(str, token, charset)
        if (!charset && this._modes.x && /\s/.test(c)) {
          token.ignore = true
          token.type = 'ignorews'
        }
      }

      if (token.clss === 'quant') {
        if (
          !prv ||
          prv.close !== undefined ||
          unquantifiable[prv.type] ||
          (prv.open && unquantifiable[prv.open.type])
        ) {
          token.error = { id: 'quanttarg' }
        } else {
          token.related = [prv.open || prv]
        }
      }

      if (prv && prv.type === 'range' && prv.l === 1) {
        this.validateRange(str, token)
      }

      if (token.open && !token.clss) {
        token.clss = token.open.clss
      }
      if (token.error) {
        this.addError(token)
      }
      i += token.l
      prev = token
      if (!token.ignore) prv = token
    }

    while (groups.length) {
      this.addError(groups.pop()!, { id: 'groupopen' })
    }
    if (charset) {
      this.addError(charset, { id: 'setopen' })
    }

    return this.token
  }

  private addError(
    token: Token,
    error: { id: string; warning?: boolean } = token.error!
  ) {
    token.error = error
    this.errors.push(token)
  }

  private addCaptureGroup(token: Token) {
    const capgroups = this.captureGroups
    const namedgroups = this.namedGroups
    token.num = capgroups.length + 1
    capgroups.push(token)
    if (token.name && !token.error) {
      if (/\d/.test(token.name[0])) {
        token.error = { id: 'badname' }
      } else if (namedgroups[token.name]) {
        token.error = { id: 'dupname' }
        token.related = [namedgroups[token.name]]
      } else {
        namedgroups[token.name] = token
      }
    }
  }

  private parseFlag(str: string, token: Token) {
    const i = token.i
    const c = str[i]
    if (str[i] === '/') {
      token.type = i === 0 ? 'open' : 'close'
      if (i !== 0 && this.token) {
        token.related = [this.token]
        this.token.related = [token]
      }
    } else {
      token.type = this.profile!.flags[c] ? c : 'flag'
    }
  }

  private parseChar(str: string, token: Token, charset: Token | null) {
    const c = str[token.i]
    token.type = (!charset && this.profile!.charTypes[c]) || 'char'
    if (!charset && c === '/') {
      token.error = { id: 'fwdslash' }
    }
    if (token.type === 'char') {
      token.code = c.charCodeAt(0)
    } else if (ANCHOR_TYPES[token.type]) {
      token.clss = 'anchor'
    } else if (token.type === 'dot') {
      token.clss = 'charclass'
    }
    return token
  }

  private parseSquareBracket(
    str: string,
    token: Token,
    charset: Token | null
  ): Token | null {
    if (!charset) {
      token.type = token.clss = 'set'
      if (str[token.i + 1] === '^') {
        token.l++
        token.type += 'not'
      }
      charset = token
    } else {
      this.parseChar(str, token, charset)
    }
    return charset
  }

  private parseParen(str: string, token: Token) {
    token.clss = token.type = 'group'
    if (str[token.i + 1] !== '?') {
      token.close = null
      token.capture = true
      return token
    }

    const sub = str.substr(token.i + 2)
    const s = sub[0]
    let match

    if (s === ':') {
      token.type = 'noncapgroup'
      token.close = null
      token.l = 3
    } else if (/^<?[=!]/.test(sub)) {
      token.clss = 'lookaround'
      token.close = null
      match = sub.match(/^<?[=!]/)!
      const m = match[0]
      const behind = m[0] === '<'
      const negative = m[+behind] === '!'
      token.type = `${negative ? 'neg' : 'pos'}look${
        behind ? 'behind' : 'ahead'
      }`
      token.l = m.length + 2
    } else if ((match = sub.match(/^<(\w+)>/))) {
      token.type = 'namedgroup'
      token.close = null
      token.name = match[1]
      token.capture = true
      token.l = match[0].length + 2
    } else {
      token.close = null
      token.capture = true
    }

    if (this.profile && !this.profile.tokens[token.type]) {
      token.error = { id: 'notsupported' }
    }

    return token
  }

  private parseBackSlash(
    str: string,
    token: Token,
    charset: Token | null,
    closeIndex: number
  ) {
    const i = token.i
    const sub = str.substr(i + 1)
    const c = sub[0]
    let match

    if (i + 1 === closeIndex || i + 1 === str.length) {
      token.error = { id: 'esccharopen' }
      return
    }

    if ((match = sub.match(/^u([\da-fA-F]{4})/))) {
      token.type = 'escunicodeu'
      token.l += match[0].length
      token.code = parseInt(match[1], 16)
    } else if ((match = sub.match(/^x([\da-fA-F]{0,2})/))) {
      token.type = 'eschexadecimal'
      token.l += match[0].length
      token.code = parseInt(match[1] || '0', 16)
    } else if ((match = sub.match(/^[0-7]{1,3}/))) {
      token.type = 'escoctal'
      let octal = match[0]
      if (parseInt(octal, 8) > 255) {
        octal = octal.substr(0, 2)
      }
      token.l += octal.length
      token.code = parseInt(octal, 8)
    } else {
      if ((token.type = this.profile!.escCharTypes[c])) {
        token.l++
        token.clss = ANCHOR_TYPES[token.type] ? 'anchor' : 'charclass'
        return token
      }

      const escCode = this.profile!.escCharCodes[c]
      if (escCode === undefined || escCode === false) {
        return this.parseEscChar(token, c)
      }
      token.code = escCode

      token.l++
      token.type = 'esc_' + token.code
    }
    token.clss = 'esc'
    return token
  }

  private parseEscChar(token: Token, c: string) {
    const profile = this.profile!
    token.l = 2
    if (
      (!profile.badEscChars[c] &&
        profile.tokens['escchar'] &&
        !this._modes.u) ||
      profile.escChars[c]
    ) {
      token.type = 'escchar'
      token.code = c.charCodeAt(0)
      token.clss = 'esc'
    } else {
      token.error = { id: 'esccharbad' }
    }
  }

  private parseQuant(str: string, token: Token) {
    token.type = token.clss = 'quant'
    const i = token.i
    const end = str.indexOf('}', i + 1)
    token.l += end - i
    const arr = str.substring(i + 1, end).split(',')
    token.min = parseInt(arr[0])
    token.max =
      arr[1] === undefined ? token.min : arr[1] === '' ? -1 : parseInt(arr[1])
    if (token.max !== -1 && token.min > token.max) {
      token.error = { id: 'quantrev' }
    }
    return token
  }

  private validateRange(str: string, end: Token) {
    const next = end
    const token = end.prv!
    const prv = token.prv!
    if (prv.code === undefined || next.code === undefined) {
      this.parseChar(str, token, null)
    } else {
      token.clss = 'set'
      if (prv.code > next.code) {
        token.error = { id: 'rangerev' }
        this.errors.push(token)
      }
      next.proxy = prv.proxy = token
      token.set = [prv, token, next]
    }
  }
}
