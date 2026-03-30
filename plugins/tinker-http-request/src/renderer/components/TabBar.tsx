import { useRef, useEffect, useState, useCallback } from 'react'
import { tw, THEME_COLORS } from 'share/theme'

interface TabBarProps {
  tabs: readonly string[]
  activeTab: string
  labels: Record<string, string>
  onTabChange: (tab: string) => void
  right?: React.ReactNode
}

export default function TabBar({
  tabs,
  activeTab,
  labels,
  onTabChange,
  right,
}: TabBarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  const updateIndicator = useCallback(() => {
    const activeEl = tabRefs.current[activeTab]
    const container = containerRef.current
    if (activeEl && container) {
      const containerRect = container.getBoundingClientRect()
      const tabRect = activeEl.getBoundingClientRect()
      setIndicatorStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      })
    }
  }, [activeTab])

  useEffect(() => {
    updateIndicator()
  }, [activeTab, updateIndicator])

  return (
    <div ref={containerRef} className="relative flex items-center">
      {tabs.map((tab) => (
        <button
          key={tab}
          ref={(el) => {
            tabRefs.current[tab] = el
          }}
          onClick={() => onTabChange(tab)}
          className={`px-3 py-1.5 text-xs transition-colors ${
            activeTab === tab
              ? tw.primary.text
              : `${tw.text.secondary} ${tw.hover}`
          }`}
        >
          {labels[tab]}
        </button>
      ))}
      {right && <div className="ml-auto">{right}</div>}
      <div
        className="absolute bottom-0 h-0.5"
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
          backgroundColor: THEME_COLORS.primary,
          transition: 'left 0.25s ease, width 0.25s ease',
        }}
      />
    </div>
  )
}
