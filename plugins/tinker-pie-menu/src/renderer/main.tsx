import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmProvider } from 'share/components/Confirm'
import { ToasterProvider } from 'share/components/Toaster'
import { ToolbarButton, ToolbarButtonGroup } from 'share/components/Toolbar'
import { tw } from 'share/theme'
import store from './store'
import PieMenuView from './components/PieMenuView'
import ConfigPanel from './components/ConfigPanel'
import { stopMiddleLongPress } from './lib/middleLongPress'
import type { InvokeMode } from './types'
import renderApp from 'share/lib/renderApp'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const MODES: { mode: InvokeMode; labelKey: string; hintKey: string }[] = [
  { mode: 'alwaysOn', labelKey: 'modeAlwaysOn', hintKey: 'modeAlwaysOnHint' },
  {
    mode: 'middleClick',
    labelKey: 'modeMiddleClick',
    hintKey: 'modeMiddleClickHint',
  },
]

const App = observer(function App() {
  const { t } = useTranslation()

  useEffect(() => {
    void store.applyInvokeMode()
    return () => {
      void stopMiddleLongPress()
    }
  }, [])

  return (
    <ConfirmProvider>
      <ToasterProvider>
        <div
          className={`h-screen flex flex-col overflow-hidden transition-colors ${tw.bg.primary}`}
        >
          <div className={`border-t ${tw.border}`} />
          <div className="flex-1 flex min-h-0 overflow-hidden transition-colors">
            <div className="flex-1 min-w-0 flex flex-col items-center justify-center gap-4">
              <PieMenuView
                slots={store.slots}
                selectedIndex={store.selectedSlot}
                onSelectSlot={(index) => store.selectSlot(index)}
                size={320}
              />
              <ToolbarButtonGroup>
                {MODES.map(({ mode, labelKey, hintKey }) => (
                  <ToolbarButton
                    key={mode}
                    variant="toggle"
                    active={store.invokeMode === mode}
                    title={t(hintKey)}
                    className="px-3 py-1 text-xs"
                    onClick={() => store.setInvokeMode(mode)}
                  >
                    {t(labelKey)}
                  </ToolbarButton>
                ))}
              </ToolbarButtonGroup>
            </div>
            <div
              className={`w-[320px] shrink-0 border-l ${tw.border} ${tw.bg.tertiary}`}
            >
              <ConfigPanel />
            </div>
          </div>
          <div className={`border-b ${tw.border}`} />
        </div>
      </ToasterProvider>
    </ConfirmProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
