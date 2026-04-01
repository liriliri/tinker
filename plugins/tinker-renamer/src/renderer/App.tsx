import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Panel, Group, useDefaultLayout } from 'react-resizable-panels'
import { ConfirmProvider } from 'share/components/Confirm'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import Toolbar from './components/Toolbar'
import FileList from './components/FileList'
import RuleList from './components/RuleList'
import RuleDialog from './components/RuleDialog'

export default observer(function App() {
  const { i18n } = useTranslation()
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    panelIds: ['files', 'rules'],
    id: 'tinker-renamer-layout',
    storage: localStorage,
  })

  return (
    <ConfirmProvider locale={i18n.language}>
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
                <div className={`h-full border-b ${tw.border} overflow-hidden`}>
                  <FileList />
                </div>
              </Panel>
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
