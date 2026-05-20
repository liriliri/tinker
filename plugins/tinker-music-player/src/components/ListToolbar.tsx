import { observer } from 'mobx-react-lite'
import { FolderOpen, Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSpacer,
  ToolbarSearch,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import store from '../store'

const ListToolbar = observer(() => {
  const { t } = useTranslation()

  const handleImport = async () => {
    const result = await tinker.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Audio Files',
          extensions: ['mp3', 'flac', 'wav', 'ogg', 'm4a', 'aac', 'wma'],
        },
      ],
    })
    if (!result.canceled && result.filePaths.length > 0) {
      await store.addFiles(result.filePaths)
      for (const filePath of result.filePaths) {
        const track = store.tracks.find((t) => t.path === filePath)
        if (track && store.activeSheetId) {
          await store.addTrackToSheet(track.id, store.activeSheetId)
        }
      }
      const first = store.tracks.find((t) => t.path === result.filePaths[0])
      if (first) {
        const index = store.tracks.indexOf(first)
        store.playTrack(index)
      }
    }
  }

  const handlePlaySheet = () => {
    const sheetTracks = store.activeSheetTracks
    if (sheetTracks.length === 0) return
    const firstTrack = sheetTracks[0]
    const index = store.tracks.findIndex((t) => t.id === firstTrack.id)
    if (index >= 0) {
      store.playTrack(index)
    }
  }

  return (
    <Toolbar>
      <ToolbarButton onClick={handleImport} title={t('import')}>
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={handlePlaySheet}
        title={t('playSheet')}
        disabled={store.activeSheetTracks.length === 0}
      >
        <Play size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarSpacer />
      <ToolbarSearch
        value={store.listFilter}
        onChange={(val) => store.setListFilter(val)}
        placeholder={t('filter')}
      />
    </Toolbar>
  )
})

export default ListToolbar
