import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Settings, Cpu } from 'lucide-react'
import NavList, { type NavListItem } from 'share/components/NavList'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function Sidebar() {
  const { t } = useTranslation()

  const items: NavListItem[] = [
    {
      id: 'general',
      icon: Settings,
      iconClassName: tw.primary.text,
      label: t('general'),
    },
    {
      id: 'ai',
      icon: Cpu,
      iconClassName: tw.primary.text,
      label: t('aiModels'),
    },
  ]

  return (
    <div
      className={`w-40 ${tw.bg.tertiary} border-r ${tw.border} flex flex-col flex-shrink-0`}
    >
      <div className="flex-1 overflow-y-auto">
        <NavList
          items={items}
          activeId={store.currentSection}
          onSelect={(id) => store.setCurrentSection(id)}
        />
      </div>
    </div>
  )
})
