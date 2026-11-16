import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import isEmpty from 'licia/isEmpty'
import map from 'licia/map'
import toast from 'react-hot-toast'
import { showContextMenu } from 'share/components/ContextMenu'
import { openImageFile } from 'share/lib/util'
import { tw } from 'share/theme'
import { openImageFiles } from '../lib/openImages'
import store from '../store'

const FRAME_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']

export default observer(function FrameList() {
  const { t } = useTranslation()
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    })
  }, [store.selectedIndex])

  useEffect(() => {
    const el = scrollRoot
    if (!el) return

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
      event.preventDefault()
      el.scrollLeft += event.deltaY
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [scrollRoot])

  if (!store.hasProject) return null

  const handleContextMenu = (e: MouseEvent, index: number) => {
    e.preventDefault()
    store.stopPlayback()
    store.selectFrame(index)

    showContextMenu(e.clientX, e.clientY, [
      {
        label: t('addFrame'),
        click: () => {
          void (async () => {
            const results = await openImageFiles({
              title: t('addFrame'),
              extensions: FRAME_IMAGE_EXTENSIONS,
            })
            if (isEmpty(results)) return
            try {
              await store.addFramesFromFiles(map(results, (item) => item.file))
            } catch {
              toast.error(t('editFailed'))
            }
          })()
        },
      },
      {
        label: t('replaceFrame'),
        click: () => {
          void (async () => {
            const result = await openImageFile({
              title: t('replaceFrame'),
              extensions: FRAME_IMAGE_EXTENSIONS,
            })
            if (!result) return
            try {
              await store.replaceSelectedFrame(result.file)
            } catch {
              toast.error(t('editFailed'))
            }
          })()
        },
      },
      {
        label: t('setDelay'),
        click: () => store.openDelayDialog(),
      },
      { type: 'separator' },
      {
        label: t('deleteFrame'),
        click: () => store.deleteSelectedFrame(),
      },
    ])
  }

  return (
    <div
      ref={setScrollRoot}
      className={`scrollbar-hide h-28 shrink-0 flex gap-1 overflow-x-auto px-2 py-2 border-t ${tw.border} ${tw.bg.primary}`}
    >
      {store.frames.map((frame, index) => {
        const selected = index === store.selectedIndex
        return (
          <button
            key={frame.id}
            ref={selected ? selectedRef : undefined}
            type="button"
            onClick={() => {
              store.stopPlayback()
              store.selectFrame(index)
            }}
            onContextMenu={(e) => handleContextMenu(e, index)}
            className={`shrink-0 w-24 h-full flex flex-col rounded border overflow-hidden transition-colors ${
              selected
                ? `${tw.primary.border} ${tw.primary.bgFocused}`
                : `${tw.border} ${tw.hover}`
            }`}
            title={t('frameTooltip', {
              index: index + 1,
              delay: frame.delay,
            })}
          >
            <div
              className={`flex-1 min-h-0 flex items-center justify-center overflow-hidden ${tw.bg.secondary}`}
            >
              <img
                src={frame.url}
                alt=""
                className="max-w-full max-h-full object-contain"
                draggable={false}
              />
            </div>
            <div
              className={`shrink-0 px-1 py-0.5 text-[10px] tabular-nums text-center truncate ${tw.text.secondary}`}
            >
              {index + 1} · {frame.delay}ms
            </div>
          </button>
        )
      })}
    </div>
  )
})
