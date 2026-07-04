import { observer } from 'mobx-react-lite'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import copy from 'licia/copy'
import {
  File,
  FileText,
  GitBranch,
  GitCommit,
  Image,
  Eye,
  Video,
} from 'lucide-react'
import {
  Panel,
  Group,
  Separator,
  useDefaultLayout,
} from 'react-resizable-panels'
import { tw } from 'share/theme'
import TabBar from 'share/components/TabBar'
import { ConfirmProvider } from 'share/components/Confirm'
import renderApp from 'share/lib/renderApp'
import store from './store'
import Sidebar from './components/Sidebar'
import EditorPane from './components/EditorPane'
import StatusBar from './components/StatusBar'
import {
  TerminalPanel,
  getTerminalPanelProps,
} from 'share/components/TerminalPanel'
import { PluginChat } from 'share/components/AiChat'
import { getPluginChatProps } from 'share/lib/aiChat/uiProps'
import { getToolArgSummary, getVisibleToolMessages } from './lib/chatTools'
import Welcome from './components/Welcome'
import QuickOpen from './components/QuickOpen'
import { relativePath } from './lib/path'
import { getLanguage } from 'share/lib/fileType'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const EditorContent = observer(function EditorContent() {
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    panelIds: ['editor', 'terminal'],
    id: 'tinker-code-editor-layout',
    storage: localStorage,
  })

  return (
    <Group
      orientation="vertical"
      className="h-full"
      defaultLayout={defaultLayout}
      onLayoutChange={onLayoutChange}
    >
      <Panel id="editor">
        <EditorArea />
      </Panel>
      {store.terminalOpen && <Separator />}
      {store.terminalOpen && (
        <Panel id="terminal" defaultSize={200} minSize={100}>
          <TerminalPanel
            {...getTerminalPanelProps(store.terminal, store.isDark)}
          />
        </Panel>
      )}
    </Group>
  )
})

const EditorArea = observer(function EditorArea() {
  const { t } = useTranslation()

  void store.tabDirtyRevision

  const activeTab = store.tabs.find((t) => t.id === store.activeTabId)
  const isActiveImageTab = activeTab?.category === 'image'
  const isActiveVideoTab = activeTab?.category === 'video'
  const isActivePdfTab = activeTab?.category === 'pdf'
  const isActiveBinaryTab = activeTab?.category === 'binary'
  const isActiveGitDiffTab = activeTab?.category === 'gitDiff'
  const isActiveMarkdownTab =
    activeTab?.category === 'text' &&
    getLanguage(activeTab.filePath) === 'markdown'
  const isAtGitRoot = store.workingTree.repoPath === store.rootPath

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    const tab = store.tabs.find((tab) => tab.id === tabId)
    if (!tab) return

    tinker.showContextMenu(e.clientX, e.clientY, [
      {
        label: t('closeTab'),
        click: () => store.closeTab(tabId),
      },
      {
        label: t('closeOtherTabs'),
        enabled: store.tabs.length > 1,
        click: () => {
          const tabs = [...store.tabs]
          tabs.forEach((t) => {
            if (t.id !== tabId) store.closeTab(t.id)
          })
        },
      },
      { type: 'separator' },
      {
        label: t('copyPath'),
        click: () => copy(tab.filePath),
      },
      {
        label: t('copyRelativePath'),
        click: () => copy(relativePath(store.rootPath, tab.filePath)),
      },
    ])
  }

  return (
    <div className="flex flex-col h-full">
      {store.tabs.length > 0 && (
        <div
          className={`relative flex items-center h-10 min-h-[40px] mt-px ${tw.bg.secondary}`}
        >
          <div className="flex-1 min-w-0 h-full">
            <TabBar
              tabs={store.tabs}
              activeTabId={store.activeTabId}
              hideFirstBorder
              onClose={(id) => store.closeTab(id)}
              onActivate={(id) => store.setActiveTab(id)}
              onMove={(from, to) => store.moveTab(from, to)}
              onContextMenu={handleContextMenu}
              renderIcon={(tab) =>
                tab.category === 'gitDiff' ? (
                  <GitBranch size={14} className={tw.text.tertiary} />
                ) : tab.category === 'image' ? (
                  <Image size={14} className={tw.text.tertiary} />
                ) : tab.category === 'video' ? (
                  <Video size={14} className={tw.text.tertiary} />
                ) : tab.category === 'pdf' ? (
                  <FileText size={14} className={tw.text.tertiary} />
                ) : tab.category === 'binary' ? (
                  <FileText size={14} className={tw.text.tertiary} />
                ) : tab.isDirty ? (
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${tw.primary.bg}`}
                    aria-hidden
                  />
                ) : (
                  <File size={14} className={tw.text.tertiary} />
                )
              }
            />
          </div>
          {!isActiveImageTab &&
            !isActiveVideoTab &&
            !isActivePdfTab &&
            !isActiveBinaryTab &&
            !isActiveGitDiffTab &&
            isActiveMarkdownTab && (
              <button
                onClick={() => store.toggleMarkdownPreview()}
                className={`w-7 h-7 ml-1 flex items-center justify-center rounded opacity-40 hover:opacity-100 hover:bg-white/10 transition-all ${
                  store.showingMarkdownPreview
                    ? `opacity-100 ${tw.primary.text}`
                    : ''
                }`}
                title={
                  store.showingMarkdownPreview
                    ? t('markdownPreviewHide')
                    : t('markdownPreview')
                }
              >
                <Eye size={14} />
              </button>
            )}
          {!isActiveImageTab &&
            !isActiveVideoTab &&
            !isActivePdfTab &&
            !isActiveBinaryTab &&
            !isActiveGitDiffTab &&
            isAtGitRoot && (
              <button
                onClick={() => store.toggleBlame()}
                className={`w-7 h-7 ml-1 mr-1 flex items-center justify-center rounded opacity-40 hover:opacity-100 hover:bg-white/10 transition-all ${
                  store.showingBlame ? `opacity-100 ${tw.primary.text}` : ''
                }`}
                title={store.showingBlame ? t('blameHide') : t('blame')}
              >
                <GitCommit size={14} />
              </button>
            )}
          <div
            className={`absolute bottom-0 left-0 right-0 h-px ${tw.bg.border}`}
          />
        </div>
      )}
      <div className="flex-1 relative overflow-hidden">
        {store.tabs.length > 0 ? (
          store.tabs.map((tab) => (
            <div
              key={tab.id}
              className="absolute inset-0"
              style={{
                display: tab.id === store.activeTabId ? 'block' : 'none',
              }}
            >
              <EditorPane tabId={tab.id} />
            </div>
          ))
        ) : (
          <div
            className={`flex items-center justify-center h-full ${tw.text.tertiary} text-sm`}
          >
            {t('openFileToEdit')}
          </div>
        )}
      </div>
    </div>
  )
})

interface ChatLayoutProps {
  children: ReactNode
}

const ChatLayout = observer(function ChatLayout({ children }: ChatLayoutProps) {
  const { t } = useTranslation()
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    panelIds: ['content', 'chat'],
    id: 'tinker-code-editor-chat-layout',
    storage: localStorage,
  })

  return (
    <Group
      orientation="horizontal"
      className="h-full"
      defaultLayout={defaultLayout}
      onLayoutChange={onLayoutChange}
    >
      <Panel id="content" minSize={300}>
        {children}
      </Panel>
      <Separator />
      <Panel id="chat" minSize={250} defaultSize={360}>
        <PluginChat
          {...getPluginChatProps(store.chat)}
          isDark={store.isDark}
          title={t('chatTitle')}
          inputPlaceholder={t('chatInputPlaceholder')}
          emptyHint={t('chatEmptyHint')}
          getToolArgSummary={getToolArgSummary}
          getVisibleToolMessages={getVisibleToolMessages}
        />
      </Panel>
    </Group>
  )
})

const App = observer(function App() {
  const {
    defaultLayout: sidebarDefaultLayout,
    onLayoutChange: onSidebarLayoutChange,
  } = useDefaultLayout({
    panelIds: ['sidebar', 'main'],
    id: 'tinker-code-editor-sidebar-layout',
    storage: localStorage,
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        store.saveFile()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '`') {
        e.preventDefault()
        store.toggleTerminal()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault()
        store.openQuickOpen()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!store.rootPath) {
    return <Welcome />
  }

  const mainContent =
    store.hasAI && store.chatOpen ? (
      <ChatLayout>
        <EditorContent />
      </ChatLayout>
    ) : (
      <EditorContent />
    )

  return (
    <ConfirmProvider>
      <QuickOpen />
      <div
        className={`relative h-full flex flex-col overflow-hidden ${tw.bg.primary}`}
      >
        <div
          className={`absolute top-0 left-0 right-0 h-px z-20 ${tw.bg.border}`}
        />
        <div className="flex-1 flex min-h-0">
          <Group
            orientation="horizontal"
            className="flex-1 h-full"
            defaultLayout={sidebarDefaultLayout}
            onLayoutChange={onSidebarLayoutChange}
          >
            {store.sidebarOpen && (
              <Panel id="sidebar" defaultSize={224} minSize={180}>
                <Sidebar />
              </Panel>
            )}
            {store.sidebarOpen && <Separator />}
            <Panel id="main" minSize={200}>
              <div className="flex flex-col h-full">{mainContent}</div>
            </Panel>
          </Group>
        </div>
        <StatusBar />
      </div>
    </ConfirmProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
