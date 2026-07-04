import { observer } from 'mobx-react-lite'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Panel,
  Group,
  Separator,
  useDefaultLayout,
} from 'react-resizable-panels'
import { PluginChat } from 'share/components/AiChat'
import { getPluginChatProps } from 'share/lib/aiChat/uiProps'
import store from '../store'
import type Terminal from '../store/Terminal'
import SplitLayout from './SplitLayout'
import { getToolArgSummary, getVisibleToolMessages } from '../lib/chatTools'

interface TabContentProps {
  tab: Terminal
}

interface TabChatLayoutProps {
  tab: Terminal
  children: ReactNode
}

const TabChatLayout = observer(function TabChatLayout({
  tab,
  children,
}: TabChatLayoutProps) {
  const { t } = useTranslation()
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    panelIds: ['terminal', 'chat'],
    id: `tinker-terminal-tab-${tab.id}`,
    storage: localStorage,
  })

  return (
    <Group
      orientation="horizontal"
      className="h-full"
      defaultLayout={defaultLayout}
      onLayoutChange={onLayoutChange}
    >
      <Panel id="terminal" minSize={300}>
        {children}
      </Panel>
      <Separator />
      <Panel id="chat" minSize={250} defaultSize={360}>
        <PluginChat
          {...getPluginChatProps(tab.chat)}
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

export default observer(function TabContent({ tab }: TabContentProps) {
  if (!store.hasAI || !tab.chatOpen) {
    return <SplitLayout node={tab.layout} />
  }

  return (
    <TabChatLayout tab={tab}>
      <SplitLayout node={tab.layout} />
    </TabChatLayout>
  )
})
