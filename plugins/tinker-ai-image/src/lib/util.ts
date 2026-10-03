import clamp from 'licia/clamp'
import fileUrl from 'licia/fileUrl'
import isErr from 'licia/isErr'
import isStr from 'licia/isStr'
import loadImg from 'licia/loadImg'
import max from 'licia/max'
import min from 'licia/min'
import promisify from 'licia/promisify'
import trim from 'licia/trim'
import { getFileExt } from 'share/lib/fileType'
import { DEFAULT_SETTINGS, IMAGE_SIZE_MAX, IMAGE_SIZE_MIN } from '../types'

export const AI_IMAGE_PATH_MIME = 'application/x-tinker-ai-image-path'

export const AI_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif']

const SUPPORTED_IMAGE_EXTS = new Set(AI_IMAGE_EXTENSIONS)

function isSupportedAiImagePath(path: string): boolean {
  return SUPPORTED_IMAGE_EXTS.has(getFileExt(path))
}

export function getDroppedAiImagePath(dataTransfer: DataTransfer): string {
  const fromApp = trim(dataTransfer.getData(AI_IMAGE_PATH_MIME))
  if (fromApp && isSupportedAiImagePath(fromApp)) return fromApp

  const { files } = dataTransfer
  for (let i = 0; i < files.length; i++) {
    const filePath = tinker.getPathForFile(files[i])
    if (filePath && isSupportedAiImagePath(filePath)) return filePath
  }
  return ''
}

export async function pickAiImagePath(): Promise<string> {
  const result = await tinker.showOpenDialog({
    properties: ['openFile'],
    filters: [
      {
        name: 'Images',
        extensions: AI_IMAGE_EXTENSIONS,
      },
    ],
  })
  if (result.canceled || !result.filePaths[0]) return ''
  return result.filePaths[0]
}

const loadImgAsync = promisify(loadImg)

export function getErrorMessage(err: unknown): string {
  if (isErr(err) && err.message) return err.message
  if (isStr(err) && trim(err)) return err
  return 'Unknown error'
}

export function clampImageSize(value: number): number {
  const n = Math.round(value) || DEFAULT_SETTINGS.width
  return clamp(n, IMAGE_SIZE_MIN, IMAGE_SIZE_MAX)
}

export function parseSizeString(
  size?: string
): { width: number; height: number } | null {
  const match = trim(String(size || '')).match(/^(\d{2,5})x(\d{2,5})$/i)
  if (!match) return null
  return {
    width: clampImageSize(Number(match[1])),
    height: clampImageSize(Number(match[2])),
  }
}

export function formatSize(width: number, height: number): string {
  return `${clampImageSize(width)}x${clampImageSize(height)}`
}

/** Scale to fit [MIN, MAX] while keeping aspect ratio. */
export function fitImageSize(
  width: number,
  height: number
): { width: number; height: number } {
  if (!(width > 0) || !(height > 0)) {
    return {
      width: DEFAULT_SETTINGS.width,
      height: DEFAULT_SETTINGS.height,
    }
  }

  let w = width
  let h = height

  if (w > IMAGE_SIZE_MAX || h > IMAGE_SIZE_MAX) {
    const scale = min(IMAGE_SIZE_MAX / w, IMAGE_SIZE_MAX / h)
    w *= scale
    h *= scale
  }

  if (w < IMAGE_SIZE_MIN || h < IMAGE_SIZE_MIN) {
    const scale = max(IMAGE_SIZE_MIN / w, IMAGE_SIZE_MIN / h)
    w *= scale
    h *= scale
    if (w > IMAGE_SIZE_MAX || h > IMAGE_SIZE_MAX) {
      const down = min(IMAGE_SIZE_MAX / w, IMAGE_SIZE_MAX / h)
      w *= down
      h *= down
    }
  }

  return {
    width: clampImageSize(w),
    height: clampImageSize(h),
  }
}

export async function loadImageSize(
  path: string
): Promise<{ width: number; height: number }> {
  const img = (await loadImgAsync(fileUrl(path))) as HTMLImageElement
  return {
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
  }
}
