export function stripFileExt(fileName: string, ext: string): string {
  if (!ext) return fileName
  const normalizedExt = ext.startsWith('.') ? ext : `.${ext}`
  if (fileName.toLowerCase().endsWith(normalizedExt.toLowerCase())) {
    return fileName.slice(0, -normalizedExt.length)
  }
  return fileName
}
