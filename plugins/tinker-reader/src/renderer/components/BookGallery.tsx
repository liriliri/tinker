import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import OverlayScrollbars from 'share/components/OverlayScrollbars'
import { tw } from 'share/theme'
import store from '../store'
import BookCard from './BookCard'

const BookGallery = observer(function BookGallery() {
  const { t } = useTranslation()

  if (store.books.length === 0) {
    return (
      <div
        className={`flex h-full items-center justify-center px-6 text-sm ${tw.text.tertiary}`}
      >
        {t('emptyGallery')}
      </div>
    )
  }

  return (
    <OverlayScrollbars className="flex-1 w-full">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4 p-4">
        {store.books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            onOpen={(item) => store.openBook(item)}
          />
        ))}
      </div>
    </OverlayScrollbars>
  )
})

export default BookGallery
