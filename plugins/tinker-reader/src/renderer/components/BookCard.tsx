import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText } from 'lucide-react'
import { tw } from 'share/theme'
import { formatFileSize } from '../lib/util'
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
      className={`group cursor-pointer rounded-lg ${tw.bg.secondary} ${tw.border} ${tw.hover} transition-colors overflow-hidden`}
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
      <div className="relative aspect-[3/4] flex items-center justify-center overflow-hidden">
        {book.coverDataUrl ? (
          <img
            src={book.coverDataUrl}
            alt={book.title}
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
      </div>
      <div className="p-2">
        <div
          className={`text-sm font-medium line-clamp-2 ${tw.text.primary}`}
          title={book.title}
        >
          {book.title}
        </div>
        <div className={`mt-1 text-xs ${tw.text.tertiary}`}>
          {book.numPages > 0
            ? t('pageCount', { count: book.numPages })
            : formatFileSize(book.fileSize)}
        </div>
      </div>
    </div>
  )
})

export default BookCard
