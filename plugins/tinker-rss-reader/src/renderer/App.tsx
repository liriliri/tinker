import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AlertProvider } from 'share/components/Alert'
import { ConfirmProvider } from 'share/components/Confirm'
import { PromptProvider, prompt } from 'share/components/Prompt'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import toast from 'react-hot-toast'
import store from './store'
import Toolbar from './components/Toolbar'
import SourceList from './components/SourceList'
import ArticleList from './components/ArticleList'
import ArticleDetail from './components/ArticleDetail'

const SIDEBAR_OPEN_STYLE: React.CSSProperties = { width: 192 }
const SIDEBAR_CLOSED_STYLE: React.CSSProperties = { width: 0 }

export default observer(function App() {
  const { t, i18n } = useTranslation()

  const handleAddSource = async () => {
    const url = await prompt({
      title: t('addFeed'),
      message: t('enterFeedUrl'),
      placeholder: 'https://example.com/feed.xml',
    })
    if (!url) return
    const trimmed = url.trim()
    if (!trimmed) return
    const loadingToast = toast.loading(t('addingFeed'))
    try {
      await store.addSource(trimmed)
      toast.success(t('feedAdded'), { id: loadingToast })
    } catch (e) {
      toast.error((e as Error).message, { id: loadingToast })
    }
  }

  return (
    <AlertProvider locale={i18n.language}>
      <ConfirmProvider locale={i18n.language}>
        <PromptProvider locale={i18n.language}>
          <ToasterProvider>
            <div
              className={`relative h-screen flex flex-col overflow-hidden transition-colors ${tw.bg.primary}`}
            >
              <Toolbar onAddSource={handleAddSource} />
              <div className="flex flex-1 min-h-0">
                <div
                  className={`shrink-0 transition-all duration-200 overflow-hidden ${
                    store.sidebarOpen ? '' : 'w-0'
                  }`}
                  style={
                    store.sidebarOpen
                      ? SIDEBAR_OPEN_STYLE
                      : SIDEBAR_CLOSED_STYLE
                  }
                >
                  <SourceList />
                </div>
                <div className="flex-1 min-w-0">
                  <ArticleList />
                </div>
              </div>
              <ArticleDetail />
            </div>
          </ToasterProvider>
        </PromptProvider>
      </ConfirmProvider>
    </AlertProvider>
  )
})
