import * as mathjs from 'mathjs'

const g = globalThis as Record<string, unknown>

g.mathjs = mathjs

export { mathjs }
