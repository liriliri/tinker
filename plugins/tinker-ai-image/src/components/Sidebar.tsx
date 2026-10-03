import { observer } from 'mobx-react-lite'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { useDefaultLayout } from 'share/hooks/useDefaultLayout'
import { tw } from 'share/theme'
import OverlayScrollbars from 'share/components/OverlayScrollbars'
import store from '../store'
import PromptToolbar from './PromptToolbar'
import Prompt from './Prompt'
import Generate from './Generate'
import GenOptions from './GenOptions'
import InitImage from './InitImage'
import ReferenceImages from './ReferenceImages'

export default observer(function Sidebar() {
  const layout = useDefaultLayout({
    id: 'sidebar',
    panelIds: ['prompt', 'options'],
  })

  return (
    <div className={`h-full flex flex-col ${tw.bg.tertiary}`}>
      <PromptToolbar />
      <Group
        orientation="vertical"
        className="flex-1 min-h-0"
        defaultLayout={layout.defaultLayout}
        onLayoutChange={layout.onLayoutChange}
      >
        <Panel id="prompt" minSize={140} defaultSize={220}>
          <div className="h-full flex flex-col p-3 gap-2 min-h-0">
            <Prompt />
            <div className="shrink-0">
              <Generate />
            </div>
          </div>
        </Panel>
        <Separator />
        <Panel id="options" minSize={120}>
          <OverlayScrollbars defer className="h-full">
            <div className="p-3 space-y-4">
              <GenOptions />
              <InitImage />
              {store.initImagePath ? <ReferenceImages /> : null}
            </div>
          </OverlayScrollbars>
        </Panel>
      </Group>
    </div>
  )
})
