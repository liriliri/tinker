interface GridResizerProps {
  direction: 'row' | 'col'
  onMouseDown: (event: React.MouseEvent) => void
}

export default function GridResizer({
  direction,
  onMouseDown,
}: GridResizerProps) {
  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    onMouseDown(event)
  }

  return (
    <div
      className={`absolute ${
        direction === 'row'
          ? 'left-0 right-0 h-3 cursor-row-resize top-1/2 -translate-y-1/2'
          : 'top-0 bottom-0 w-3 cursor-col-resize left-1/2 -translate-x-1/2'
      } z-20`}
      onMouseDown={handleMouseDown}
    />
  )
}
