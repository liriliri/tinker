import { makeAutoObservable } from 'mobx'
import { evaluate } from 'mathjs'
import isStrBlank from 'licia/isStrBlank'
import find from 'licia/find'

interface CalculationLine {
  id: number
  expression: string
  result: string
}

const STORAGE_KEY = 'tinker-calculation-pad-lines'

class Store {
  lines: CalculationLine[] = [{ id: 0, expression: '', result: '' }]
  activeLineId: number = 0
  inputRefs: { [key: number]: HTMLTextAreaElement | null } = {}

  constructor() {
    makeAutoObservable(this)
    this.loadFromStorage()
    // Ensure activeLineId always points to the first line
    if (this.lines.length > 0) {
      this.activeLineId = this.lines[0].id
    }
  }

  get isEmpty() {
    return this.lines.length === 1 && isStrBlank(this.lines[0].expression)
  }

  private loadFromStorage() {
    const savedLines = localStorage.getItem(STORAGE_KEY)
    if (savedLines) {
      try {
        const parsed = JSON.parse(savedLines)
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.lines = parsed
        }
      } catch (err) {
        console.error('Failed to load from storage:', err)
      }
    }
  }

  private saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.lines))
  }

  private calculateResult(expression: string): string {
    if (isStrBlank(expression)) return ''
    try {
      const result = evaluate(expression)
      return String(result)
    } catch (error) {
      return ''
    }
  }

  setInputRef(id: number, ref: HTMLTextAreaElement | null) {
    this.inputRefs[id] = ref
  }

  setActiveLineId(id: number) {
    this.activeLineId = id
  }

  updateExpression(id: number, value: string) {
    const result = this.calculateResult(value)
    this.lines = this.lines.map((line) =>
      line.id === id ? { ...line, expression: value, result } : line
    )

    // If current line has result and is the last line, auto add new line
    const currentIndex = this.lines.findIndex((line) => line.id === id)
    const isLastLine = currentIndex === this.lines.length - 1
    const hasResult = result !== ''

    if (hasResult && isLastLine) {
      const newId = Date.now()
      this.lines.push({ id: newId, expression: '', result: '' })
    }

    this.saveToStorage()
  }

  addNewLine(afterId: number) {
    const newId = Date.now()
    const currentIndex = this.lines.findIndex((line) => line.id === afterId)
    this.lines.splice(currentIndex + 1, 0, {
      id: newId,
      expression: '',
      result: '',
    })
    this.activeLineId = newId
    this.saveToStorage()

    // Focus the new input
    setTimeout(() => {
      this.inputRefs[newId]?.focus()
    }, 0)
  }

  deleteLine(id: number) {
    if (this.lines.length === 1) return

    const currentLine = find(this.lines, (line) => line.id === id)
    if (!currentLine || !isStrBlank(currentLine.expression)) return

    const currentIndex = this.lines.findIndex((line) => line.id === id)
    this.lines = this.lines.filter((line) => line.id !== id)

    if (currentIndex > 0) {
      const prevLineId = this.lines[currentIndex - 1].id
      this.activeLineId = prevLineId
      setTimeout(() => {
        this.inputRefs[prevLineId]?.focus()
      }, 0)
    }

    this.saveToStorage()
  }

  clear() {
    const newId = Date.now()
    this.lines = [{ id: newId, expression: '', result: '' }]
    this.activeLineId = newId
    this.saveToStorage()
  }

  focusActiveLine() {
    if (this.activeLineId && this.inputRefs[this.activeLineId]) {
      this.inputRefs[this.activeLineId]?.focus()
    }
  }
}

export default new Store()
