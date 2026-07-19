import convertBin from 'licia/convertBin'
import mime from 'licia/mime'
import splitPath from 'licia/splitPath'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import { fileExists } from 'share/lib/util'
import {
  canvasToPngBlob,
  decodeQRFromUrl,
  renderQRCode,
  type CorrectLevel,
} from './lib/qr'
import type { Store } from './store'
import pkg from '../package.json'

interface GenerateArgs {
  text: string
  path: string
  size?: number
  fgColor?: string
  bgColor?: string
  correctLevel?: CorrectLevel
  iconPath?: string
}

interface DecodeArgs {
  path: string
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    generate,
    decode,
  })
}

async function generate(store: Store, args: GenerateArgs) {
  const size = args.size ?? store.size
  const fgColor = args.fgColor ?? store.fgColor
  const bgColor = args.bgColor ?? store.bgColor
  const correctLevel = args.correctLevel ?? store.correctLevel
  const { text, path, iconPath } = args

  const dir = splitPath(path).dir
  if (!(await fileExists(dir))) {
    throw new Error(`Output directory not found: ${dir}`)
  }

  let iconDataUrl = ''
  if (iconPath) {
    if (!(await fileExists(iconPath))) {
      throw new Error(`Icon file not found: ${iconPath}`)
    }
    iconDataUrl = await fileToDataUrl(iconPath)
  }

  store.setText(text)
  store.setSize(size)
  store.setFgColor(fgColor)
  store.setBgColor(bgColor)
  store.setCorrectLevel(correctLevel)
  if (iconDataUrl) {
    store.setIcon(iconDataUrl)
  } else {
    store.clearIcon()
  }

  const canvas = document.createElement('canvas')
  const dataURL = await renderQRCode(canvas, {
    text,
    size,
    fgColor,
    bgColor,
    correctLevel,
    iconDataUrl: iconDataUrl || undefined,
  })
  store.setQRCodeDataURL(dataURL)

  const blob = await canvasToPngBlob(canvas)
  const buffer = convertBin(
    await convertBin.blobToArrBuffer(blob),
    'Uint8Array'
  )
  await tinker.writeFile(path, buffer)

  return {
    savedPath: path,
    text,
    size,
    fgColor,
    bgColor,
    correctLevel,
    hasIcon: Boolean(iconDataUrl),
  }
}

async function decode(store: Store, args: DecodeArgs) {
  const { path } = args
  if (!(await fileExists(path))) {
    throw new Error(`Image file not found: ${path}`)
  }

  const url = await fileToObjectUrl(path)
  try {
    const text = await decodeQRFromUrl(url)
    store.scanResult = text
    store.closeScanResult()
    return { text, path }
  } catch {
    throw new Error(`No QR code found in: ${path}`)
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function fileToDataUrl(filePath: string): Promise<string> {
  const buffer = await tinker.readFile(filePath)
  const mimeType = mime(filePath) || 'image/png'
  const blob = new Blob([buffer], { type: mimeType })
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read file as data URL'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file as data URL'))
    reader.readAsDataURL(blob)
  })
}

async function fileToObjectUrl(filePath: string): Promise<string> {
  const buffer = await tinker.readFile(filePath)
  const mimeType = mime(filePath) || 'image/*'
  return URL.createObjectURL(new Blob([buffer], { type: mimeType }))
}
