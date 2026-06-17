import { useEffect, useState } from 'react'
import { getFileIcon } from 'share/lib/util'
import DirectoryIcon from '../assets/directory.svg?react'

interface FileEntryIconProps {
  path: string
  isDirectory: boolean
  size?: number
  className?: string
}

export default function FileEntryIcon({
  path,
  isDirectory,
  size = 16,
  className = '',
}: FileEntryIconProps) {
  const [icon, setIcon] = useState<string | undefined>()

  useEffect(() => {
    if (isDirectory) {
      setIcon(undefined)
      return
    }

    let active = true
    getFileIcon(path).then((result) => {
      if (active) setIcon(result)
    })
    return () => {
      active = false
    }
  }, [path, isDirectory])

  if (isDirectory) {
    const dirSize = className ? undefined : Math.round(size * 0.875)

    return (
      <DirectoryIcon
        aria-hidden="true"
        className={`shrink-0 ${className}`}
        width={dirSize}
        height={dirSize}
      />
    )
  }

  if (icon) {
    return (
      <img
        src={icon}
        alt=""
        className={`shrink-0 object-contain ${className}`}
        style={className ? undefined : { width: size, height: size }}
      />
    )
  }

  return (
    <span
      className={`shrink-0 ${className}`}
      style={className ? undefined : { width: size, height: size }}
    />
  )
}
