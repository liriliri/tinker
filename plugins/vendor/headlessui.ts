import * as headlessui from '@headlessui/react'

const g = globalThis as Record<string, unknown>

g.headlessui = headlessui

export { headlessui }
