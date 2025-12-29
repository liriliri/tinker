import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Trash2, Upload, Download } from 'lucide-react'
import store from '../store'
import {
  Toolbar as ToolbarContainer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import { confirm } from 'share/components/Confirm'

export default observer(function Toolbar() {
  const { t } = useTranslation()

  const handleClear = async () => {
    const result = await confirm({
      title: t('clear'),
      message: 'Clear all data?',
    })
    if (result) {
      store.clearData()
    }
  }

  const handleImport = async () => {
    try {
      const result = await tinker.showOpenDialog({
        properties: ['openFile'],
      })

      if (result && result.filePaths && result.filePaths.length > 0) {
        const filePath = result.filePaths[0]
        const buffer = await hexEditor.readFile(filePath)
        store.importData(Array.from(buffer))
      }
    } catch (error) {
      console.error('Import failed:', error)
    }
  }

  const handleExport = async () => {
    try {
      const result = await tinker.showSaveDialog({
        defaultPath: 'export.bin',
      })

      if (result && result.filePath) {
        const data = new Uint8Array(store.data)
        await hexEditor.writeFile(result.filePath, data)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  return (
    <ToolbarContainer>
      <ToolbarButton onClick={handleClear} title={t('clear')}>
        <Trash2 size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton onClick={handleImport} title={t('import')}>
        <Upload size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton onClick={handleExport} title={t('export')}>
        <Download size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
    </ToolbarContainer>
  )
})
