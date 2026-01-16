import { useState, useRef, useEffect } from 'react'
import { tw } from 'share/theme'

type GridResizerProps = {
  direction: 'row' | 'col'
  index: number
  onResize: (index: number, totalDelta: number) => void
}

const GridResizer = ({ direction, index, onResize }: GridResizerProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const startPosRef = useRef(0)
  const totalDeltaRef = useRef(0)

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = direction === 'row' ? e.clientY : e.clientX
      const totalDelta = currentPos - startPosRef.current
      totalDeltaRef.current = totalDelta
      onResize(index, totalDelta)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      totalDeltaRef.current = 0
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, direction, index, onResize])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    startPosRef.current = direction === 'row' ? e.clientY : e.clientX
    totalDeltaRef.current = 0
  }

  return (
    <div
      className={`absolute ${
        direction === 'row'
          ? 'left-0 right-0 h-2 cursor-row-resize top-1/2 -translate-y-1/2'
          : 'top-0 bottom-0 w-2 cursor-col-resize left-1/2 -translate-x-1/2'
      } ${tw.primary.bg} ${
        isDragging ? 'opacity-100' : 'opacity-0 hover:opacity-80'
      } transition-opacity z-10`}
      onMouseDown={handleMouseDown}
    />
  )
}

export default GridResizer
