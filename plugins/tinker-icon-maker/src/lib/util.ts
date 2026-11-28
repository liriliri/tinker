import splitPath from 'licia/splitPath'
import startWith from 'licia/startWith'

/**
 * First image file from a drop/file list, or null.
 * Uses `Array.from` because `licia/toArr` is not part of the vendor bundle.
 */
export function firstDroppedImage(
  files: FileList | File[] | null | undefined
): File | null {
  if (!files) return null
  const list = Array.isArray(files) ? files : Array.from(files)
  for (const file of list) {
    if (startWith(file.type, 'image/')) return file
  }
  return null
}

export function stripExt(name: string) {
  const { name: fileName, ext } = splitPath(name)
  return ext ? fileName.slice(0, -ext.length) : fileName
}
