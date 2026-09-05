import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import fileSize from 'licia/fileSize'
import {
  Columns3,
  ListX,
  Plus,
  SquareSplitHorizontal,
  Trash2,
} from 'lucide-react'
import { tw } from 'share/theme'
import { confirm } from 'share/components/Confirm'
import {
  Toolbar,
  ToolbarButton,
  ToolbarLabel,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import store from '../store'
import { formatTimecode, segmentColorClass } from '../lib/util'
import {
  estimateSegmentBytes,
  isSegmentFinished,
  segmentDuration,
} from '../lib/segments'
import EqualSplitDialog from './EqualSplitDialog'

export default observer(function SegmentList() {
  const { t } = useTranslation()
  const busy = store.isExporting
  const media = store.media
  const [equalSplitOpen, setEqualSplitOpen] = useState(false)

  if (!media) return null

  const handleClearSegments = async () => {
    if (busy || store.segments.length === 0) return
    const ok = await confirm({ title: t('confirmClearSegments') })
    if (!ok) return
    store.clearSegments()
  }

  return (
    <div
      className={`w-64 shrink-0 flex flex-col border-l ${tw.border} ${tw.bg.primary}`}
    >
      <Toolbar>
        <ToolbarLabel>
          {t('segments')} ({store.segments.length})
        </ToolbarLabel>
        <ToolbarSpacer />
        <ToolbarButton
          disabled={busy || store.segments.length === 0}
          title={t('clearSegments')}
          onClick={() => {
            void handleClearSegments()
          }}
        >
          <ListX size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarButton
          disabled={busy}
          title={t('equalSplit')}
          onClick={() => setEqualSplitOpen(true)}
        >
          <Columns3 size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarButton
          disabled={busy}
          title={t('addSegment')}
          onClick={() => store.addSegment()}
        >
          <Plus size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarButton
          disabled={busy || !store.canSplitActiveSegment}
          title={t('splitSegment')}
          onClick={() => store.splitActiveSegment()}
        >
          <SquareSplitHorizontal size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </Toolbar>
      <div className="flex-1 overflow-y-auto flex flex-col">
        {store.segments.length === 0 ? (
          <p
            className={`flex-1 flex items-center justify-center text-xs text-center px-3 ${tw.text.tertiary}`}
          >
            {t('segmentsEmpty')}
          </p>
        ) : (
          store.segments.map((seg, index) => {
            const active = store.activeSegmentId === seg.id
            const finished = isSegmentFinished(seg)
            const duration = segmentDuration(seg)
            const estimated = finished
              ? estimateSegmentBytes(duration, media.duration, media.size)
              : 0
            return (
              <div
                key={seg.id}
                className={`px-3 py-2 border-b cursor-pointer ${tw.border} ${
                  active ? tw.bg.secondary : tw.hover
                }`}
                onClick={() => {
                  store.setActiveSegment(seg.id)
                  store.requestSeek(seg.start)
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${segmentColorClass(
                      index
                    )}`}
                  />
                  <span
                    className={`text-xs tabular-nums flex-1 truncate ${tw.text.primary}`}
                  >
                    {formatTimecode(seg.start)} – {formatTimecode(seg.end)}
                  </span>
                  <button
                    type="button"
                    className={`p-0.5 rounded ${tw.hover} ${tw.text.tertiary}`}
                    disabled={busy}
                    title={t('deleteSegment')}
                    onClick={(e) => {
                      e.stopPropagation()
                      store.deleteSegment(seg.id)
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                {finished && (
                  <div
                    className={`mt-1 flex items-center justify-between gap-2 text-[11px] tabular-nums ${tw.text.tertiary}`}
                  >
                    <span>
                      {t('duration')}: {formatTimecode(duration)}
                    </span>
                    <span title={t('estimatedSize')}>
                      {fileSize(estimated)}
                    </span>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
      <EqualSplitDialog
        open={equalSplitOpen}
        duration={media.duration}
        fileSizeBytes={media.size}
        onClose={() => setEqualSplitOpen(false)}
        onConfirm={(count) => store.splitIntoEqualSegments(count)}
      />
    </div>
  )
})
