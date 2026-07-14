import convertBin from 'licia/convertBin'
import createUrl from 'licia/createUrl'
import loadImg from 'licia/loadImg'
import max from 'licia/max'
import promisify from 'licia/promisify'
import replaceAll from 'licia/replaceAll'
import { THEME_COLORS } from 'share/theme'

export const DEFAULT_DIAGRAM = `flowchart TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[Car]
`

const loadImage = promisify(loadImg) as (
  src: string
) => Promise<HTMLImageElement>

export function getDiagramBackground(darkMode: boolean): string {
  return darkMode ? THEME_COLORS.bg.dark.primary : THEME_COLORS.bg.light.primary
}

export function getSvgElement(
  container: HTMLElement | null
): SVGSVGElement | null {
  return container?.querySelector('svg') ?? null
}

export function serializeSvg(
  svg: SVGSVGElement,
  backgroundColor: string
): string {
  const cloned = svg.cloneNode(true) as SVGSVGElement
  cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  cloned.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
  cloned.style.backgroundColor = backgroundColor

  const svgString = replaceAll(cloned.outerHTML, '<br>', '<br/>').replace(
    /<img([^>]*)>/g,
    (_m, attrs: string) => `<img ${attrs} />`
  )

  return `<?xml version="1.0" encoding="UTF-8"?>\n${svgString}`
}

export async function svgToPngBlob(
  svg: SVGSVGElement,
  backgroundColor: string,
  pixelRatio = 2
): Promise<Blob> {
  const box = svg.getBoundingClientRect()
  const viewBox = svg.viewBox?.baseVal
  const contentWidth =
    viewBox && viewBox.width > 0 ? viewBox.width : box.width || svg.clientWidth
  const contentHeight =
    viewBox && viewBox.height > 0
      ? viewBox.height
      : box.height || svg.clientHeight

  const width = max(1, Math.round(contentWidth * pixelRatio))
  const height = max(1, Math.round(contentHeight * pixelRatio))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Failed to get canvas context')
  }

  context.fillStyle = backgroundColor
  context.fillRect(0, 0, width, height)

  const url = createUrl(serializeSvg(svg, backgroundColor), {
    type: 'image/svg+xml;charset=utf-8',
  })

  try {
    const image = await loadImage(url)
    context.drawImage(image, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png')
    })
    if (!blob) {
      throw new Error('Failed to create PNG blob')
    }
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function writeDiagramFile(
  svg: SVGSVGElement,
  format: 'svg' | 'png',
  path: string,
  backgroundColor: string
): Promise<void> {
  if (format === 'svg') {
    await tinker.writeFile(path, serializeSvg(svg, backgroundColor), 'utf-8')
    return
  }

  const blob = await svgToPngBlob(svg, backgroundColor)
  const buffer = convertBin(
    await convertBin.blobToArrBuffer(blob),
    'Uint8Array'
  )
  await tinker.writeFile(path, buffer)
}
