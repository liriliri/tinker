import { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen } from 'lucide-react'
import isUrl from 'licia/isUrl'
import trim from 'licia/trim'
import isStrBlank from 'licia/isStrBlank'
import { tw } from 'share/theme'
import Dialog, { DialogButton } from 'share/components/Dialog'
import store from '../store'
import { getFileName } from '../lib/url'

interface AddDownloadModalProps {
  visible: boolean
  onClose: () => void
}

export default observer(function AddDownloadModal({
  visible,
  onClose,
}: AddDownloadModalProps) {
  const { t } = useTranslation()
  const [downloadUrl, setDownloadUrl] = useState('')
  const [fileName, setFileName] = useState('')

  useEffect(() => {
    if (visible && !downloadUrl) {
      navigator.clipboard
        .readText()
        .then((text) => {
          if (isUrl(text)) {
            setDownloadUrl(text)
            setFileName(getFileName(text))
          }
        })
        .catch(() => {})
    }
  }, [visible])

  function handleUrlChange(url: string) {
    setDownloadUrl(url)
    if (!fileName) {
      setFileName(getFileName(url))
    }
  }

  async function handleChooseDir() {
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory'],
      defaultPath: store.saveDir || undefined,
    })
    if (!result.canceled && result.filePaths.length > 0) {
      store.setSaveDir(result.filePaths[0])
    }
  }

  function resetForm() {
    setDownloadUrl('')
    setFileName('')
  }

  function handleDownload() {
    if (isStrBlank(downloadUrl) || isStrBlank(fileName) || !store.saveDir)
      return
    const url = trim(downloadUrl)
    const name = trim(fileName)

    store.startDownload(url, store.buildSavePath(name))
    onClose()
  }

  useEffect(() => {
    if (!visible) {
      const timer = setTimeout(resetForm, 200)
      return () => clearTimeout(timer)
    }
  }, [visible])

  return (
    <Dialog
      open={visible}
      onClose={onClose}
      title={t('addDownloadTask')}
      showClose
    >
      <div className="space-y-3">
        <textarea
          value={downloadUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder={t('downloadUrl')}
          rows={3}
          className={`w-full px-3 py-2 rounded text-sm outline-none resize-none ${tw.bg.input} ${tw.text.primary} ${tw.border} border`}
        />
        <input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          placeholder={t('fileName')}
          className={`w-full h-8 px-3 rounded text-sm outline-none ${tw.bg.input} ${tw.text.primary} ${tw.border} border`}
        />
        <div
          className={`flex items-center h-8 rounded ${tw.bg.input} ${tw.border} border overflow-hidden`}
        >
          <input
            type="text"
            value={store.saveDir}
            readOnly
            placeholder={t('saveDir')}
            className={`flex-1 h-full px-3 text-sm outline-none bg-transparent ${tw.text.primary} cursor-default`}
          />
          <button
            type="button"
            onClick={handleChooseDir}
            className={`h-full px-2 cursor-pointer transition-colors ${tw.text.secondary} ${tw.hover}`}
          >
            <FolderOpen size={16} />
          </button>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <DialogButton
          disabled={
            isStrBlank(downloadUrl) || isStrBlank(fileName) || !store.saveDir
          }
          onClick={handleDownload}
        >
          {t('download')}
        </DialogButton>
      </div>
    </Dialog>
  )
})
