import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Pause, Play, FolderOpen, Trash2, Link } from 'lucide-react'
import fileSize from 'licia/fileSize'
import copy from 'licia/copy'
import toast from 'react-hot-toast'
import { tw } from 'share/theme'
import { confirm } from 'share/components/Confirm'
import store from '../store'
import { getFileName } from '../lib/url'

interface DownloadItemProps {
  item: tinker.DownloadTask
}

const DownloadItemRow = function DownloadItemRow({ item }: DownloadItemProps) {
  const { t } = useTranslation()

  const fileName = getFileName(item.savePath)
  const isProgressing = item.state === 'progressing'
  const isInterrupted = item.state === 'interrupted'
  const progress =
    item.totalBytes > 0
      ? Math.round((item.receivedBytes / item.totalBytes) * 100)
      : 0

  async function handleDelete() {
    if (isProgressing) {
      const result = await confirm({
        title: t('cancelDownloadConfirm', { name: fileName }),
      })
      if (!result) return
    }
    store.deleteDownload(item.id)
  }

  return (
    <div
      className={`relative overflow-hidden px-2 py-1.5 border-b ${tw.border} ${
        tw.hover
      } ${isInterrupted ? 'bg-red-500/5' : ''}`}
    >
      {isProgressing && (
        <div
          className="absolute left-0 top-0 h-full bg-green-500/10 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      )}
      <div className="relative z-10 flex items-center w-full">
        <div className="flex-1 min-w-0 mr-2">
          <div className={`text-sm font-bold truncate ${tw.text.primary}`}>
            {fileName}
          </div>
          <div className={`text-xs ${tw.text.secondary}`}>
            {isProgressing && `${fileSize(item.receivedBytes)}B / `}
            {item.totalBytes > 0 && `${fileSize(item.totalBytes)}B`}
          </div>
        </div>
        {isProgressing && item.speed > 0 && (
          <div className={`text-xs w-20 text-right mr-2 ${tw.text.secondary}`}>
            {fileSize(item.speed)}B/s
          </div>
        )}
        <div className="flex items-center gap-1.5">
          {isProgressing && (
            <IconButton
              onClick={() => store.togglePause(item.id)}
              title={item.paused ? t('resume') : t('pause')}
            >
              {item.paused ? <Play size={14} /> : <Pause size={14} />}
            </IconButton>
          )}
          {item.state === 'completed' && item.savePath && (
            <IconButton
              onClick={() => store.showInFolder(item.savePath)}
              title={t('open')}
            >
              <FolderOpen size={14} />
            </IconButton>
          )}
          <IconButton
            onClick={() => {
              copy(item.url)
              toast.success(t('copySuccess'))
            }}
            title={t('copyDownloadUrl')}
          >
            <Link size={14} />
          </IconButton>
          <IconButton onClick={handleDelete} title={t('delete')}>
            <Trash2 size={14} />
          </IconButton>
        </div>
      </div>
    </div>
  )
}

interface IconButtonProps {
  onClick: () => void
  title: string
  children: React.ReactNode
}

function IconButton({ onClick, title, children }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1 rounded cursor-pointer transition-colors ${tw.text.secondary} ${tw.hover} hover:${tw.primary.text}`}
    >
      {children}
    </button>
  )
}

export default observer(function DownloadList() {
  const { t } = useTranslation()

  const items = store.filteredDownloads

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className={`text-base ${tw.text.tertiary}`}>
          {t('noDownloads')}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {items.map((item) => (
        <DownloadItemRow key={item.id} item={item} />
      ))}
    </div>
  )
})
