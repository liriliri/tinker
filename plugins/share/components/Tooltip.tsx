import { useEffect, useState, useRef, type ReactNode } from 'react'
import { tw } from '../theme'

interface TooltipProps {
  content: ReactNode
  x: number
  y: number
  visible: boolean
}

export default function Tooltip({ content, x, y, visible }: TooltipProps) {
  const [position, setPosition] = useState({ x, y })
  const [isPositioned, setIsPositioned] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible || !tooltipRef.current) {
      setPosition({ x, y })
      setIsPositioned(false)
      return
    }

    const tooltip = tooltipRef.current
    const rect = tooltip.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const padding = 8

    let newX = x
    let newY = y

    // Adjust horizontal position if tooltip goes off-screen
    if (x + rect.width > viewportWidth - padding) {
      newX = viewportWidth - rect.width - padding
    }
    if (newX < padding) {
      newX = padding
    }

    // Adjust vertical position if tooltip goes off-screen
    if (y + rect.height > viewportHeight - padding) {
      newY = y - rect.height - 10 // Show above cursor
    }

    setPosition({ x: newX, y: newY })
    setIsPositioned(true)
  }, [x, y, visible, content])

  if (!visible || !content) {
    return null
  }

  return (
    <div
      ref={tooltipRef}
      className={`fixed z-50 max-w-md px-3 py-2 text-sm rounded-lg shadow-lg pointer-events-none
                 ${tw.tooltip.bg} border ${tw.tooltip.border}
                 ${tw.tooltip.text} transition-opacity duration-150`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        opacity: isPositioned ? 1 : 0,
      }}
    >
      {content}
    </div>
  )
}
