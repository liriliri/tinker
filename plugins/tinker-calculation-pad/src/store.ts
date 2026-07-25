import { makeAutoObservable } from 'mobx'
import { evaluate } from 'mathjs'
import isStrBlank from 'licia/isStrBlank'
import BaseStore from 'share/store/Base'
import { createMcpApi } from './mcp'

interface CalculationLine {
  id: number
  expression: string
  result: string
}

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)
  lines: CalculationLine[] = [{ id: 0, expression: '', result: '' }]
  activeLineId: number = 0
  inputRefs: { [key: number]: HTMLTextAreaElement | null } = {}
  private nextLineId = 1

  constructor() {
    super()
    makeAutoObservable(this)
  }

  private createLineId() {
    return this.nextLineId++
  }

  get isEmpty() {
    return this.lines.length === 1 && isStrBlank(this.lines[0].expression)
  }

  private calculateResult(expression: string): string {
    if (isStrBlank(expression)) return ''
    try {
      const result = evaluate(expression)
      return String(result)
    } catch {
      return ''
    }
  }

  setInputRef(id: number, ref: HTMLTextAreaElement | null) {
    this.inputRefs[id] = ref
  }

  setActiveLineId(id: number) {
    this.activeLineId = id
  }

  focusLine(id: number) {
    setTimeout(() => {
      this.inputRefs[id]?.focus()
    }, 0)
  }

  updateExpression(id: number, value: string) {
    const result = this.calculateResult(value)
    this.lines = this.lines.map((line) =>
      line.id === id ? { ...line, expression: value, result } : line
    )

    // keep the last line editable after a valid result is entered
    const currentIndex = this.lines.findIndex((line) => line.id === id)
    const isLastLine = currentIndex === this.lines.length - 1
    const hasResult = result !== ''

    if (hasResult && isLastLine) {
      this.lines.push({ id: this.createLineId(), expression: '', result: '' })
    }
  }

  addNewLine(afterId: number) {
    const newId = this.createLineId()
    const currentIndex = this.lines.findIndex((line) => line.id === afterId)
    this.lines.splice(currentIndex + 1, 0, {
      id: newId,
      expression: '',
      result: '',
    })
    this.activeLineId = newId
    this.focusLine(newId)
  }

  deleteLine(id: number) {
    if (this.lines.length === 1) return

    const currentIndex = this.lines.findIndex((line) => line.id === id)
    if (currentIndex < 0 || !isStrBlank(this.lines[currentIndex].expression))
      return

    this.lines = this.lines.filter((line) => line.id !== id)

    if (currentIndex > 0) {
      const prevLineId = this.lines[currentIndex - 1].id
      this.activeLineId = prevLineId
      this.focusLine(prevLineId)
    }
  }

  clear() {
    const newId = this.createLineId()
    this.lines = [{ id: newId, expression: '', result: '' }]
    this.activeLineId = newId
  }

  focusActiveLine() {
    this.focusLine(this.activeLineId)
  }
}

export default new Store()
