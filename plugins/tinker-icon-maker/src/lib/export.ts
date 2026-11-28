import contain from 'licia/contain'
import filter from 'licia/filter'
import { PLATFORM_SPECS } from './presets'
import { canvasToPngBytes, createIconCanvas, resizeCanvas } from './render'
import { createZip, type ZipEntry } from 'share/lib/zip'
import type { BackgroundConfig, IconConfig, PlatformId } from '../types'
import { CANVAS_SIZE } from '../types'

export async function buildExportPng(
  image: CanvasImageSource | null,
  icon: IconConfig,
  background: BackgroundConfig,
  size: number
): Promise<Uint8Array> {
  const master = createIconCanvas(image, icon, background, CANVAS_SIZE)
  const canvas = size === CANVAS_SIZE ? master : resizeCanvas(master, size)
  return canvasToPngBytes(canvas)
}

export async function buildExportZip(
  image: CanvasImageSource | null,
  icon: IconConfig,
  background: BackgroundConfig,
  platforms: PlatformId[]
): Promise<Uint8Array> {
  const master = createIconCanvas(image, icon, background, CANVAS_SIZE)
  const masterPng = await canvasToPngBytes(master)
  const entries: ZipEntry[] = [
    { name: `icon-${CANVAS_SIZE}.png`, data: masterPng },
  ]

  const selected = filter(PLATFORM_SPECS, (spec) => contain(platforms, spec.id))

  for (const spec of selected) {
    for (const size of spec.sizes) {
      const data =
        size === CANVAS_SIZE
          ? masterPng
          : await canvasToPngBytes(resizeCanvas(master, size))
      entries.push({
        name: `${spec.folder}/icon-${size}.png`,
        data,
      })
    }
  }

  return createZip(entries)
}
