import { observer } from 'mobx-react-lite'
import {
  Panel,
  Group,
  Separator,
  useDefaultLayout,
} from 'react-resizable-panels'
import { ConfirmProvider } from 'share/components/Confirm'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import Toolbar from './components/Toolbar'
import FileList from './components/FileList'
import RuleList from './components/RuleList'
import RuleDialog from './components/RuleDialog'
import renderApp from 'share/lib/renderApp'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    panelIds: ['files', 'rules'],
    id: 'tinker-renamer-layout',
    storage: localStorage,
  })

  return (
    <ConfirmProvider>
      <ToasterProvider>
        <div
          className={`h-screen flex flex-col ${tw.bg.primary} ${tw.text.primary}`}
        >
          <Toolbar />
          <div className="flex-1 overflow-hidden">
            <Group
              orientation="vertical"
              className="h-full"
              defaultLayout={defaultLayout}
              onLayoutChange={onLayoutChange}
            >
              <Panel id="files" minSize={100}>
                <div className="h-full overflow-hidden">
                  <FileList />
                </div>
              </Panel>
              <Separator />
              <Panel id="rules" minSize={80} defaultSize={250}>
                <RuleList />
              </Panel>
            </Group>
          </div>
          <RuleDialog />
        </div>
      </ToasterProvider>
    </ConfirmProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
