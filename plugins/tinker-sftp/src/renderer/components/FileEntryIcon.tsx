import DirectoryIcon from '../assets/directory.svg?react'
import FileIcon from '../assets/file.svg?react'

interface FileEntryIconProps {
  isDirectory: boolean
  size?: number
  className?: string
}

export default function FileEntryIcon({
  isDirectory,
  size = 16,
  className = '',
}: FileEntryIconProps) {
  const iconSize = className ? undefined : Math.round(size * 0.875)

  if (isDirectory) {
    return (
      <DirectoryIcon
        aria-hidden="true"
        className={`shrink-0 ${className}`}
        width={iconSize}
        height={iconSize}
      />
    )
  }

  return (
    <FileIcon
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      width={iconSize}
      height={iconSize}
    />
  )
}
