import {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useState,
} from 'react'
import {
  Panel,
  Group,
  Separator,
  useDefaultLayout,
} from 'react-resizable-panels'
import copy from 'licia/copy'
import convertBin from 'licia/convertBin'
import { X, PanelBottom, PanelLeft, PanelRight, LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tw } from '../theme'
import { addI18nNamespace } from '../lib/i18n'

const I18N_NS = 'webview'

addI18nNamespace(I18N_NS, {
  'en-US': {
    back: 'Back',
    forward: 'Forward',
    reload: 'Reload',
    undo: 'Undo',
    redo: 'Redo',
    cut: 'Cut',
    copy: 'Copy',
    paste: 'Paste',
    selectAll: 'Select All',
    copyLinkAddress: 'Copy Link Address',
    openLinkInNewTab: 'Open Link in New Tab',
    copyImageAddress: 'Copy Image Address',
    openImageInNewTab: 'Open Image in New Tab',
    saveImageAs: 'Save Image As...',
    capture: 'Capture Screenshot',
    captureFullPage: 'Capture Full Page',
    saveAs: 'Save As...',
    print: 'Print',
    viewPageSource: 'View Page Source',
    inspect: 'Inspect',
  },
  'zh-CN': {
    back: '后退',
    forward: '前进',
    reload: '重新加载',
    undo: '撤销',
    redo: '重做',
    cut: '剪切',
    copy: '复制',
    paste: '粘贴',
    selectAll: '全选',
    copyLinkAddress: '复制链接地址',
    openLinkInNewTab: '在新标签页中打开链接',
    copyImageAddress: '复制图片地址',
    openImageInNewTab: '在新标签页中打开图片',
    saveImageAs: '图片另存为...',
    capture: '截图',
    captureFullPage: '截取完整网页',
    saveAs: '存储为...',
    print: '打印',
    viewPageSource: '显示网页源代码',
    inspect: '检查',
  },
})

export interface ContextMenuParams {
  x: number
  y: number
  linkURL: string
  linkText: string
  hasImageContents: boolean
  srcURL: string
  isEditable: boolean
  selectionText: string
}

export interface MenuItem {
  label?: string
  type?: 'separator'
  click?: () => void
  enabled?: boolean
}

export type DevToolsPosition = 'bottom' | 'left' | 'right'

export interface ContextMenuFeatures {
  openInNewTab?: boolean
  saveImage?: boolean
  capture?: boolean
  captureFullPage?: boolean
  saveAs?: boolean
  print?: boolean
  navigation?: boolean
  viewSource?: boolean
  inspect?: boolean
}

export interface WebviewProps {
  src: string
  className?: string

  allowPopups?: boolean
  userAgent?: string
  devTools?: boolean
  devToolsPosition?: DevToolsPosition
  contextMenu?: boolean | ContextMenuFeatures

  onLoadStart?: () => void
  onLoadEnd?: () => void
  onLoadError?: (errorCode: number, errorDescription: string) => void
  onDomReady?: (webview: Electron.WebviewTag) => void
  onTitleChange?: (title: string) => void
  onFaviconChange?: (favicons: string[]) => void
  onNavigate?: (url: string, isMainFrame?: boolean) => void
  onNewWindow?: (url: string) => void
  onNavStateChange?: (canGoBack: boolean, canGoForward: boolean) => void
  onDevToolsPositionChange?: (position: DevToolsPosition) => void
  onDevToolsClose?: () => void
  pendingInspect?: { x: number; y: number } | null
  onPendingInspectHandled?: () => void
  onInspectElement?: (x: number, y: number) => void

  extraContextMenuItems?: (
    params: ContextMenuParams,
    webview: Electron.WebviewTag
  ) => MenuItem[]
}

export interface WebviewHandle {
  goBack(): void
  goForward(): void
  reload(): void
  stop(): void
  canGoBack(): boolean
  canGoForward(): boolean
  getURL(): string
  loadURL(url: string): void
  executeJavaScript(code: string): Promise<unknown>
  capturePage(): Promise<Electron.NativeImage>
  print(): void
  inspectElement(x: number, y: number): void
  getWebviewTag(): Electron.WebviewTag | null
}

interface ContextMenuEvent extends Event {
  params: ContextMenuParams
}

const dockButtons: {
  pos: DevToolsPosition
  Icon: LucideIcon
  title: string
}[] = [
  { pos: 'bottom', Icon: PanelBottom, title: 'Dock to bottom' },
  { pos: 'left', Icon: PanelLeft, title: 'Dock to left' },
  { pos: 'right', Icon: PanelRight, title: 'Dock to right' },
]

function resolveFeatures(
  contextMenu: boolean | ContextMenuFeatures | undefined
): ContextMenuFeatures | null {
  if (!contextMenu) return null
  if (contextMenu === true) return {}
  return contextMenu
}

function buildContextMenuItems(
  wv: Electron.WebviewTag,
  params: ContextMenuParams,
  features: ContextMenuFeatures,
  t: (key: string) => string,
  callbacks: {
    onNewWindow?: (url: string) => void
    onInspectElement?: (x: number, y: number) => void
  }
): MenuItem[] {
  const items: MenuItem[] = []

  if (params.linkURL) {
    if (features.openInNewTab) {
      items.push({
        label: t('openLinkInNewTab'),
        click: () => callbacks.onNewWindow?.(params.linkURL),
      })
    }
    items.push(
      { label: t('copyLinkAddress'), click: () => copy(params.linkURL) },
      { type: 'separator' }
    )
  }

  if (params.hasImageContents) {
    if (features.openInNewTab) {
      items.push({
        label: t('openImageInNewTab'),
        click: () => callbacks.onNewWindow?.(params.srcURL),
      })
    }
    items.push({
      label: t('copyImageAddress'),
      click: () => copy(params.srcURL),
    })
    if (features.saveImage) {
      items.push({
        label: t('saveImageAs'),
        click: () => {
          const a = wv.ownerDocument.createElement('a')
          a.href = params.srcURL
          a.download = ''
          a.click()
        },
      })
    }
    items.push({ type: 'separator' })
  }

  if (params.isEditable) {
    items.push(
      { label: t('undo'), click: () => wv.undo() },
      { label: t('redo'), click: () => wv.redo() },
      { type: 'separator' },
      { label: t('cut'), click: () => wv.cut() },
      { label: t('copy'), click: () => wv.copy() },
      { label: t('paste'), click: () => wv.paste() },
      { label: t('selectAll'), click: () => wv.selectAll() },
      { type: 'separator' }
    )
  } else if (params.selectionText) {
    items.push(
      { label: t('copy'), click: () => wv.copy() },
      { type: 'separator' }
    )
  } else if (!params.linkURL && !params.hasImageContents) {
    if (features.navigation !== false) {
      items.push(
        {
          label: t('back'),
          click: () => wv.goBack(),
          enabled: wv.canGoBack(),
        },
        {
          label: t('forward'),
          click: () => wv.goForward(),
          enabled: wv.canGoForward(),
        },
        { label: t('reload'), click: () => wv.reload() },
        { type: 'separator' }
      )
    }

    if (features.capture) {
      items.push({
        label: t('capture'),
        click: async () => {
          const image = await wv.capturePage()
          const png = image.toPNG()
          const result = await tinker.showSaveDialog({
            defaultPath: 'screenshot.png',
            filters: [{ name: 'PNG', extensions: ['png'] }],
          })
          if (result.filePath) {
            await tinker.writeFile(result.filePath, new Uint8Array(png))
          }
        },
      })
    }
    if (features.captureFullPage) {
      items.push({
        label: t('captureFullPage'),
        click: async () => {
          const result = await tinker.showSaveDialog({
            defaultPath: 'screenshot-full.png',
            filters: [{ name: 'PNG', extensions: ['png'] }],
          })
          if (!result.filePath) return

          const twv = wv as tinker.WebviewTag
          const dimensions = JSON.parse(
            await wv.executeJavaScript(
              `JSON.stringify({ width: Math.max(document.documentElement.scrollWidth, document.documentElement.clientWidth), height: Math.max(document.documentElement.scrollHeight, document.documentElement.clientHeight) })`
            )
          )
          const { width, height } = dimensions

          await twv.sendCommand('Emulation.setDeviceMetricsOverride', {
            width: Math.ceil(width),
            height: Math.ceil(height),
            deviceScaleFactor: 1,
            mobile: false,
          })

          const response = (await twv.sendCommand('Page.captureScreenshot', {
            format: 'png',
            clip: { x: 0, y: 0, width, height, scale: 1 },
          })) as { data: string }

          await twv.sendCommand('Emulation.clearDeviceMetricsOverride')

          const bytes = convertBin(response.data, 'Uint8Array')
          await tinker.writeFile(result.filePath, bytes)
        },
      })
    }
    if (features.capture || features.captureFullPage) {
      items.push({ type: 'separator' })
    }

    if (features.saveAs) {
      items.push({
        label: t('saveAs'),
        click: () => {
          const a = wv.ownerDocument.createElement('a')
          a.href = wv.getURL()
          a.download = ''
          a.click()
        },
      })
    }
    if (features.print) {
      items.push({ label: t('print'), click: () => wv.print() })
    }
    if (features.viewSource) {
      items.push({
        label: t('viewPageSource'),
        click: () => callbacks.onNewWindow?.(`view-source:${wv.getURL()}`),
      })
    }
    if (features.saveAs || features.print || features.viewSource) {
      items.push({ type: 'separator' })
    }
  }

  if (features.inspect) {
    items.push({
      label: t('inspect'),
      click: () => callbacks.onInspectElement?.(params.x, params.y),
    })
  }

  return items
}

const Webview = forwardRef<WebviewHandle, WebviewProps>(function Webview(
  {
    src,
    className = '',
    allowPopups = false,
    userAgent,
    devTools = false,
    devToolsPosition = 'bottom',
    contextMenu = false,
    onLoadStart,
    onLoadEnd,
    onLoadError,
    onDomReady,
    onTitleChange,
    onFaviconChange,
    onNavigate,
    onNewWindow,
    onNavStateChange,
    onDevToolsPositionChange,
    onDevToolsClose,
    pendingInspect,
    onPendingInspectHandled,
    onInspectElement,
    extraContextMenuItems,
  },
  ref
) {
  const { t } = useTranslation(I18N_NS)
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const panelSlotRef = useRef<HTMLDivElement>(null)
  const devToolsContainerRef = useRef<HTMLDivElement>(null)
  const webviewRef = useRef<Electron.WebviewTag | null>(null)
  const devToolsWebviewRef = useRef<Electron.WebviewTag | null>(null)
  const [resizing, setResizing] = useState(false)
  const pendingInspectPropRef = useRef(pendingInspect)
  pendingInspectPropRef.current = pendingInspect
  const onPendingInspectHandledRef = useRef(onPendingInspectHandled)
  onPendingInspectHandledRef.current = onPendingInspectHandled

  const contextMenuFeatures = resolveFeatures(contextMenu)

  const tRef = useRef(t)
  tRef.current = t

  const callbacksRef = useRef({
    onLoadStart,
    onLoadEnd,
    onLoadError,
    onDomReady,
    onTitleChange,
    onFaviconChange,
    onNavigate,
    onNewWindow,
    onNavStateChange,
    onInspectElement,
    extraContextMenuItems,
  })
  callbacksRef.current = {
    onLoadStart,
    onLoadEnd,
    onLoadError,
    onDomReady,
    onTitleChange,
    onFaviconChange,
    onNavigate,
    onNewWindow,
    onNavStateChange,
    onInspectElement,
    extraContextMenuItems,
  }

  const connectDevTools = useCallback(() => {
    const wv = webviewRef.current
    const devWv = devToolsWebviewRef.current
    if (!wv || !devWv) return

    const doConnect = () => {
      try {
        ;(wv as tinker.WebviewTag).showDevTools(devWv).then(() => {
          if (pendingInspectPropRef.current) {
            const { x, y } = pendingInspectPropRef.current
            onPendingInspectHandledRef.current?.()
            wv.inspectElement(x, y)
          }
        })
      } catch {
        // noop
      }
    }

    try {
      wv.getWebContentsId()
      doConnect()
    } catch {
      const onReady = () => {
        wv.removeEventListener('dom-ready', onReady)
        doConnect()
      }
      wv.addEventListener('dom-ready', onReady)
    }
  }, [])

  const initialSrcRef = useRef(src)
  const contextMenuFeaturesRef = useRef(contextMenuFeatures)
  contextMenuFeaturesRef.current = contextMenuFeatures

  useEffect(() => {
    const container = containerRef.current
    if (!container || !initialSrcRef.current) return

    const doc = container.ownerDocument
    const wv = doc.createElement('webview') as Electron.WebviewTag
    wv.src = initialSrcRef.current
    wv.style.width = '100%'
    wv.style.height = '100%'
    wv.classList.add('opacity-0', 'bg-white', 'dark:bg-[#1e1e1e]')
    if (allowPopups) wv.setAttribute('allowpopups', '')
    if (userAgent) wv.useragent = userAgent

    wv.addEventListener('did-start-loading', () => {
      callbacksRef.current.onLoadStart?.()
    })

    wv.addEventListener('did-stop-loading', () => {
      callbacksRef.current.onLoadEnd?.()
      callbacksRef.current.onNavStateChange?.(wv.canGoBack(), wv.canGoForward())
    })

    wv.addEventListener('did-fail-load', (e) => {
      const detail = e as Event & {
        errorCode: number
        errorDescription: string
      }
      if (detail.errorCode === -3) return
      callbacksRef.current.onLoadError?.(
        detail.errorCode,
        detail.errorDescription
      )
    })

    wv.addEventListener('dom-ready', () => {
      wv.classList.remove('opacity-0')
      callbacksRef.current.onDomReady?.(wv)
    })

    wv.addEventListener('page-title-updated', (e) => {
      callbacksRef.current.onTitleChange?.(
        (e as Event & { title: string }).title
      )
    })

    wv.addEventListener('page-favicon-updated', (e) => {
      const favicons = (e as Event & { favicons: string[] }).favicons
      if (favicons && favicons.length > 0) {
        callbacksRef.current.onFaviconChange?.(favicons)
      }
    })

    wv.addEventListener('did-navigate', (e) => {
      const url = (e as Event & { url: string }).url
      callbacksRef.current.onNavigate?.(url, true)
      callbacksRef.current.onNavStateChange?.(wv.canGoBack(), wv.canGoForward())
    })

    wv.addEventListener('did-navigate-in-page', (e) => {
      const detail = e as Event & { url: string; isMainFrame: boolean }
      if (detail.isMainFrame) {
        callbacksRef.current.onNavigate?.(detail.url, true)
        callbacksRef.current.onNavStateChange?.(
          wv.canGoBack(),
          wv.canGoForward()
        )
      }
    })

    wv.addEventListener('new-window', (e) => {
      callbacksRef.current.onNewWindow?.((e as Event & { url: string }).url)
    })

    if (contextMenuFeaturesRef.current) {
      wv.addEventListener('context-menu', (e) => {
        const { params } = e as unknown as ContextMenuEvent
        const features = contextMenuFeaturesRef.current!
        const items = buildContextMenuItems(
          wv,
          params,
          features,
          tRef.current,
          {
            onNewWindow: (url) => callbacksRef.current.onNewWindow?.(url),
            onInspectElement: (x, y) =>
              callbacksRef.current.onInspectElement?.(x, y),
          }
        )

        const extra = callbacksRef.current.extraContextMenuItems?.(params, wv)
        if (extra && extra.length > 0) {
          items.push(...extra)
        }

        if (items.length > 0) {
          tinker.showContextMenu(params.x, params.y, items)
        }
      })
    }

    container.appendChild(wv)
    webviewRef.current = wv

    return () => {
      container.removeChild(wv)
      webviewRef.current = null
    }
  }, [allowPopups, userAgent])

  useEffect(() => {
    const container = devToolsContainerRef.current
    if (!container || !devTools) return

    const doc = container.ownerDocument
    const wv = doc.createElement('webview') as Electron.WebviewTag
    wv.src = 'about:blank'
    wv.style.width = '100%'
    wv.style.height = '100%'
    wv.style.position = 'absolute'
    wv.style.top = '0'
    wv.style.left = '0'
    container.appendChild(wv)

    let connected = false
    wv.addEventListener('dom-ready', () => {
      if (connected) return
      connected = true
      devToolsWebviewRef.current = wv
      connectDevTools()
    })

    return () => {
      container.removeChild(wv)
      devToolsWebviewRef.current = null
    }
  }, [devTools, devToolsPosition, connectDevTools])

  useEffect(() => {
    if (!devTools) return
    const container = containerRef.current
    const slot = panelSlotRef.current
    const wrapper = wrapperRef.current
    if (!container || !slot || !wrapper) return

    const sync = () => {
      const wrapperRect = wrapper.getBoundingClientRect()
      const slotRect = slot.getBoundingClientRect()
      container.style.top = `${slotRect.top - wrapperRect.top}px`
      container.style.left = `${slotRect.left - wrapperRect.left}px`
      container.style.width = `${slotRect.width}px`
      container.style.height = `${slotRect.height}px`
    }

    const ro = new ResizeObserver(sync)
    ro.observe(slot)
    sync()

    return () => {
      ro.disconnect()
      container.style.top = ''
      container.style.left = ''
      container.style.width = ''
      container.style.height = ''
    }
  }, [devTools, devToolsPosition])

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-separator]')) {
        setResizing(true)
      }
    }
    const onMouseUp = () => setResizing(false)

    wrapper.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      wrapper.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      goBack() {
        webviewRef.current?.goBack()
      },
      goForward() {
        webviewRef.current?.goForward()
      },
      reload() {
        webviewRef.current?.reload()
      },
      stop() {
        webviewRef.current?.stop()
      },
      canGoBack() {
        return webviewRef.current?.canGoBack() ?? false
      },
      canGoForward() {
        return webviewRef.current?.canGoForward() ?? false
      },
      getURL() {
        return webviewRef.current?.getURL() ?? ''
      },
      loadURL(url: string) {
        webviewRef.current?.loadURL(url)
      },
      executeJavaScript(code: string) {
        return (
          webviewRef.current?.executeJavaScript(code) ??
          Promise.resolve(undefined)
        )
      },
      capturePage() {
        return webviewRef.current?.capturePage() ?? Promise.reject('No webview')
      },
      print() {
        webviewRef.current?.print()
      },
      inspectElement(x: number, y: number) {
        const wv = webviewRef.current
        if (!wv) return
        wv.inspectElement(x, y)
      },
      getWebviewTag() {
        return webviewRef.current
      },
    }),
    []
  )

  const orientation = devToolsPosition === 'bottom' ? 'vertical' : 'horizontal'
  const devToolsBefore = devToolsPosition === 'left'

  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    panelIds: devToolsBefore
      ? ['devtools', 'webview']
      : ['webview', 'devtools'],
    id: `tinker-webview-layout-${devToolsPosition}`,
    storage: localStorage,
  })

  const devToolsPanel = devTools ? (
    <Panel id="devtools" minSize={80} defaultSize={300}>
      <div className="h-full flex flex-col">
        <div
          className={`flex items-center justify-between px-2 py-1 ${
            tw.bg.secondary
          } ${devToolsPosition === 'bottom' ? `${tw.border} border-t` : ''}`}
        >
          <div className="flex items-center gap-1">
            {dockButtons.map(({ pos, Icon, title }) => (
              <button
                key={pos}
                className={`p-0.5 rounded ${
                  devToolsPosition === pos ? tw.text.primary : tw.text.secondary
                } ${tw.hover}`}
                onClick={() => onDevToolsPositionChange?.(pos)}
                title={title}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
          <button
            className={`p-0.5 rounded ${tw.text.secondary} ${tw.hover}`}
            onClick={() => onDevToolsClose?.()}
          >
            <X size={14} />
          </button>
        </div>
        <div
          ref={devToolsContainerRef}
          className="flex-1 overflow-hidden relative"
        />
      </div>
    </Panel>
  ) : null

  return (
    <div
      ref={wrapperRef}
      className={`flex flex-col overflow-hidden relative ${className}`}
    >
      {devTools && (
        <Group
          key={devToolsPosition}
          orientation={orientation}
          className="h-full"
          defaultLayout={defaultLayout}
          onLayoutChange={onLayoutChange}
        >
          {devToolsBefore && devToolsPanel}
          {devToolsBefore && <Separator />}
          <Panel id="webview" minSize={100}>
            <div ref={panelSlotRef} className="h-full" />
          </Panel>
          {!devToolsBefore && <Separator />}
          {!devToolsBefore && devToolsPanel}
        </Group>
      )}
      <div
        ref={containerRef}
        className={devTools ? 'absolute overflow-hidden' : 'absolute inset-0'}
        style={devTools ? { zIndex: 1 } : undefined}
      />
      {resizing && <div className="absolute inset-0" style={{ zIndex: 10 }} />}
    </div>
  )
})

export default Webview
