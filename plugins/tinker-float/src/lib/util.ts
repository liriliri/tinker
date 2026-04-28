export function isImageUrl(url: string): boolean {
  if (url.startsWith('data:image/')) return true
  try {
    const u = new URL(url)
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(u.pathname)
  } catch {
    return false
  }
}
