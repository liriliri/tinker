import { observer } from 'mobx-react-lite'
import { useEffect, useMemo, useState } from 'react'
import debounce from 'licia/debounce'
import { tw } from 'share/theme'
import store from '../store'
import { generateCellPreviews } from '../lib/split'
import type { CellPreview, CellRect } from '../types'
import CellIndexBadge from './CellIndexBadge'

const SplitPreviewList = observer(function SplitPreviewList() {
  const [previews, setPreviews] = useState<CellPreview[]>([])

  const updatePreviews = useMemo(
    () =>
      debounce(async (imageUrl: string, cells: CellRect[]) => {
        try {
          setPreviews(await generateCellPreviews(imageUrl, cells))
        } catch (err) {
          console.error('Failed to generate split previews:', err)
        }
      }, 80),
    []
  )

  useEffect(() => {
    if (!store.image || store.cells.length === 0) {
      setPreviews([])
      return
    }

    updatePreviews(store.image.originalUrl, store.cells)
  }, [store.image?.originalUrl, store.cropRegion.left, store.cropRegion.top, store.cropRegion.width, store.cropRegion.height, store.rows, store.cols, store.rowSizes.join(','), store.colSizes.join(','), updatePreviews])

  if (previews.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-2">
      {previews.map((preview) => (
        <div
          key={preview.index}
          className={`relative aspect-square flex items-center justify-center overflow-hidden rounded border ${tw.border} ${tw.bg.secondary}`}
        >
          {preview.url && (
            <img
              src={preview.url}
              alt=""
              draggable={false}
              className="block max-w-full max-h-full object-contain"
            />
          )}
          <CellIndexBadge index={preview.index} />
        </div>
      ))}
    </div>
  )
})

export default SplitPreviewList
