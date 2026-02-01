import * as idb from 'idb'

const g = globalThis as Record<string, unknown>

g.idb = idb

export { idb }
