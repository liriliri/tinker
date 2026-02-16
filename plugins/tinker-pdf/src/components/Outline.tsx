import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import className from 'licia/className'
import Tree, { TreeNodeData } from 'share/components/Tree'
import store from '../store'

interface OutlineItem extends TreeNodeData {
  title: string
  dest: any
  items?: OutlineItem[]
  bold?: boolean
  italic?: boolean
}

export default observer(function Outline() {
  const { t } = useTranslation()
  const [outline, setOutline] = useState<OutlineItem[] | null>(null)

  useEffect(() => {
    const loadOutline = async () => {
      if (!store.pdfDoc) {
        setOutline(null)
        return
      }

      try {
        const outlineData = await store.pdfDoc.getOutline()
        if (outlineData) {
          const transformOutline = (items: any[]): OutlineItem[] => {
            return items.map((item, index) => ({
              id: `outline-${index}-${item.title}`,
              label: item.title,
              title: item.title,
              dest: item.dest,
              items: item.items ? transformOutline(item.items) : undefined,
              children: item.items ? transformOutline(item.items) : undefined,
              bold: item.bold,
              italic: item.italic,
            }))
          }
          setOutline(transformOutline(outlineData))
        } else {
          setOutline(null)
        }
      } catch (error) {
        console.error('Error loading outline:', error)
        setOutline(null)
      }
    }

    loadOutline()
  }, [store.pdfDoc])

  const handleItemClick = async (item: OutlineItem) => {
    if (!store.pdfDoc || !item.dest) return

    try {
      let pageNumber: number | null = null

      if (typeof item.dest === 'string') {
        const explicitDest = await store.pdfDoc.getDestination(item.dest)
        if (Array.isArray(explicitDest) && explicitDest[0]) {
          const pageRef = explicitDest[0]
          pageNumber = await store.pdfDoc.getPageIndex(pageRef)
          pageNumber = pageNumber + 1
        }
      } else if (Array.isArray(item.dest) && item.dest[0]) {
        const pageRef = item.dest[0]
        if (typeof pageRef === 'object') {
          pageNumber = await store.pdfDoc.getPageIndex(pageRef)
          pageNumber = pageNumber + 1
        } else if (typeof pageRef === 'number') {
          pageNumber = pageRef + 1
        }
      }

      if (pageNumber && pageNumber >= 1 && pageNumber <= store.numPages) {
        store.setCurrentPage(pageNumber)
        store.scrollToPage = pageNumber
      }
    } catch (error) {
      console.error('Error navigating to destination:', error)
    }
  }

  const renderLabel = (item: OutlineItem) => (
    <span
      className={className(
        'text-sm truncate',
        tw.text.both.primary,
        item.bold && 'font-bold',
        item.italic && 'italic'
      )}
      title={item.title}
    >
      {item.title}
    </span>
  )

  if (!store.pdfDoc) {
    return null
  }

  return (
    <Tree
      data={outline}
      onNodeClick={handleItemClick}
      renderLabel={renderLabel}
      emptyText={t('noOutline')}
    />
  )
})
