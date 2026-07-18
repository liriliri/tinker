import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import endWith from 'licia/endWith'
import {
  Panel,
  Group,
  Separator,
  useDefaultLayout,
} from 'react-resizable-panels'
import { tw } from 'share/theme'
import { ToasterProvider } from 'share/components/Toaster'
import { PluginChat } from 'share/components/AiChat'
import { getPluginChatProps } from 'share/lib/aiChat/uiProps'
import TextEditor from './components/TextEditor'
import TreeEditor from './components/TreeEditor'
import Toolbar from './components/Toolbar'
import { getToolArgSummary } from './mcp'
import store from './store'
import renderApp from 'share/lib/renderApp'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const { t } = useTranslation()
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    panelIds: ['main', 'chat'],
    id: 'tinker-json-editor-layout',
    storage: localStorage,
  })

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const files = e.dataTransfer?.files
      if (!files || files.length === 0) return

      const file = files[0]

      if (!endWith(file.name, '.json')) {
        console.warn('Only .json files are supported')
        return
      }

      try {
        const filePath = tinker.getPathForFile(file) || undefined
        const content = await file.text()
        store.loadFromFile(content, filePath)
      } catch (err) {
        console.error('Failed to read file:', err)
      }
    }

    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)

    return () => {
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('drop', handleDrop)
    }
  }, [])

  return (
    <ToasterProvider>
      <div className={`h-screen flex flex-col ${tw.bg.primary}`}>
        <Toolbar />

        <div className="flex-1 overflow-hidden min-h-0">
          <Group
            orientation="horizontal"
            className="h-full"
            defaultLayout={defaultLayout}
            onLayoutChange={onLayoutChange}
          >
            <Panel id="main" minSize={300}>
              <div className={`h-full overflow-hidden ${tw.bg.primary}`}>
                {store.mode === 'text' ? <TextEditor /> : <TreeEditor />}
              </div>
            </Panel>
            {store.hasAI && store.chatOpen && (
              <>
                <Separator />
                <Panel id="chat" minSize={250} defaultSize={360}>
                  <PluginChat
                    {...getPluginChatProps(store.chat)}
                    isDark={store.isDark}
                    title={t('chatTitle')}
                    inputPlaceholder={t('chatInputPlaceholder')}
                    emptyHint={t('chatEmptyHint')}
                    getToolArgSummary={getToolArgSummary}
                  />
                </Panel>
              </>
            )}
          </Group>
        </div>
      </div>
    </ToasterProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
