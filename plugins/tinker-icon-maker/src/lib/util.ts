import find from 'licia/find'
import loadImg from 'licia/loadImg'
import splitPath from 'licia/splitPath'
import startWith from 'licia/startWith'
import toArr from 'licia/toArr'

/** First image file from a drop/file list, or null. */
export function firstDroppedImage(
  files: FileList | File[] | null | undefined
): File | null {
  if (!files) return null
  return find(toArr(files), (file) => startWith(file.type, 'image/')) ?? null
}

export function stripExt(name: string) {
  const { name: fileName, ext } = splitPath(name)
  return ext ? fileName.slice(0, -ext.length) : fileName
}

/** Decode a blob URL into an image element, rejecting when the file is not a valid image. */
export function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    loadImg(url, (err: unknown, img: HTMLImageElement) => {
      if (err) reject(new Error('Failed to load image'))
      else resolve(img)
    })
  })
}
