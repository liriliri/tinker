import * as XTerm from '@xterm/xterm'
import * as XTermAddonFit from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { expose } from './util'

expose({
  xterm: XTerm,
  xtermAddonFit: XTermAddonFit,
})

export { XTerm, XTermAddonFit }
