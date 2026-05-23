import { useRef, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { Editor, OnMount } from '@monaco-editor/react'
import { Panel, Group } from 'react-resizable-panels'
import { Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Webview, { WebviewHandle } from 'share/components/Webview'
import {
  Toolbar,
  ToolbarSpacer,
  ToolbarLabel,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
} from 'share/components/Toolbar'
import DarkModeSwitch from 'share/components/DarkModeSwitch'
import { tw } from 'share/theme'
import renderApp from 'share/lib/renderApp'
import store from './store'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbers: 'on' as const,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
}

const App = observer(function App() {
  const { t } = useTranslation()
  const webviewRef = useRef<WebviewHandle>(null)

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

  return (
    <div className="h-screen flex flex-col">
      <Toolbar>
        <DarkModeSwitch
          dark={store.previewDark}
          onToggle={() => store.togglePreviewDark()}
          title={t(store.previewDark ? 'darkMode' : 'lightMode')}
        />
        <ToolbarSpacer />
        <ToolbarButton onClick={handleRun} title={t('run')}>
          <Play size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </Toolbar>
      <Group orientation="horizontal" className="flex-1">
        <Panel id="editor" minSize={20}>
          <Group orientation="vertical" className="h-full">
            <Panel id="html" minSize={80}>
              <div className="h-full flex flex-col overflow-hidden">
                <Toolbar>
                  <ToolbarLabel>HTML</ToolbarLabel>
                  <ToolbarSpacer />
                  <span className={`text-xs ${tw.text.secondary}`}>
                    {t('cursor', {
                      line: store.htmlCursor.line,
                      col: store.htmlCursor.col,
                    })}
                  </span>
                </Toolbar>
                <div className="flex-1 overflow-hidden">
                  <Editor
                    language="html"
                    value={store.html}
                    onChange={(val) => store.setHtml(val || '')}
                    onMount={createEditorMount('html')}
                    theme={store.isDark ? 'vs-dark' : 'vs-light'}
                    options={EDITOR_OPTIONS}
                  />
                </div>
              </div>
            </Panel>
            <Panel id="css" minSize={80}>
              <div
                className={`h-full flex flex-col overflow-hidden border-t ${tw.border}`}
              >
                <Toolbar>
                  <ToolbarLabel>CSS</ToolbarLabel>
                  <ToolbarSpacer />
                  <span className={`text-xs ${tw.text.secondary}`}>
                    {t('cursor', {
                      line: store.cssCursor.line,
                      col: store.cssCursor.col,
                    })}
                  </span>
                </Toolbar>
                <div className="flex-1 overflow-hidden">
                  <Editor
                    language="css"
                    value={store.css}
                    onChange={(val) => store.setCss(val || '')}
                    onMount={createEditorMount('css')}
                    theme={store.isDark ? 'vs-dark' : 'vs-light'}
                    options={EDITOR_OPTIONS}
                  />
                </div>
              </div>
            </Panel>
            <Panel id="javascript" minSize={80}>
              <div
                className={`h-full flex flex-col overflow-hidden border-t ${tw.border}`}
              >
                <Toolbar>
                  <ToolbarLabel>JavaScript</ToolbarLabel>
                  <ToolbarSpacer />
                  <span className={`text-xs ${tw.text.secondary}`}>
                    {t('cursor', {
                      line: store.jsCursor.line,
                      col: store.jsCursor.col,
                    })}
                  </span>
                </Toolbar>
                <div className="flex-1 overflow-hidden">
                  <Editor
                    language="javascript"
                    value={store.js}
                    onChange={(val) => store.setJs(val || '')}
                    onMount={createEditorMount('js')}
                    theme={store.isDark ? 'vs-dark' : 'vs-light'}
                    options={EDITOR_OPTIONS}
                  />
                </div>
              </div>
            </Panel>
          </Group>
        </Panel>
        <Panel id="preview" minSize={20}>
          <div className={`h-full border-l ${tw.border}`}>
            {store.previewUrl && (
              <Webview
                ref={webviewRef}
                src={store.previewUrl}
                className="h-full"
              />
            )}
          </div>
        </Panel>
      </Group>
    </div>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
