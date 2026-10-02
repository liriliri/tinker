import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, ImagePlus, Loader2 } from 'lucide-react'
import className from 'licia/className'
import fileUrl from 'licia/fileUrl'
import isStrBlank from 'licia/isStrBlank'
import { tw } from '../../theme'
import type {
  GeneratedImageInfo,
  GenerateImageToolData,
} from '../../tools/image'
import { AI_CHAT_NS } from './i18n'

const ICON_SIZE = 14

export interface ImageCardProps {
  prompt: string
  images: GeneratedImageInfo[]
  error?: string
  isRunning?: boolean
  onOpenImage: (path: string) => void
}

export interface ImageToolMessage {
  data?: unknown
  toolArgs?: Record<string, unknown>
  error?: string
  toolStatus?: string
  generating?: boolean
}

function getImageToolData(data: unknown): GenerateImageToolData | null {
  if (!data || typeof data !== 'object') return null
  const images = (data as GenerateImageToolData).images
  if (!Array.isArray(images)) return null
  return data as GenerateImageToolData
}

export function getImageCardProps(
  msg: ImageToolMessage
): Omit<ImageCardProps, 'onOpenImage'> {
  const data = getImageToolData(msg.data)
  const images = data?.images ?? []
  const prompt =
    typeof msg.toolArgs?.prompt === 'string' ? msg.toolArgs.prompt : ''

  return {
    prompt,
    images,
    error: msg.error,
    isRunning:
      msg.toolStatus === 'running' || (msg.generating && images.length === 0),
  }
}

export function isImageMessageRenderable(msg: ImageToolMessage): boolean {
  if (msg.toolStatus === 'running' || msg.generating) return true
  if (!isStrBlank(msg.error ?? '')) return true
  const data = getImageToolData(msg.data)
  if (data && data.images.length > 0) return true
  const prompt =
    typeof msg.toolArgs?.prompt === 'string' ? msg.toolArgs.prompt : ''
  return !isStrBlank(prompt)
}

export default function ImageCard({
  prompt,
  images,
  error,
  isRunning = false,
  onOpenImage,
}: ImageCardProps) {
  const { t } = useTranslation(AI_CHAT_NS)
  const count = images.length
  const isError = Boolean(error)
  const canExpand = !isRunning && !isError && count > 0

  const statusText = isRunning
    ? t('generatingImage')
    : isError
    ? t('generateImageFailed')
    : `${count} ${t('generatedImages')}`

  const handleSummaryClick = (e: MouseEvent<HTMLElement>) => {
    if (!canExpand) e.preventDefault()
  }

  return (
    <details
      className={className(
        'group/tool w-full text-xs font-mono',
        tw.text.tertiary
      )}
    >
      <summary
        onClick={handleSummaryClick}
        className={className(
          'flex list-none items-center gap-2 rounded-sm px-1 py-1.5 select-none [&::-webkit-details-marker]:hidden',
          canExpand ? `cursor-pointer ${tw.hover}` : 'cursor-default'
        )}
      >
        {isRunning ? (
          <Loader2
            size={ICON_SIZE}
            className={className('shrink-0 animate-spin', tw.primary.text)}
          />
        ) : (
          <ChevronRight
            size={ICON_SIZE}
            className={className(
              'shrink-0 transition-transform group-open/tool:rotate-90',
              canExpand ? '' : 'opacity-0'
            )}
          />
        )}
        <span
          className={className(
            'shrink-0',
            isError ? 'text-red-500 dark:text-red-400' : tw.primary.text
          )}
        >
          <ImagePlus size={ICON_SIZE} />
        </span>
        <span
          className={className(
            'min-w-0 flex-1 truncate font-medium',
            isError ? 'text-red-500 dark:text-red-400' : tw.primary.text
          )}
        >
          {prompt || t('toolCall')}
        </span>
        <span className="shrink-0">{statusText}</span>
      </summary>

      {canExpand && images.length > 0 && (
        <div
          className={className(
            'mt-1 inline-flex max-w-full flex-wrap gap-2 rounded-md border p-2',
            tw.border,
            tw.bg.primary
          )}
        >
          {images.map((image) => (
            <button
              key={image.path}
              type="button"
              onClick={() => onOpenImage(image.path)}
              className={className(
                'block max-w-full overflow-hidden rounded border bg-transparent p-0 cursor-pointer',
                tw.border,
                tw.hover
              )}
              title={image.path}
            >
              <img
                src={fileUrl(image.path)}
                alt={prompt || t('generatedImages')}
                className="block max-h-48 max-w-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </details>
  )
}
