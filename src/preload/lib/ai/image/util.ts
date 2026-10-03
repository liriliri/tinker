import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import uuid from 'licia/uuid'
import mainObj from 'share/preload/main'
import type {
  AiImageApiType,
  AiImageInput,
  AiImageProvider,
  GenerateImageOption,
  GeneratedImage,
} from './types'

export interface ResolvedImageInput {
  buffer: Buffer
  mimeType: string
  filename: string
  base64: string
}

export interface ImageCallParams {
  size: string
  count: number
}

export const OUTPUT_FORMAT = 'png' as const
export const OUTPUT_MIME = 'image/png'

export interface RawGeneratedImage {
  bytes: Buffer
  mimeType: string
}

const SIZE_RE = /^\d{2,5}x\d{2,5}$/i
const VOLCENGINE_SIZE_RE = /^[1234]K$/i

export function normalizeImageBaseUrl(value: string): string {
  return String(value || '')
    .trim()
    .replace(/\/(?:images(?:\/(?:generations|edits))?|interactions)\/?$/i, '')
    .replace(/\/+$/, '')
}

export function resolveImageModel(
  provider: AiImageProvider,
  model?: string
): string {
  const name = model || provider.models[0]?.name || ''
  if (!name) throw new Error('No image model configured')
  return name
}

function resolveVolcengineSize(size?: string): string {
  const value = String(size || '').trim()
  if (!value) return '2K'
  if (VOLCENGINE_SIZE_RE.test(value)) return value.toUpperCase()
  if (SIZE_RE.test(value)) return value
  return '2K'
}

export function resolveImageParams(
  option: GenerateImageOption,
  apiType: AiImageApiType
): ImageCallParams {
  const count = Math.max(1, Math.min(4, Math.floor(option.count || 1)))

  if (apiType === 'volcengine') {
    return {
      size: resolveVolcengineSize(option.size),
      count,
    }
  }

  const size =
    option.size && SIZE_RE.test(option.size) ? option.size : '1024x1024'
  return {
    size,
    count,
  }
}

export function toImageDataUrl(image: ResolvedImageInput): string {
  if (image.base64.startsWith('data:')) return image.base64
  return `data:${image.mimeType};base64,${image.base64}`
}

export async function collectGeneratedOutputs(
  payload: {
    data?: Array<{ b64_json?: string; url?: string }>
  },
  mimeType: string,
  signal?: AbortSignal
): Promise<RawGeneratedImage[]> {
  const outputs: RawGeneratedImage[] = []
  for (const item of payload.data || []) {
    if (item.b64_json) {
      outputs.push({
        bytes: Buffer.from(item.b64_json, 'base64'),
        mimeType,
      })
      continue
    }
    if (item.url) {
      const remote = await fetch(item.url, { signal })
      if (!remote.ok) {
        throw new Error(
          'Image URL returned by provider could not be downloaded'
        )
      }
      outputs.push({
        bytes: Buffer.from(await remote.arrayBuffer()),
        mimeType: remote.headers.get('content-type') || mimeType,
      })
    }
  }
  if (!outputs.length) throw new Error('Provider returned no images')
  return outputs
}

function mimeFromExt(ext: string): string {
  const lower = ext.toLowerCase()
  if (lower === '.jpg' || lower === '.jpeg') return 'image/jpeg'
  if (lower === '.webp') return 'image/webp'
  if (lower === '.gif') return 'image/gif'
  return 'image/png'
}

function extFromMime(mimeType: string): string {
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return '.jpg'
  if (mimeType.includes('webp')) return '.webp'
  if (mimeType.includes('gif')) return '.gif'
  return '.png'
}

function parseDataUrl(value: string): { mimeType: string; base64: string } {
  const match = value.match(/^data:([^;]+);base64,(.+)$/s)
  if (match) {
    return { mimeType: match[1] || 'image/png', base64: match[2] }
  }
  return { mimeType: 'image/png', base64: value }
}

export async function resolveImageInput(
  input: AiImageInput,
  index = 0
): Promise<ResolvedImageInput> {
  if (typeof input === 'string') {
    if (input.startsWith('data:')) {
      const { mimeType, base64 } = parseDataUrl(input)
      return {
        buffer: Buffer.from(base64, 'base64'),
        mimeType,
        filename: `input-${index + 1}${extFromMime(mimeType)}`,
        base64,
      }
    }

    const buffer = await readFile(input)
    const mimeType = mimeFromExt(path.extname(input))
    return {
      buffer,
      mimeType,
      filename:
        path.basename(input) || `input-${index + 1}${extFromMime(mimeType)}`,
      base64: buffer.toString('base64'),
    }
  }

  if ('path' in input && input.path) {
    return resolveImageInput(input.path, index)
  }

  const dataInput = input as { data: string; mimeType?: string }
  const mimeType = dataInput.mimeType || 'image/png'
  const raw = dataInput.data.startsWith('data:')
    ? parseDataUrl(dataInput.data).base64
    : dataInput.data
  return {
    buffer: Buffer.from(raw, 'base64'),
    mimeType,
    filename: `input-${index + 1}${extFromMime(mimeType)}`,
    base64: raw,
  }
}

export async function resolveImageInputs(
  image: AiImageInput,
  referenceImages?: AiImageInput[]
): Promise<ResolvedImageInput[]> {
  const primary = await resolveImageInput(image, 0)
  const extras = await Promise.all(
    (referenceImages || []).map((ref, i) => resolveImageInput(ref, i + 1))
  )
  return [primary, ...extras]
}

export function aspectRatioForSize(size: string): string {
  const [wText, hText] = size.toLowerCase().split('x')
  const width = Number(wText) || 1024
  const height = Number(hText) || 1024
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
  const d = gcd(width, height) || 1
  return `${width / d}:${height / d}`
}

const IMAGE_FILE_EXT_RE = /\.(png|jpe?g|webp|gif)$/i

function isImageFilePath(value: string): boolean {
  return IMAGE_FILE_EXT_RE.test(value)
}

async function resolveOutputPaths(
  outputs: RawGeneratedImage[],
  outputPath?: string
): Promise<string[]> {
  const trimmed = String(outputPath || '').trim()

  if (!trimmed) {
    const temp = await mainObj.getPath('temp')
    const dir = path.join(temp, 'tinker-ai-images')
    await mkdir(dir, { recursive: true })
    return outputs.map((output) =>
      path.join(dir, `${uuid()}${extFromMime(output.mimeType)}`)
    )
  }

  if (isImageFilePath(trimmed)) {
    const parsed = path.parse(trimmed)
    await mkdir(parsed.dir || '.', { recursive: true })
    if (outputs.length === 1) return [trimmed]
    return outputs.map((_, index) =>
      path.join(parsed.dir, `${parsed.name}-${index + 1}${parsed.ext}`)
    )
  }

  await mkdir(trimmed, { recursive: true })
  return outputs.map((output) =>
    path.join(trimmed, `${uuid()}${extFromMime(output.mimeType)}`)
  )
}

export async function saveGeneratedImages(
  outputs: RawGeneratedImage[],
  outputPath?: string
): Promise<GeneratedImage[]> {
  const filePaths = await resolveOutputPaths(outputs, outputPath)
  const images: GeneratedImage[] = []
  for (let i = 0; i < outputs.length; i++) {
    const output = outputs[i]
    const filePath = filePaths[i]
    await writeFile(filePath, output.bytes)
    images.push({
      path: filePath,
      mimeType: output.mimeType,
      bytes: output.bytes.length,
    })
  }
  return images
}

export async function readProviderError(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => ({}))) as {
    error?: { message?: string } | string
    message?: string
  }
  if (typeof payload.error === 'string') return payload.error
  if (
    payload.error &&
    typeof payload.error === 'object' &&
    payload.error.message
  ) {
    return payload.error.message
  }
  if (payload.message) return payload.message
  return `Image request failed (${response.status})`
}
