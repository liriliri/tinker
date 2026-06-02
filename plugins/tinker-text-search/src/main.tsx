import { observer } from 'mobx-react-lite'
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
} from 'react-resizable-panels'
import { ToasterProvider } from 'share/components/Toaster'
import TextSearchSidebar, {
  getTextSearchUIProps,
} from 'share/components/TextSearch'
import { tw } from 'share/theme'
import renderApp from 'share/lib/renderApp'
import store from './store'
import Preview from './components/Preview'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    panelIds: ['sidebar', 'preview'],
    id: 'tinker-text-search-layout',
    storage: localStorage,
  })

  return (
    <ToasterProvider>
      <div className={`h-screen flex flex-col ${tw.bg.primary}`}>
        <div className={`border-t ${tw.border}`} />
        <Group
          orientation="horizontal"
          className="flex-1 h-full"
          defaultLayout={defaultLayout}
          onLayoutChange={onLayoutChange}
        >
          <Panel id="sidebar" defaultSize={360} minSize={280}>
            <TextSearchSidebar
              {...getTextSearchUIProps(store.search)}
              onSelectMatch={store.selectMatch}
            />
          </Panel>
          <Separator />
          <Panel id="preview" minSize={300}>
            <Preview />
          </Panel>
        </Group>
      </div>
    </ToasterProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
