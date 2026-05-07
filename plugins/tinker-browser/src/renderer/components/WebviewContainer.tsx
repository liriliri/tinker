import { observer } from 'mobx-react-lite'
import { useRef, useEffect, useCallback, useState } from 'react'
import { autorun } from 'mobx'
import {
  Panel,
  Group,
  Separator,
  useDefaultLayout,
} from 'react-resizable-panels'
import copy from 'licia/copy'
import convertBin from 'licia/convertBin'
import store from '../store'
import NewTabPage from './NewTabPage'
import DevToolsPanel from './DevToolsPanel'
import i18n from '../i18n'

interface ContextMenuParams {
  x: number
  y: number
  linkURL: string
  linkText: string
  hasImageContents: boolean
  srcURL: string
  isEditable: boolean
  selectionText: string
}

interface ContextMenuEvent extends Event {
  params: ContextMenuParams
}

function createWebview(tabId: string, url: string): Electron.WebviewTag {
  const wv = document.createElement('webview') as Electron.WebviewTag
  wv.src = url
  wv.style.width = '100%'
  wv.style.height = '100%'
  wv.style.position = 'absolute'
  wv.style.top = '0'
  wv.style.left = '0'
  wv.setAttribute('allowpopups', '')

  wv.addEventListener('did-start-loading', () => {
    store.updateTabLoading(tabId, true)
  })

  wv.addEventListener('dom-ready', () => {
    wv.executeJavaScript(`
      document.addEventListener('contextmenu', (e) => {
        const selection = window.getSelection();
        if (selection && selection.isCollapsed) {
          // Prevent right-click from selecting a word
          const range = document.createRange();
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }, true);
    `)
  })

  wv.addEventListener('did-stop-loading', () => {
    store.updateTabLoading(tabId, false)
    store.updateTabNavState(tabId, wv.canGoBack(), wv.canGoForward())
  })

  wv.addEventListener('page-title-updated', (e) => {
    store.updateTabTitle(tabId, e.title)
  })

  wv.addEventListener('page-favicon-updated', (e) => {
    if (e.favicons && e.favicons.length > 0) {
      store.updateTabFavicon(tabId, e.favicons[0])
    }
  })

  wv.addEventListener('did-navigate', (e) => {
    store.updateTabUrl(tabId, e.url)
    store.updateTabNavState(tabId, wv.canGoBack(), wv.canGoForward())
  })

  wv.addEventListener('did-navigate-in-page', (e) => {
    if (e.isMainFrame) {
      store.updateTabUrl(tabId, e.url)
      store.updateTabNavState(tabId, wv.canGoBack(), wv.canGoForward())
    }
  })

  wv.addEventListener('new-window', (e) => {
    store.addTab((e as Event & { url: string }).url)
  })

  wv.addEventListener('context-menu', (e) => {
    const { params } = e as unknown as ContextMenuEvent
    const menuItems: Parameters<typeof tinker.showContextMenu>[2] = []

    if (params.linkURL) {
      menuItems.push(
        {
          label: i18n.t('openLinkInNewTab'),
          click: () => store.addTab(params.linkURL),
        },
        {
          label: i18n.t('copyLinkAddress'),
          click: () => copy(params.linkURL),
        },
        { type: 'separator' }
      )
    }

    if (params.hasImageContents) {
      menuItems.push(
        {
          label: i18n.t('openImageInNewTab'),
          click: () => store.addTab(params.srcURL),
        },
        {
          label: i18n.t('copyImageAddress'),
          click: () => copy(params.srcURL),
        },
        {
          label: i18n.t('saveImageAs'),
          click: () => {
            const a = document.createElement('a')
            a.href = params.srcURL
            a.download = ''
            a.click()
          },
        },
        { type: 'separator' }
      )
    }

    if (params.isEditable) {
      menuItems.push(
        {
          label: i18n.t('undo'),
          click: () => wv.undo(),
        },
        {
          label: i18n.t('redo'),
          click: () => wv.redo(),
        },
        { type: 'separator' },
        {
          label: i18n.t('cut'),
          click: () => wv.cut(),
        },
        {
          label: i18n.t('copy'),
          click: () => wv.copy(),
        },
        {
          label: i18n.t('paste'),
          click: () => wv.paste(),
        },
        {
          label: i18n.t('selectAll'),
          click: () => wv.selectAll(),
        },
        { type: 'separator' }
      )
    } else if (!params.isEditable && params.selectionText) {
      menuItems.push(
        {
          label: i18n.t('copy'),
          click: () => wv.copy(),
        },
        { type: 'separator' }
      )
    } else if (!params.linkURL && !params.hasImageContents) {
      menuItems.push(
        {
          label: i18n.t('back'),
          click: () => store.goBack(),
          enabled: wv.canGoBack(),
        },
        {
          label: i18n.t('forward'),
          click: () => store.goForward(),
          enabled: wv.canGoForward(),
        },
        {
          label: i18n.t('reload'),
          click: () => store.reload(),
        },
        { type: 'separator' },
        {
          label: i18n.t('capture'),
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
        },
        {
          label: i18n.t('captureFullPage'),
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
        },
        { type: 'separator' },
        {
          label: i18n.t('saveAs'),
          click: () => {
            const a = document.createElement('a')
            a.href = store.activeTab?.url || wv.getURL()
            a.download = ''
            a.click()
          },
        },
        {
          label: i18n.t('print'),
          click: () => wv.print(),
        },
        {
          label: i18n.t('viewPageSource'),
          click: () => {
            const url = store.activeTab?.url || wv.getURL()
            store.addTab(`view-source:${url}`)
          },
        },
        { type: 'separator' }
      )
    }

    menuItems.push({
      label: i18n.t('inspect'),
      click: () => store.inspectElement(params.x, params.y),
    })

    tinker.showContextMenu(params.x, params.y, menuItems)
  })

  return wv
}

export default observer(function WebviewContainer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const panelSlotRef = useRef<HTMLDivElement>(null)
  const [resizing, setResizing] = useState(false)
  const orientation =
    store.devToolsPosition === 'bottom' ? 'vertical' : 'horizontal'
  const devToolsBefore = store.devToolsPosition === 'left'
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    panelIds: devToolsBefore
      ? ['devtools', 'webview']
      : ['webview', 'devtools'],
    id: `tinker-browser-layout-${store.devToolsPosition}`,
    storage: localStorage,
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const webviewElements = new Map<string, Electron.WebviewTag>()

    const dispose = autorun(() => {
      const currentTabIds = new Set(store.tabs.map((t) => t.id))

      for (const [tabId, wv] of webviewElements) {
        if (!currentTabIds.has(tabId)) {
          container.removeChild(wv)
          webviewElements.delete(tabId)
          store.webviewRefs.delete(tabId)
        }
      }

      for (const tab of store.tabs) {
        if (!webviewElements.has(tab.id) && tab.url) {
          const wv = createWebview(tab.id, tab.url)
          container.appendChild(wv)
          webviewElements.set(tab.id, wv)
          store.webviewRefs.set(tab.id, wv)
        }

        const wv = webviewElements.get(tab.id)
        if (wv) {
          wv.style.display = tab.id === store.activeTabId ? 'flex' : 'none'
        }
      }
    })

    return () => {
      dispose()
      for (const [, wv] of webviewElements) {
        container.removeChild(wv)
      }
      webviewElements.clear()
    }
  }, [])

  // Sync webview container position/size with the panel slot
  useEffect(() => {
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

    return () => ro.disconnect()
  }, [orientation, devToolsBefore, store.devToolsOpen])

  // Listen for resize start/end on separator elements
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

  const handleDevToolsReady = useCallback((wv: Electron.WebviewTag) => {
    store.devToolsWebviewRef = wv
    store.connectDevTools()
  }, [])

  const showNewTab = store.activeTab && !store.activeTab.url

  return (
    <div
      ref={wrapperRef}
      className="flex-1 flex flex-col overflow-hidden relative"
    >
      <Group
        key={store.devToolsPosition}
        orientation={orientation}
        className="h-full"
        defaultLayout={defaultLayout}
        onLayoutChange={onLayoutChange}
      >
        {store.devToolsOpen && devToolsBefore && (
          <Panel id="devtools" minSize={80} defaultSize={300}>
            <DevToolsPanel onReady={handleDevToolsReady} />
          </Panel>
        )}
        {store.devToolsOpen && devToolsBefore && <Separator />}
        <Panel id="webview" minSize={100}>
          <div ref={panelSlotRef} className="h-full relative">
            {showNewTab && <NewTabPage />}
          </div>
        </Panel>
        {store.devToolsOpen && !devToolsBefore && <Separator />}
        {store.devToolsOpen && !devToolsBefore && (
          <Panel id="devtools" minSize={80} defaultSize={300}>
            <DevToolsPanel onReady={handleDevToolsReady} />
          </Panel>
        )}
      </Group>
      <div
        ref={containerRef}
        className="absolute overflow-hidden"
        style={{ zIndex: 1, pointerEvents: showNewTab ? 'none' : 'auto' }}
      />
      {resizing && <div className="absolute inset-0" style={{ zIndex: 10 }} />}
    </div>
  )
})
