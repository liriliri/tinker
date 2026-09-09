import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmProvider } from 'share/components/Confirm'
import { ToasterProvider } from 'share/components/Toaster'
import Switch from 'share/components/Switch'
import { tw } from 'share/theme'
import store from './store'
import PieMenuView from './components/PieMenuView'
import ConfigPanel from './components/ConfigPanel'
import { stopMiddleLongPress } from './lib/middleLongPress'
import { PIE_SIZE, type InvokeMode } from './types'
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
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="shrink-0 flex items-center justify-center gap-2 pt-3 pb-1">
                <span className={`text-xs ${tw.text.secondary}`}>
                  {t('dualRing')}
                </span>
                <Switch
                  checked={store.dualRing}
                  onChange={(enabled) => store.setDualRing(enabled)}
                  title={t('dualRingHint')}
                />
              </div>
              <div className="flex-1 min-h-0 flex items-center justify-center">
                <PieMenuView
                  slots={store.slots}
                  outerSlots={store.outerSlots}
                  dualRing={store.dualRing}
                  selectedIndex={store.selectedSlot}
                  selectedRing={store.selectedRing}
                  onSelectSlot={(index, ring) => store.selectSlot(index, ring)}
                  size={PIE_SIZE}
                  showCenter={store.invokeMode === 'alwaysOn'}
                />
              </div>
              <div className="shrink-0 flex justify-center pb-4">
                <div
                  className={`flex w-72 rounded-full p-1 gap-0.5 ${tw.active}`}
                >
                  {MODES.map(({ mode, labelKey, hintKey }) => (
                    <button
                      key={mode}
                      type="button"
                      title={t(hintKey)}
                      onClick={() => store.setInvokeMode(mode)}
                      className={`flex-1 py-1 rounded-full text-sm font-medium transition-colors ${
                        store.invokeMode === mode
                          ? `bg-white dark:bg-gray-500 ${tw.text.primary} shadow-sm`
                          : tw.text.secondary
                      }`}
                    >
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
              </div>
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
