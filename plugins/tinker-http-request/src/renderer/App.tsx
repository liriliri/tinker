import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Panel, Group, useDefaultLayout } from 'react-resizable-panels'
import { ConfirmProvider } from 'share/components/Confirm'
import { PromptProvider } from 'share/components/Prompt'
import { tw } from 'share/theme'
import UrlBar from './components/UrlBar'
import RequestPanel from './components/RequestPanel'
import ResponsePanel from './components/ResponsePanel'
import CollectionTree from './components/CollectionTree'

export default observer(function App() {
  const { i18n } = useTranslation()
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    panelIds: ['sidebar', 'main'],
    id: 'tinker-http-request-layout',
    storage: localStorage,
  })

  return (
    <ConfirmProvider locale={i18n.language}>
      <PromptProvider locale={i18n.language}>
        <div
          className={`h-screen flex flex-col ${tw.bg.primary} ${tw.text.primary}`}
        >
          <div className={`border-t ${tw.border}`} />
          <div className="flex-1 overflow-hidden">
            <Group
              orientation="horizontal"
              className="h-full"
              defaultLayout={defaultLayout}
              onLayoutChange={onLayoutChange}
            >
              <Panel id="sidebar" minSize={150} defaultSize={200}>
                <div
                  className={`h-full border-r ${tw.border} ${tw.bg.tertiary} overflow-hidden`}
                >
                  <CollectionTree />
                </div>
              </Panel>

              <Panel id="main" minSize={400}>
                <div className="h-full flex flex-col">
                  <UrlBar />
                  <div
                    className={`flex-1 flex flex-col min-h-0 border-b ${tw.border}`}
                  >
                    <RequestPanel />
                  </div>
                  <div className="flex-1 flex flex-col min-h-0">
                    <ResponsePanel />
                  </div>
                </div>
              </Panel>
            </Group>
          </div>
        </div>
      </PromptProvider>
    </ConfirmProvider>
  )
})
