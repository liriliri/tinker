import type { MenuItemConstructorOptions } from 'electron'
import type { MouseEvent } from 'react'
import i18n from 'i18next'
import max from 'licia/max'
import splitPath from 'licia/splitPath'
import toast from 'react-hot-toast'
import store from '../store'
import type { GalleryImage } from '../types'

export function getItemMetrics(itemSize: number) {
  let padding = 6
  let minGap = 8
  let borderRadius = 4

  if (itemSize < 100) {
    padding = 3
    minGap = 4
    borderRadius = 2
  } else if (itemSize > 200) {
    padding = 12
    minGap = 16
  }

  return { padding, minGap, borderRadius }
}

export function computeGridLayout(availableWidth: number, itemSize: number) {
  const { minGap } = getItemMetrics(itemSize)
  if (availableWidth <= 0) {
    return { cols: 1, gapX: minGap, gapY: minGap }
  }

  const cols = max(
    1,
    Math.floor((availableWidth + minGap) / (itemSize + minGap))
  )
  const gapX =
    cols > 1 ? (availableWidth - cols * itemSize) / (cols - 1) : minGap

  return {
    cols,
    gapX,
    gapY: minGap,
  }
}

export async function saveImageAs(image: GalleryImage) {
  const result = await tinker.showSaveDialog({
    defaultPath: splitPath(image.path).name,
    filters: [
      {
        name: 'Image',
        extensions: ['png', 'jpg', 'jpeg', 'webp'],
      },
    ],
  })
  if (result.canceled || !result.filePath) return
  const data = await tinker.readFile(image.path)
  await tinker.writeFile(result.filePath, data)
  toast.success(i18n.t('saved'))
}

export function showImageMenu(e: MouseEvent, image: GalleryImage) {
  e.preventDefault()
  const items: MenuItemConstructorOptions[] = [
    {
      label: i18n.t('saveAs'),
      click: () => void saveImageAs(image),
    },
    {
      label: i18n.t('showInFolder'),
      click: () => tinker.showItemInPath(image.path),
    },
    {
      label: i18n.t('useAsInit'),
      click: () => void store.setInitImagePath(image.path),
    },
    { type: 'separator' },
    {
      label: i18n.t('delete'),
      click: () => store.removeImage(image.id),
    },
  ]
  tinker.showContextMenu(e.clientX, e.clientY, items)
}
