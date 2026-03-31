import toast from 'react-hot-toast'
import * as all from 'react-hot-toast'

const g = globalThis as Record<string, unknown>

Object.assign(toast, all)
g.reactHotToast = toast

export default toast
