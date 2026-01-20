import * as mobx from 'mobx'
import * as mobxReactLite from 'mobx-react-lite'

const g = globalThis as Record<string, unknown>

g.mobx = mobx
g.mobxReactLite = mobxReactLite

export { mobx, mobxReactLite }
