import * as htmlToImage from 'html-to-image'
import sleep from 'licia/sleep'
import splitPath from 'licia/splitPath'
import { fileExists } from 'share/lib/util'

async function getFrameElement(): Promise<HTMLElement> {
  const deadline = Date.now() + 5000
  while (Date.now() < deadline) {
    const frameElement = document.getElementById('code-frame')
    if (frameElement) return frameElement
    await sleep(50)
  }
  throw new Error('Code frame not found. Open the plugin window first.')
}

export async function captureCodeImagePng(
  waitForRender = false
): Promise<Blob> {
  if (waitForRender) {
    await sleep(100)
  }

  const frameElement = await getFrameElement()
  const blob = await htmlToImage.toBlob(frameElement, {
    pixelRatio: 2,
  })

  if (!blob) {
    throw new Error('Failed to capture code image.')
  }

  return blob
}

export async function saveCodeImage(
  path: string,
  waitForRender = false
): Promise<string> {
  const dir = splitPath(path).dir
  if (!(await fileExists(dir))) {
    throw new Error(`Output directory not found: ${dir}`)
  }

  const blob = await captureCodeImagePng(waitForRender)
  const buffer = new Uint8Array(await blob.arrayBuffer())
  await tinker.writeFile(path, buffer)
  return path
}
