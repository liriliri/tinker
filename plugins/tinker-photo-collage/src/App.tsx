import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { AlertProvider } from 'share/components/Alert'
import { tw } from 'share/theme'
import store from './store'
import Toolbar from './components/Toolbar'
import Sidebar from './components/Sidebar'
import CollageCanvas from './components/CollageCanvas'
import { getTemplateById } from './lib/templates'

export default observer(function App() {
  const { i18n } = useTranslation()

  useEffect(() => {
    const template = getTemplateById(store.selectedTemplateId)
    if (template) {
      store.setTemplate(template.id, template.areas)
    }
  }, [])

  return (
    <AlertProvider locale={i18n.language}>
      <div className={`h-screen flex flex-col ${tw.bg.primary}`}>
        <Toolbar />

        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <CollageCanvas />
        </div>
      </div>
    </AlertProvider>
  )
})
