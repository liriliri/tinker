import { observer } from 'mobx-react-lite'
import { useRef, useEffect } from 'react'
import { autorun } from 'mobx'
import store from '../store'
import NewTabPage from './NewTabPage'

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

  return wv
}

export default observer(function WebviewContainer() {
  const containerRef = useRef<HTMLDivElement>(null)

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

  const showNewTab = store.activeTab && !store.activeTab.url

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden">
      {showNewTab && <NewTabPage />}
    </div>
  )
})
