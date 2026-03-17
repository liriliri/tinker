import { BrowserQRCodeReader } from '@zxing/library'

export async function decodeQRFromUrl(url: string): Promise<string> {
  const img = new window.Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
  const reader = new BrowserQRCodeReader()
  const result = await reader.decodeFromImageElement(img)
  return result.getText()
}
