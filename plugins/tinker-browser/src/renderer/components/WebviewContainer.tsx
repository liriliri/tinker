import { observer } from 'mobx-react-lite'
import { useRef, useCallback } from 'react'
import Webview, { WebviewHandle } from 'share/components/Webview'
import store from '../store'
import { cleanUserAgent } from '../lib/util'
import NewTabPage from './NewTabPage'

export default observer(function WebviewContainer() {
  const webviewHandles = useRef<Map<string, WebviewHandle>>(new Map())

  const registerHandle = useCallback(
    (tabId: string, handle: WebviewHandle | null) => {
      if (handle) {
        webviewHandles.current.set(tabId, handle)
      } else {
        webviewHandles.current.delete(tabId)
        store.webviewRefs.delete(tabId)
      }
    },
    []
  )

  const showNewTab = store.activeTab && !store.activeTab.url

  return (
    <div className="h-full overflow-hidden relative">
      {store.tabs.map((tab) => {
        if (!tab.url) return null

        const isActive = tab.id === store.activeTabId

        const syncNavState = () => {
          const h = webviewHandles.current.get(tab.id)
          if (h) {
            store.updateTabNavState(tab.id, h.canGoBack(), h.canGoForward())
          }
        }

        return (
          <div
            key={tab.id}
            className="absolute inset-0"
            style={{ display: isActive ? 'block' : 'none' }}
          >
            <Webview
              src={tab.url}
              className="h-full"
              allowPopups
              userAgent={cleanUserAgent(navigator.userAgent)}
              devTools={store.devToolsOpenTabs.has(tab.id)}
              devToolsPosition={store.devToolsPosition}
              contextMenu={{
                openInNewTab: true,
                saveImage: true,
                capture: true,
                captureFullPage: true,
                saveAs: true,
                print: true,
                viewSource: true,
                inspect: true,
              }}
              pendingInspect={isActive ? store.pendingInspect : null}
              onPendingInspectHandled={() => {
                store.pendingInspect = null
              }}
              onInspectElement={(x, y) => store.inspectElement(x, y)}
              ref={(handle) => {
                registerHandle(tab.id, handle)
              }}
              onLoadStart={() => store.updateTabLoading(tab.id, true)}
              onLoadEnd={() => {
                store.updateTabLoading(tab.id, false)
                syncNavState()
              }}
              onTitleChange={(title) => store.updateTabTitle(tab.id, title)}
              onFaviconChange={(favicons) => {
                if (favicons.length > 0) {
                  store.updateTabFavicon(tab.id, favicons[0])
                }
              }}
              onNavigate={(url) => {
                store.updateTabUrl(tab.id, url)
                syncNavState()
              }}
              onNewWindow={(url) => store.addTab(url)}
              onDomReady={(wv) => {
                store.webviewRefs.set(tab.id, wv)
                wv.executeJavaScript(`
                  document.addEventListener('contextmenu', (e) => {
                    const selection = window.getSelection();
                    if (selection && selection.isCollapsed) {
                      const range = document.createRange();
                      range.collapse(true);
                      selection.removeAllRanges();
                      selection.addRange(range);
                    }
                  }, true);
                `)
              }}
              onDevToolsPositionChange={(pos) => store.setDevToolsPosition(pos)}
              onDevToolsClose={() => store.closeDevTools()}
            />
          </div>
        )
      })}
      {showNewTab && <NewTabPage />}
    </div>
  )
})
