import { BrowserWindow, WebContents, WebContentsView } from 'electron'
import path from 'path'
import {
  IOverlayModalRequest,
  IOverlayModalResult,
  IOverlayNotifyOptions,
} from 'common/types'
import { isDev } from 'share/common/util'
import { handleEvent } from 'share/main/lib/util'
import * as theme from 'share/main/lib/theme'
import * as window from 'share/main/lib/window'
import log from 'share/common/log'

const logger = log('overlay')

interface IOverlay {
  view: WebContentsView
  win: BrowserWindow
  ready: Promise<void>
  notificationActive: boolean
  pendingModals: Map<string, (result: IOverlayModalResult | undefined) => void>
  unbindLayout: () => void
}

let overlay: IOverlay | null = null
let resolveReady: (() => void) | null = null

export function init() {
  handleEvent('overlayReady', () => {
    resolveReady?.()
    resolveReady = null
  })
  handleEvent(
    'overlayNotify',
    (content: string, options?: IOverlayNotifyOptions) => {
      const win = window.getWin('main')
      if (!win) {
        return false
      }
      return showOverlayNotification(win, content, options)
    }
  )
  handleEvent('overlayModal', async (request: IOverlayModalRequest) => {
    const win = window.getWin('main')
    if (!win) {
      return undefined
    }
    return showOverlayModal(win, request)
  })
  handleEvent(
    'overlayModalResult',
    (id: string, result: IOverlayModalResult) => {
      resolveOverlayModal(id, result)
    }
  )
  handleEvent('overlayNotifyDone', () => {
    hideOverlayNotification()
  })
}

function loadOverlayPage(webContents: WebContents) {
  if (isDev()) {
    webContents.loadURL('http://localhost:8080/?page=overlay')
  } else {
    webContents.loadFile(path.resolve(__dirname, '../renderer/index.html'), {
      query: { page: 'overlay' },
    })
  }
}

function createOverlay(win: BrowserWindow): IOverlay {
  const view = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  const ready = new Promise<void>((resolve) => {
    resolveReady = resolve
    view.webContents.once('did-fail-load', () => {
      if (resolveReady === resolve) {
        resolveReady = null
      }
      resolve()
    })
  })

  view.setBackgroundColor('#00000000')
  view.setVisible(false)
  loadOverlayPage(view.webContents)

  const onLayout = () => updateOverlayState()
  win.on('resize', onLayout)
  win.on('enter-full-screen', onLayout)
  win.on('leave-full-screen', onLayout)

  return {
    view,
    win,
    ready,
    notificationActive: false,
    pendingModals: new Map(),
    unbindLayout() {
      if (win.isDestroyed()) {
        return
      }
      win.off('resize', onLayout)
      win.off('enter-full-screen', onLayout)
      win.off('leave-full-screen', onLayout)
    },
  }
}

function updateOverlayState() {
  if (!overlay || overlay.win.isDestroyed()) {
    return
  }

  const { view, win } = overlay
  if (!overlay.pendingModals.size && !overlay.notificationActive) {
    view.setVisible(false)
    return
  }

  const { width, height } = win.getContentBounds()
  view.setBounds({ x: 0, y: 0, width, height })
  view.setVisible(true)
}

function destroyOverlay() {
  if (!overlay) {
    return
  }

  logger.debug('destroy overlay')

  const entry = overlay
  const win = entry.win
  overlay = null
  resolveReady = null

  entry.unbindLayout()
  entry.pendingModals.forEach((resolve) => resolve(undefined))

  if (!win.isDestroyed()) {
    win.contentView.removeChildView(entry.view)
  }
  entry.view.webContents.close()
}

function ensureOverlay(win: BrowserWindow) {
  if (win.isDestroyed()) {
    return null
  }

  if (overlay && (overlay.win.isDestroyed() || overlay.win !== win)) {
    destroyOverlay()
  }

  if (!overlay) {
    overlay = createOverlay(win)
  }

  // Re-adding an existing child moves it above the plugin view.
  win.contentView.addChildView(overlay.view)
  return overlay
}

function focusBelow(win: BrowserWindow) {
  if (win.isDestroyed()) {
    return
  }

  const children = win.contentView.children
  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i]
    if (
      child instanceof WebContentsView &&
      child !== overlay?.view &&
      !child.webContents.isDestroyed()
    ) {
      child.webContents.focus()
      return
    }
  }
  win.webContents.focus()
}

function releaseOverlay() {
  if (!overlay) {
    return
  }
  if (overlay.pendingModals.size || overlay.notificationActive) {
    return
  }

  const entry = overlay
  focusBelow(entry.win)
  setTimeout(() => {
    if (overlay === entry) {
      destroyOverlay()
    }
  }, 0)
}

function showOverlayNotification(
  win: BrowserWindow,
  content: string,
  options?: IOverlayNotifyOptions
) {
  const entry = ensureOverlay(win)
  if (!entry) {
    return false
  }

  void entry.ready.then(() => {
    if (overlay !== entry) {
      return
    }
    entry.notificationActive = true
    updateOverlayState()
    entry.view.webContents.send('overlay:notify', content, options)
  })

  return true
}

function hideOverlayNotification() {
  if (!overlay?.notificationActive) {
    return
  }
  overlay.notificationActive = false
  releaseOverlay()
}

async function showOverlayModal(
  win: BrowserWindow,
  request: IOverlayModalRequest
): Promise<IOverlayModalResult | undefined> {
  const entry = ensureOverlay(win)
  if (!entry) {
    return undefined
  }

  await entry.ready
  if (overlay !== entry) {
    return undefined
  }

  return new Promise((resolve) => {
    entry.pendingModals.set(request.id, resolve)
    updateOverlayState()
    entry.view.webContents.focus()
    entry.view.webContents.send('overlay:modal', request)
  })
}

function resolveOverlayModal(id: string, result: IOverlayModalResult) {
  if (!overlay) {
    return
  }

  const resolve = overlay.pendingModals.get(id)
  if (!resolve) {
    return
  }

  overlay.pendingModals.delete(id)
  resolve(result)
  releaseOverlay()
}

theme.on('change', () => {
  if (!overlay || overlay.view.webContents.isDestroyed()) {
    return
  }
  overlay.view.webContents.send('changeTheme')
})
