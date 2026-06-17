import { useEffect, useMemo, useState } from 'react'
import fileSize from 'licia/fileSize'
import fileUrl from 'licia/fileUrl'
import dateFormat from 'licia/dateFormat'
import { createPlayer } from '@videojs/react'
import { Video, videoFeatures } from '@videojs/react/video'
import { useTranslation } from 'react-i18next'
import VideoPlayer from './VideoPlayer'
import ImageViewer from './ImageViewer'
import { tw } from '../theme'
import { getFileCategory } from '../lib/fileType'
import { getFileIcon } from '../lib/util'
import { addI18nNamespace } from '../lib/i18n'

const I18N_NS = 'filePreview'

addI18nNamespace(I18N_NS, {
  'en-US': {
    noFileSelected: 'Select a file to preview',
    name: 'Name:',
    path: 'Path:',
    size: 'Size:',
    modified: 'Modified:',
    created: 'Created:',
    lastOpened: 'Last Opened:',
  },
  'zh-CN': {
    noFileSelected: '选择文件以预览',
    name: '名称：',
    path: '路径：',
    size: '大小：',
    modified: '修改时间：',
    created: '创建时间：',
    lastOpened: '上次打开：',
  },
})

interface FileStat {
  size: number
  mtime: Date
  atime: Date
  ctime: Date
}

export interface FilePreviewProps {
  path: string | null
}

const iconCache = new Map<string, string>()
const fstatCache = new Map<string, FileStat>()

export default function FilePreview({ path }: FilePreviewProps) {
  const { t } = useTranslation(I18N_NS)
  const [icon, setIcon] = useState<string | undefined>(undefined)
  const [fstat, setFstat] = useState<FileStat | undefined>(undefined)
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    if (!path) return

    if (iconCache.has(path)) {
      setIcon(iconCache.get(path))
    } else {
      setIcon(undefined)
      setImgFailed(false)
      getFileIcon(path).then((result) => {
        if (result) {
          iconCache.set(path, result)
          setIcon(result)
        }
      })
    }

    if (fstatCache.has(path)) {
      setFstat(fstatCache.get(path))
    } else {
      setFstat(undefined)
      tinker.fstat(path).then((stat) => {
        const s = {
          size: stat.size,
          mtime: stat.mtime,
          atime: stat.atime,
          ctime: stat.ctime,
        }
        fstatCache.set(path, s)
        setFstat(s)
      })
    }
  }, [path])

  if (!path) {
    return (
      <div
        className={`w-[280px] border-l ${tw.border} flex items-center justify-center`}
      >
        <span className={`text-xs ${tw.text.tertiary}`}>
          {t('noFileSelected')}
        </span>
      </div>
    )
  }

  const name = path.split(/[\\/]/).pop() || path
  const dir = path.replace(/[\\/][^\\/]+$/, '')
  const isImage = getFileCategory(path) === 'image'
  const isVideo = getFileCategory(path) === 'video'
  const url = fileUrl(path)

  return (
    <div
      className={`w-[280px] border-l ${tw.border} flex flex-col overflow-hidden`}
    >
      <div className="flex-1 min-h-0 overflow-hidden">
        {isImage && !imgFailed ? (
          <ImageViewer
            src={url}
            className="w-full h-full"
            fitArea={0.9}
            onError={() => setImgFailed(true)}
          />
        ) : isVideo ? (
          <div className="flex items-center justify-center h-full p-4 overflow-hidden">
            <VideoPreview src={url} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full p-4">
            {icon ? (
              <img src={icon} alt="" className="w-16 h-16" />
            ) : (
              <div className="w-16 h-16" />
            )}
          </div>
        )}
      </div>
      <div
        className={`text-center text-sm font-medium ${tw.text.primary} px-4 pt-2 pb-1 truncate`}
      >
        {name}
      </div>
      <div className={`p-4 space-y-2`}>
        <InfoRow label={t('path')} value={dir} />
        {fstat && (
          <>
            <InfoRow label={t('size')} value={fileSize(fstat.size)} />
            <InfoRow
              label={t('modified')}
              value={dateFormat(new Date(fstat.mtime), 'yyyy-mm-dd HH:MM')}
            />
            <InfoRow
              label={t('created')}
              value={dateFormat(new Date(fstat.ctime), 'yyyy-mm-dd HH:MM')}
            />
            <InfoRow
              label={t('lastOpened')}
              value={dateFormat(new Date(fstat.atime), 'yyyy-mm-dd HH:MM')}
            />
          </>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-xs leading-5 flex min-w-0">
      <span className={`${tw.text.secondary} mr-1 shrink-0`}>{label}</span>
      <span className={`${tw.text.primary} truncate`}>{value}</span>
    </div>
  )
}

function VideoPreview({ src }: { src: string }) {
  const { Container, Provider } = useMemo(() => {
    const { Container, Provider } = createPlayer({
      features: videoFeatures,
    })
    return { Container, Provider }
  }, [])

  return (
    <Provider>
      <Container className="w-full h-full">
        <VideoPlayer>
          <Video src={src} />
        </VideoPlayer>
      </Container>
    </Provider>
  )
}
