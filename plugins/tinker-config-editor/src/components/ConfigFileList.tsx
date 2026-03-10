import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FileText } from 'lucide-react'
import { tw } from 'share/theme'
import NavList, { type NavListItem } from 'share/components/NavList'
import store from '../store'

export default observer(function ConfigFileList() {
  const { t } = useTranslation()

  if (store.configFiles.length === 0) {
    return (
      <div
        className={`flex h-full border-r ${tw.border} ${tw.bg.tertiary} items-center justify-center p-4 ${tw.text.secondary}`}
      >
        <p className="text-sm text-center">{t('noConfigFiles')}</p>
      </div>
    )
  }

  const items: NavListItem[] = store.configFiles.map((file) => ({
    id: file.path,
    icon: FileText,
    label: t(file.name, { defaultValue: file.name }),
    title: file.path,
  }))

  return (
    <div
      className={`flex flex-col h-full border-r ${tw.border} ${tw.bg.tertiary} overflow-y-auto overflow-x-hidden`}
      style={{ scrollbarWidth: 'thin' }}
    >
      <NavList
        items={items}
        activeId={store.currentFilePath ?? undefined}
        onSelect={(id) => store.openConfigFile(id)}
      />
    </div>
  )
})
