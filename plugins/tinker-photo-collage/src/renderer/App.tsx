import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { AlertProvider } from 'share/components/Alert'
import { tw } from 'share/theme'
import { Shuffle, Upload, Trash2 } from 'lucide-react'
import { Toolbar, TOOLBAR_ICON_SIZE } from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import store from './store'
import TemplateSelector from './components/TemplateSelector'
import CollageCanvas from './components/CollageCanvas'
import SettingsPanel from './components/SettingsPanel'
import { getTemplateById } from './lib/templates'

export default observer(function App() {
  const { t, i18n } = useTranslation()

  useEffect(() => {
    const template = getTemplateById(store.selectedTemplateId)
    if (template) {
      store.setTemplate(template.id, template.areas)
    }
  }, [])

  return (
    <AlertProvider locale={i18n.language}>
      <div className={`h-screen flex flex-col ${tw.bg.both.secondary}`}>
        <Toolbar>
          <ToolbarButton onClick={() => {}} title={t('randomLayout')}>
            <Shuffle size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
          <ToolbarButton onClick={() => {}} title={t('export')}>
            <Upload size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
          <ToolbarButton onClick={() => store.clearAll()} title={t('clearAll')}>
            <Trash2 size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
        </Toolbar>

        <div className="flex-1 flex overflow-hidden">
          <TemplateSelector />
          <CollageCanvas />
          <SettingsPanel />
        </div>
      </div>
    </AlertProvider>
  )
})
