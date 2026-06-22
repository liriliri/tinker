import { observer } from 'mobx-react-lite'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import { useContainerWidth } from '../hooks/useContainerWidth'
import store from '../store'
import MasonrySection from './MasonrySection'

function formatSectionLabel(label: string): string {
  const [year, month] = label.split('-').map(Number)
  if (!year || !month) return label

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'long',
  }).format(new Date(year, month - 1, 1))
}

const PhotoGallery = observer(function PhotoGallery() {
  const { t } = useTranslation()
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null)
  const containerWidth = useContainerWidth(scrollRoot)
  const handleScrollRef = useCallback((node: HTMLDivElement | null) => {
    setScrollRoot(node)
  }, [])
  const sections = store.photoSections

  if (store.photos.length === 0) {
    return (
      <div
        className={`flex h-full items-center justify-center px-6 text-sm ${tw.text.tertiary}`}
      >
        {t('emptyGallery')}
      </div>
    )
  }

  return (
    <div
      ref={handleScrollRef}
      className="h-full overflow-y-auto overflow-anchor-auto pb-6"
    >
      {sections.map((section) => (
        <section key={section.id}>
          <h2
            className={`sticky top-0 z-20 px-3 py-2.5 text-sm font-semibold tracking-wide backdrop-blur-md ${tw.bg.primary} ${tw.text.primary}`}
          >
            {formatSectionLabel(section.label)}
          </h2>
          <MasonrySection
            photos={section.photos}
            containerWidth={containerWidth}
            scrollRoot={scrollRoot}
            onOpen={(item) => store.openViewer(item)}
          />
        </section>
      ))}
    </div>
  )
})

export default PhotoGallery
