import * as zxing from '@zxing/library'

const g = globalThis as Record<string, unknown>

g.zxing = zxing

export { zxing }
