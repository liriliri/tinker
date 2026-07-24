import * as XTerm from '@xterm/xterm'
import * as XTermAddonFit from '@xterm/addon-fit'
import * as XTermAddonWebLinks from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import { expose } from './util'

expose({
  xterm: XTerm,
  xtermAddonFit: XTermAddonFit,
  xtermAddonWebLinks: XTermAddonWebLinks,
})

export { XTerm, XTermAddonFit, XTermAddonWebLinks }
