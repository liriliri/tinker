import { app } from 'electron'
import once from 'licia/once'
import isMac from 'licia/isMac'
import waitUntil from 'licia/waitUntil'
import { uIOhook } from 'uiohook-napi'
import { getMainStore } from './store'
import { loadMod } from './util'

type NodeMacPermissions = {
  getAuthStatus: (type: string) => string
  askForAccessibilityAccess: () => void
}

const mainStore = getMainStore()

let nodeMacPermissions: NodeMacPermissions | null = null
let permissionsReady = !isMac

if (isMac) {
  loadMod('node-mac-permissions').then((mod) => {
    nodeMacPermissions = mod
    permissionsReady = true
  })
}

export async function init() {
  if (isMac) {
    await waitUntil(() => permissionsReady)
  }
}

export function isAccessibilityDenied() {
  return (
    isMac &&
    mainStore.get('uIOhookCalled') &&
    nodeMacPermissions?.getAuthStatus('accessibility') === 'denied'
  )
}

export function requestAccessibilityAccess() {
  nodeMacPermissions?.askForAccessibilityAccess()
}

const startHook = once(() => {
  if (isMac && !mainStore.get('uIOhookCalled')) {
    mainStore.set('uIOhookCalled', true)
  }
  setTimeout(() => {
    uIOhook.start()
    if (isMac) {
      const timer = setInterval(() => {
        if (nodeMacPermissions?.getAuthStatus('accessibility') === 'denied') {
          clearInterval(timer)
          uIOhook.stop()
        }
      }, 5000)
    }
    app.on('will-quit', () => uIOhook.stop())
  }, 1000)
})

export function ensureStarted(): boolean {
  if (isAccessibilityDenied()) {
    requestAccessibilityAccess()
    return false
  }
  startHook()
  return true
}

export { uIOhook }
