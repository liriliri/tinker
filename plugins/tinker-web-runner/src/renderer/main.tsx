import { useRef, useCallback, useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { OnMount } from '@monaco-editor/react'
import { Panel, Group, useDefaultLayout } from 'react-resizable-panels'
import { WebviewHandle } from 'share/components/Webview'
import renderApp from 'share/lib/renderApp'
import store from './store'
import ToolbarComponent from './components/Toolbar'
import EditorPanel from './components/EditorPanel'
import Preview from './components/Preview'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const webviewRef = useRef<WebviewHandle>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [resizing, setResizing] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-separator]')) {
        setResizing(true)
      }
    }
    const onMouseUp = () => setResizing(false)

    container.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      container.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  const isHorizontal = store.layout === 'right' || store.layout === 'left'
  const previewBefore = store.layout === 'left' || store.layout === 'top'

  const { defaultLayout: outerLayout, onLayoutChange: onOuterLayoutChange } =
    useDefaultLayout({
      panelIds: previewBefore ? ['preview', 'editor'] : ['editor', 'preview'],
      id: `tinker-web-runner-outer-${store.layout}`,
      storage: localStorage,
    })

  const { defaultLayout: innerLayout, onLayoutChange: onInnerLayoutChange } =
    useDefaultLayout({
      panelIds: ['html', 'css', 'javascript'],
      id: `tinker-web-runner-inner-${isHorizontal ? 'v' : 'h'}`,
      storage: localStorage,
    })

  const handleRun = useCallback(() => {
    store.run()
    webviewRef.current?.reload()
  }, [])

  const createEditorMount =
    (editor: 'html' | 'css' | 'js'): OnMount =>
    (editorInstance) => {
      editorInstance.onDidChangeCursorPosition((e) => {
        store.setCursor(editor, e.position.lineNumber, e.position.column)
      })
    }

  const editorPanel = (
    <Panel id="editor" minSize={200}>
      <Group
        orientation={isHorizontal ? 'vertical' : 'horizontal'}
        className="h-full"
        defaultLayout={innerLayout}
        onLayoutChange={onInnerLayoutChange}
      >
        {store.showHtml && (
          <Panel id="html" minSize={80}>
            <EditorPanel
              language="html"
              label="HTML"
              value={store.html}
              cursor={store.htmlCursor}
              onChange={(val) => store.setHtml(val)}
              onMount={createEditorMount('html')}
            />
          </Panel>
        )}
        {store.showCss && (
          <Panel id="css" minSize={80}>
            <EditorPanel
              language="css"
              label="CSS"
              value={store.css}
              cursor={store.cssCursor}
              onChange={(val) => store.setCss(val)}
              onMount={createEditorMount('css')}
              borderTop={isHorizontal && store.showHtml}
              borderLeft={!isHorizontal && store.showHtml}
            />
          </Panel>
        )}
        {store.showJs && (
          <Panel id="javascript" minSize={80}>
            <EditorPanel
              language="javascript"
              label="JS"
              value={store.js}
              cursor={store.jsCursor}
              onChange={(val) => store.setJs(val)}
              onMount={createEditorMount('js')}
              borderTop={isHorizontal && (store.showHtml || store.showCss)}
              borderLeft={!isHorizontal && (store.showHtml || store.showCss)}
            />
          </Panel>
        )}
      </Group>
    </Panel>
  )

  const previewPanel = (
    <Panel id="preview" minSize={200}>
      <Preview ref={webviewRef} resizing={resizing} />
    </Panel>
  )

  return (
    <div ref={containerRef} className="h-screen flex flex-col">
      <ToolbarComponent onRun={handleRun} />
      <Group
        key={store.layout}
        orientation={isHorizontal ? 'horizontal' : 'vertical'}
        className="flex-1"
        defaultLayout={outerLayout}
        onLayoutChange={onOuterLayoutChange}
      >
        {previewBefore ? previewPanel : editorPanel}
        {previewBefore ? editorPanel : previewPanel}
      </Group>
    </div>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
