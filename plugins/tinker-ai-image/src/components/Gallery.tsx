import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import fileUrl from 'licia/fileUrl'
import flatten from 'licia/flatten'
import isEmpty from 'licia/isEmpty'
import map from 'licia/map'
import range from 'licia/range'
import reduce from 'licia/reduce'
import {
  FolderOpen,
  ListX,
  Save,
  Square,
  Trash2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { tw } from 'share/theme'
import ImageViewer, {
  type ImageViewerHandle,
} from 'share/components/ImageViewer'
import { confirm } from 'share/components/Confirm'
import { LoadingCircle } from 'share/components/Loading'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import {
  computeGridLayout,
  getItemMetrics,
  saveImageAs,
  showImageMenu,
} from '../lib/gallery'
import store from '../store'
import { IMAGE_LIST_ITEM_SIZE_MAX, IMAGE_LIST_ITEM_SIZE_MIN } from '../types'

export const GalleryViewer = observer(function GalleryViewer() {
  const { t } = useTranslation()
  const image = store.selectedImage
  const viewerRef = useRef<ImageViewerHandle>(null)

  return (
    <div className={`h-full flex flex-col ${tw.bg.primary}`}>
      <Toolbar>
        <ToolbarButton
          disabled={!image}
          onClick={() => {
            if (image) void saveImageAs(image)
          }}
          title={t('saveAs')}
        >
          <Save size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarButton
          disabled={!image}
          onClick={() => {
            if (image) tinker.showItemInPath(image.path)
          }}
          title={t('showInFolder')}
        >
          <FolderOpen size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton
          disabled={!image}
          onClick={() => viewerRef.current?.zoomIn()}
          title={t('zoomIn')}
        >
          <ZoomIn size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarButton
          disabled={!image}
          onClick={() => viewerRef.current?.zoomOut()}
          title={t('zoomOut')}
        >
          <ZoomOut size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarSpacer />
        <ToolbarButton
          disabled={!image}
          onClick={() => {
            if (image) store.removeImage(image.id)
          }}
          title={t('delete')}
        >
          <Trash2 size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </Toolbar>
      <div className="flex-1 min-h-0">
        {image ? (
          <ImageViewer ref={viewerRef} src={fileUrl(image.path)} />
        ) : null}
      </div>
    </div>
  )
})

export const ImageList = observer(function ImageList() {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const itemSize = store.imageListItemSize
  const metrics = getItemMetrics(itemSize)
  const taskSlots = reduce(store.tasks, (total, task) => total + task.count, 0)
  const itemCount = store.images.length + taskSlots
  const hasItems = itemCount > 0
  const [layout, setLayout] = useState(() => computeGridLayout(0, itemSize))

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const update = () => {
      const style = getComputedStyle(el)
      const padX =
        parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
      setLayout(computeGridLayout(el.clientWidth - padX, itemSize))
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [itemSize, hasItems])

  const handleClearAll = async () => {
    if (isEmpty(store.images)) return
    const ok = await confirm({ title: t('confirmClearAll') })
    if (ok) store.clearImages()
  }

  const itemStyle = {
    width: itemSize,
    height: itemSize,
    borderRadius: metrics.borderRadius,
    padding: metrics.padding,
  }

  const useJustifiedGrid = hasItems && itemCount > layout.cols
  const gridStyle = useJustifiedGrid
    ? {
        display: 'grid' as const,
        gridTemplateColumns: `repeat(${layout.cols}, ${itemSize}px)`,
        columnGap: layout.gapX,
        rowGap: layout.gapY,
      }
    : {
        display: 'flex' as const,
        flexWrap: 'wrap' as const,
        gap: layout.gapY,
        alignContent: 'flex-start' as const,
      }

  return (
    <div className={`h-full flex flex-col ${tw.bg.tertiary}`}>
      <Toolbar>
        <ToolbarButton
          disabled={
            !hasItems || store.imageListItemSize >= IMAGE_LIST_ITEM_SIZE_MAX
          }
          onClick={() => store.zoomInImageList()}
          title={t('zoomIn')}
        >
          <ZoomIn size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarButton
          disabled={
            !hasItems || store.imageListItemSize <= IMAGE_LIST_ITEM_SIZE_MIN
          }
          onClick={() => store.zoomOutImageList()}
          title={t('zoomOut')}
        >
          <ZoomOut size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton
          disabled={!store.isBusy}
          onClick={() => store.stopTasks()}
          title={t('stopTasks')}
        >
          <Square size={TOOLBAR_ICON_SIZE} fill="currentColor" />
        </ToolbarButton>
        <ToolbarSpacer />
        <ToolbarButton
          disabled={isEmpty(store.images)}
          onClick={() => void handleClearAll()}
          title={t('clearAll')}
        >
          <ListX size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </Toolbar>
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2"
      >
        {!hasItems ? (
          <div
            className={`h-full flex items-center justify-center text-xs ${tw.text.tertiary}`}
          >
            {t('listEmpty')}
          </div>
        ) : (
          <div style={gridStyle}>
            {map(store.images, (image) => {
              const selected = image.id === store.selectedImageId
              return (
                <button
                  key={image.id}
                  type="button"
                  style={itemStyle}
                  onClick={() => store.selectImage(image.id)}
                  onContextMenu={(e) => showImageMenu(e, image)}
                  className={`shrink-0 border-2 overflow-hidden box-border ${
                    selected
                      ? tw.primary.border
                      : `${tw.border} border-transparent`
                  } ${tw.bg.primary} ${tw.hover}`}
                  title={image.prompt}
                >
                  <img
                    src={fileUrl(image.path)}
                    alt={image.prompt}
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                </button>
              )
            })}
            {flatten(
              map(store.tasks, (task) =>
                map(range(task.count), (index) => (
                  <div
                    key={`${task.id}-${index}`}
                    style={itemStyle}
                    title={
                      task.status === 'generating'
                        ? t('taskGenerating')
                        : t('taskWait')
                    }
                    className={`shrink-0 border ${tw.border} ${tw.bg.primary} flex items-center justify-center ${tw.text.tertiary} box-border`}
                  >
                    <LoadingCircle
                      className={`w-8 h-8 ${
                        task.status === 'generating' ? '' : 'opacity-40'
                      }`}
                    />
                  </div>
                ))
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
})
