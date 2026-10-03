import { observer } from 'mobx-react-lite'
import { Panel, Group, Separator } from 'react-resizable-panels'
import { useDefaultLayout } from 'share/hooks/useDefaultLayout'
import { AlertProvider } from 'share/components/Alert'
import { ConfirmProvider } from 'share/components/Confirm'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import renderApp from 'share/lib/renderApp'
import Sidebar from './components/Sidebar'
import { GalleryViewer, ImageList } from './components/Gallery'
import Statusbar from './components/Statusbar'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const mainLayout = useDefaultLayout({
    id: 'main',
    panelIds: ['sidebar', 'gallery'],
  })
  const galleryLayout = useDefaultLayout({
    id: 'gallery',
    panelIds: ['viewer', 'list'],
  })

  return (
    <AlertProvider>
      <ConfirmProvider>
        <ToasterProvider>
          <div
            className={`h-screen flex flex-col overflow-hidden ${tw.bg.primary}`}
          >
            <div className={`border-t ${tw.border}`} />
            <div className="flex-1 min-h-0 overflow-hidden">
              <Group
                orientation="horizontal"
                className="h-full"
                defaultLayout={mainLayout.defaultLayout}
                onLayoutChange={mainLayout.onLayoutChange}
              >
                <Panel id="sidebar" minSize={280} defaultSize={360}>
                  <Sidebar />
                </Panel>
                <Separator />
                <Panel id="gallery" minSize={320}>
                  <Group
                    orientation="vertical"
                    className="h-full"
                    defaultLayout={galleryLayout.defaultLayout}
                    onLayoutChange={galleryLayout.onLayoutChange}
                  >
                    <Panel id="viewer" minSize={160}>
                      <GalleryViewer />
                    </Panel>
                    <Separator />
                    <Panel id="list" minSize={120} defaultSize={180}>
                      <ImageList />
                    </Panel>
                  </Group>
                </Panel>
              </Group>
            </div>
            <Statusbar />
          </div>
        </ToasterProvider>
      </ConfirmProvider>
    </AlertProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
