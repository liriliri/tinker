import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { tw } from '../../theme'
import className from 'licia/className'
import Tree, { TreeNodeData } from '../Tree'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { RefProxy } from 'pdfjs-dist/types/src/display/api'
import { PDF_VIEWER_NS } from './i18n'

interface OutlineItem extends TreeNodeData {
  title: string
  dest: string | Array<RefProxy | number | null> | null
  items?: OutlineItem[]
  bold?: boolean
  italic?: boolean
}

interface RawOutlineItem {
  title: string
  bold: boolean
  italic: boolean
  dest: string | Array<RefProxy | number | null> | null
  items?: RawOutlineItem[]
}

export interface OutlineProps {
  pdfDoc: PDFDocumentProxy | null
  numPages: number
  onSetCurrentPage: (page: number) => void
  onSetScrollToPage: (page: number) => void
}

export default function Outline({
  pdfDoc,
  numPages,
  onSetCurrentPage,
  onSetScrollToPage,
}: OutlineProps) {
  const { t } = useTranslation(PDF_VIEWER_NS)
  const [outline, setOutline] = useState<OutlineItem[] | null>(null)

  useEffect(() => {
    const loadOutline = async () => {
      if (!pdfDoc) {
        setOutline(null)
        return
      }

      try {
        const outlineData = await pdfDoc.getOutline()
        if (outlineData) {
          const transformOutline = (items: RawOutlineItem[]): OutlineItem[] => {
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
          setOutline(transformOutline(outlineData as RawOutlineItem[]))
        } else {
          setOutline(null)
        }
      } catch (error) {
        console.error('Error loading outline:', error)
        setOutline(null)
      }
    }

    loadOutline()
  }, [pdfDoc])

  const handleItemClick = async (item: OutlineItem) => {
    if (!pdfDoc || !item.dest) return

    try {
      let pageNumber: number | null = null

      if (typeof item.dest === 'string') {
        const explicitDest = await pdfDoc.getDestination(item.dest)
        if (Array.isArray(explicitDest) && explicitDest[0]) {
          const pageRef = explicitDest[0]
          pageNumber = await pdfDoc.getPageIndex(pageRef)
          pageNumber = pageNumber + 1
        }
      } else if (Array.isArray(item.dest) && item.dest[0]) {
        const pageRef = item.dest[0]
        if (typeof pageRef === 'object') {
          pageNumber = await pdfDoc.getPageIndex(pageRef)
          pageNumber = pageNumber + 1
        } else if (typeof pageRef === 'number') {
          pageNumber = pageRef + 1
        }
      }

      if (pageNumber && pageNumber >= 1 && pageNumber <= numPages) {
        onSetCurrentPage(pageNumber)
        onSetScrollToPage(pageNumber)
      }
    } catch (error) {
      console.error('Error navigating to destination:', error)
    }
  }

  const renderLabel = (item: OutlineItem) => (
    <span
      className={className(
        'text-sm truncate',
        tw.text.primary,
        item.bold && 'font-bold',
        item.italic && 'italic'
      )}
      title={item.title}
    >
      {item.title}
    </span>
  )

  if (!pdfDoc) {
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
}
