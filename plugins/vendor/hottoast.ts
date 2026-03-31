import * as hottoast from 'react-hot-toast'

const g = globalThis as Record<string, unknown>

g.hottoast = hottoast

export { hottoast }
