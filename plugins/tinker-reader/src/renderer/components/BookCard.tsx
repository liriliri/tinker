import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText } from 'lucide-react'
import { tw } from 'share/theme'
import {
  getBookDisplayTitle,
  getBookReadPercent,
  getBookTypeLabel,
} from '../lib/util'
import type { Book } from '../types'
import store from '../store'

interface BookCardProps {
  book: Book
  onOpen: (book: Book) => void
}

const BookCard = observer(function BookCard({ book, onOpen }: BookCardProps) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const [generating, setGenerating] = useState(false)
  const displayTitle = getBookDisplayTitle(book)
  const typeLabel = getBookTypeLabel(book.path)
  const readPercent = getBookReadPercent(book)

  useEffect(() => {
    const el = ref.current
    if (!el || book.coverDataUrl !== null) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          if (book.coverDataUrl !== null || generating) continue
          setGenerating(true)
          void store.generateCover(book).finally(() => setGenerating(false))
        }
      },
      { rootMargin: '200px', threshold: 0.01 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [book, generating])

  return (
    <div
      ref={ref}
      className="group cursor-pointer"
      onClick={() => onOpen(book)}
      onContextMenu={(e) => {
        e.preventDefault()
        tinker.showContextMenu(e.clientX, e.clientY, [
          {
            label: t('showInFolder'),
            click: () => store.showBookInFolder(book),
          },
          {
            label: t('remove'),
            click: () => store.removeBook(book.id),
          },
        ])
      }}
    >
      <div
        className={`relative aspect-[3/4] flex items-center justify-center overflow-hidden rounded-lg ${tw.bg.secondary} ${tw.border} ${tw.hover} transition-colors`}
      >
        {book.coverDataUrl ? (
          <img
            src={book.coverDataUrl}
            alt={displayTitle}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={`flex flex-col items-center justify-center gap-2 ${tw.text.tertiary}`}
          >
            <FileText size={40} />
            {generating && (
              <span className="text-xs">{t('generatingCover')}</span>
            )}
          </div>
        )}
        {typeLabel && (
          <span className="absolute bottom-1.5 right-1.5 rounded px-1.5 py-1 text-xs font-semibold leading-none bg-black/70 text-white/90">
            {typeLabel}
          </span>
        )}
      </div>
      <div className="pt-2">
        <div
          className={`text-sm font-medium line-clamp-2 ${tw.text.primary}`}
          title={displayTitle}
        >
          {displayTitle}
        </div>
        <div className={`mt-1 text-xs ${tw.text.tertiary}`}>
          {readPercent === null
            ? t('unread')
            : t('readProgress', { percent: readPercent })}
        </div>
      </div>
    </div>
  )
})

export default BookCard
