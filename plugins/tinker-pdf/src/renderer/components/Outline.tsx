import { observer } from 'mobx-react-lite'
import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import className from 'licia/className'
import store from '../store'
import { ChevronRight, ChevronDown } from 'lucide-react'

interface OutlineItem {
  title: string
  dest: any
  items: OutlineItem[]
  bold?: boolean
  italic?: boolean
}

interface OutlineNodeProps {
  item: OutlineItem
  level: number
  onItemClick: (dest: any) => void
}

function OutlineNode({ item, level, onItemClick }: OutlineNodeProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = item.items && item.items.length > 0

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (item.dest) {
      onItemClick(item.dest)
    }
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded(!expanded)
  }

  return (
    <div className="outline-item">
      <div
        className={`
          flex items-center py-1 px-2 cursor-pointer rounded
          transition-colors
          ${tw.hover.both}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {hasChildren && (
          <button
            onClick={handleToggle}
            className="flex-shrink-0 mr-1 p-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
        {!hasChildren && <span className="w-5 flex-shrink-0" />}
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
      </div>
      {hasChildren && expanded && (
        <div>
          {item.items.map((child, index) => (
            <OutlineNode
              key={index}
              item={child}
              level={level + 1}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default observer(function Outline() {
  const { t } = useTranslation()
  const [outline, setOutline] = useState<OutlineItem[] | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadOutline = async () => {
      if (!store.pdfDoc) {
        setOutline(null)
        return
      }

      try {
        const outlineData = await store.pdfDoc.getOutline()
        setOutline(outlineData)
      } catch (error) {
        console.error('Error loading outline:', error)
        setOutline(null)
      }
    }

    loadOutline()
  }, [store.pdfDoc])

  const handleItemClick = async (dest: any) => {
    if (!store.pdfDoc) return

    try {
      let pageNumber: number | null = null

      // Handle different destination formats
      if (typeof dest === 'string') {
        // Named destination
        const explicitDest = await store.pdfDoc.getDestination(dest)
        if (Array.isArray(explicitDest) && explicitDest[0]) {
          const pageRef = explicitDest[0]
          pageNumber = await store.pdfDoc.getPageIndex(pageRef)
          pageNumber = pageNumber + 1 // Convert 0-based to 1-based
        }
      } else if (Array.isArray(dest) && dest[0]) {
        // Explicit destination
        const pageRef = dest[0]
        if (typeof pageRef === 'object') {
          pageNumber = await store.pdfDoc.getPageIndex(pageRef)
          pageNumber = pageNumber + 1 // Convert 0-based to 1-based
        } else if (typeof pageRef === 'number') {
          pageNumber = pageRef + 1 // Convert 0-based to 1-based
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

  if (!store.pdfDoc) {
    return null
  }

  if (!outline || outline.length === 0) {
    return (
      <div
        ref={containerRef}
        className={`
          flex-1 flex items-center justify-center p-4
          ${tw.text.both.secondary}
        `}
      >
        <p className="text-sm text-center">{t('noOutline')}</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden py-2"
      style={{
        scrollbarWidth: 'thin',
      }}
    >
      {outline.map((item, index) => (
        <OutlineNode
          key={index}
          item={item}
          level={0}
          onItemClick={handleItemClick}
        />
      ))}
    </div>
  )
})
