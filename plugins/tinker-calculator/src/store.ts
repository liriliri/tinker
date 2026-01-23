import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import isStrBlank from 'licia/isStrBlank'
import BaseStore from 'share/BaseStore'
import math, { createScope, formatResult } from './lib/math'

const storage = new LocalStore('tinker-calculator')

const OPERATORS = ['+', '-', '*', '/', '^']
const STATE_KEY = 'calculator-state'

type StoredState = {
  expression: string
  memory: string
  isDegree: boolean
}

class Store extends BaseStore {
  expression = ''
  displayValue = '0'
  preview = ''
  memory = '0'
  isSecond = false
  isDegree = false
  hasError = false
  justEvaluated = false
  lastRandomValue: string | null = null

  get isBackspaceActive() {
    return !this.justEvaluated && !this.hasError && this.expression.length > 0
  }

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadState()
  }

  private loadState() {
    const saved = storage.get(STATE_KEY) as StoredState | undefined
    if (!saved) return
    this.expression = saved.expression || ''
    this.displayValue = saved.expression || '0'
    this.memory = saved.memory || '0'
    this.isDegree = Boolean(saved.isDegree)
  }

  private persistState() {
    storage.set(STATE_KEY, {
      expression: this.expression,
      memory: this.memory,
      isDegree: this.isDegree,
    })
  }

  private resetInput() {
    this.expression = ''
    this.displayValue = '0'
    this.preview = ''
    this.hasError = false
    this.justEvaluated = false
    this.lastRandomValue = null
  }

  private updateExpression(value: string, keepRandom = false) {
    this.expression = value
    this.displayValue = value || '0'
    if (!keepRandom) {
      this.lastRandomValue = null
    }
  }

  private startNewEntry() {
    if (!this.justEvaluated) return
    this.preview = ''
    this.expression = ''
    this.displayValue = '0'
    this.justEvaluated = false
    this.lastRandomValue = null
  }

  private getLastValueRange() {
    const expr = this.expression
    if (!expr) return null
    if (expr.endsWith(')')) {
      let depth = 0
      for (let i = expr.length - 1; i >= 0; i -= 1) {
        const ch = expr[i]
        if (ch === ')') depth += 1
        if (ch === '(') depth -= 1
        if (depth === 0) {
          return { start: i, end: expr.length }
        }
      }
      return null
    }
    const match = expr.match(/(pi|e|[0-9.]+)$/)
    if (!match) return null
    return { start: expr.length - match[0].length, end: expr.length }
  }

  private replaceLastValue(transform: (value: string) => string) {
    const range = this.getLastValueRange()
    if (!range) return false
    const value = this.expression.slice(range.start, range.end)
    const before = this.expression.slice(0, range.start)
    const after = this.expression.slice(range.end)
    this.updateExpression(`${before}${transform(value)}${after}`)
    return true
  }

  private evaluateExpression(expression: string): string {
    const scope = createScope(this.isDegree)
    const result = math.evaluate(expression, scope)
    return formatResult(result)
  }

  clearAll() {
    this.resetInput()
    this.persistState()
  }

  toggleSecond() {
    this.isSecond = !this.isSecond
  }

  toggleDegree() {
    this.isDegree = !this.isDegree
    this.persistState()
  }

  inputDigit(digit: string) {
    if (this.hasError) this.resetInput()
    this.startNewEntry()
    if (this.expression === '0') {
      this.updateExpression(digit)
      return
    }
    this.updateExpression(`${this.expression}${digit}`)
  }

  inputDot() {
    if (this.hasError) this.resetInput()
    this.startNewEntry()
    const match = this.expression.match(/([0-9.]+)$/)
    const lastNumber = match ? match[0] : ''
    if (lastNumber.includes('.')) return
    if (
      this.expression === '' ||
      OPERATORS.includes(this.expression.slice(-1))
    ) {
      this.updateExpression(`${this.expression}0.`)
      return
    }
    this.updateExpression(`${this.expression}.`)
  }

  inputOperator(operator: string) {
    if (this.hasError) this.resetInput()
    if (this.expression === '') {
      if (operator === '-') {
        this.updateExpression('-')
      }
      return
    }
    if (this.justEvaluated) {
      this.preview = ''
      this.justEvaluated = false
    }
    const last = this.expression.slice(-1)
    if (OPERATORS.includes(last)) {
      this.updateExpression(`${this.expression.slice(0, -1)}${operator}`)
      return
    }
    this.updateExpression(`${this.expression}${operator}`)
  }

  appendToken(token: string) {
    if (this.hasError) this.resetInput()
    this.startNewEntry()
    this.updateExpression(`${this.expression}${token}`)
  }

  insertConstant(constant: string) {
    this.appendToken(constant)
  }

  insertRandom() {
    if (this.hasError) this.resetInput()
    this.startNewEntry()
    const randomValue = formatResult(Number(Math.random().toFixed(8)))
    const range = this.getLastValueRange()
    const lastValue =
      range && range.start >= 0 && range.end >= 0
        ? this.expression.slice(range.start, range.end)
        : null

    const needsMultiply = (before: string) => /[0-9a-zA-Z)!]$/.test(before)

    if (range && lastValue === this.lastRandomValue) {
      const before = this.expression.slice(0, range.start)
      const after = this.expression.slice(range.end)
      const multiplier = needsMultiply(before) ? '*' : ''
      this.updateExpression(
        `${before}${multiplier}${randomValue}${after}`,
        true
      )
    } else {
      const multiplier = needsMultiply(this.expression) ? '*' : ''
      this.updateExpression(
        `${this.expression}${multiplier}${randomValue}`,
        true
      )
    }

    this.lastRandomValue = randomValue
  }

  backspace() {
    if (this.hasError || this.justEvaluated || this.expression.length === 0) {
      this.clearAll()
      return
    }
    const next = this.expression.slice(0, -1)
    this.updateExpression(next)
  }

  toggleSign() {
    if (this.hasError) this.resetInput()
    const updated = this.replaceLastValue((value) => {
      if (value.startsWith('(-') && value.endsWith(')')) {
        return value.slice(2, -1)
      }
      return `(-${value})`
    })
    if (!updated && this.expression === '') {
      this.updateExpression('-')
    }
  }

  applyPercent() {
    this.replaceLastValue((value) => `(${value}*0.01)`)
  }

  applyWrap(kind: string) {
    const updated = this.replaceLastValue((value) => {
      switch (kind) {
        case 'square':
          return `(${value})^2`
        case 'cube':
          return `(${value})^3`
        case 'reciprocal':
          return `1/(${value})`
        case 'factorial':
          return `(${value})!`
        case 'sqrt':
          return `sqrt(${value})`
        case 'cbrt':
          return `cbrt(${value})`
        default:
          return value
      }
    })

    if (!updated) {
      if (kind === 'sqrt') {
        this.appendToken('sqrt(')
      } else if (kind === 'cbrt') {
        this.appendToken('cbrt(')
      }
    }
  }

  memoryClear() {
    this.memory = '0'
    this.persistState()
  }

  memoryRecall() {
    if (this.hasError) this.resetInput()
    if (this.justEvaluated || this.expression === '') {
      this.preview = ''
      this.justEvaluated = false
      this.updateExpression(this.memory)
    } else {
      this.updateExpression(`${this.expression}${this.memory}`)
    }
  }

  memoryAdd() {
    this.updateMemoryWithOperation('+')
  }

  memorySubtract() {
    this.updateMemoryWithOperation('-')
  }

  private updateMemoryWithOperation(operator: string) {
    if (this.hasError) this.resetInput()
    const value = isStrBlank(this.displayValue) ? '0' : this.displayValue
    try {
      const result = this.evaluateExpression(
        `${this.memory}${operator}${value}`
      )
      this.memory = result
      this.persistState()
    } catch {
      this.hasError = true
    }
  }

  evaluate() {
    if (this.hasError || isStrBlank(this.expression)) return
    try {
      const result = this.evaluateExpression(this.expression)
      this.preview = this.expression
      this.displayValue = result
      this.expression = result
      this.justEvaluated = true
      this.hasError = false
      this.lastRandomValue = null
      this.persistState()
    } catch {
      this.hasError = true
    }
  }
}

export default new Store()
