import compact from 'licia/compact'
import isEmpty from 'licia/isEmpty'
import map from 'licia/map'
import openFile from 'licia/openFile'
import splitPath from 'licia/splitPath'
import { isOnline } from 'share/lib/util'

function mimeTypeFromFileName(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || 'png'
  return `image/${ext === 'jpg' ? 'jpeg' : ext}`
}

async function loadImageFromPath(
  filePath: string
): Promise<{ file: File; filePath: string } | null> {
  try {
    const buffer = await tinker.readFile(filePath)
    const fileName = splitPath(filePath).name || 'image.png'
    const mimeType = mimeTypeFromFileName(fileName)
    const file = new File([buffer], fileName, { type: mimeType })
    return { file, filePath }
  } catch (error) {
    console.error('Failed to load image:', error)
    return null
  }
}

export async function openImageFiles(options: {
  title: string
  extensions: string[]
}): Promise<Array<{ file: File; filePath: string }>> {
  const { title, extensions } = options

  if (isOnline()) {
    const files = await openFile({
      accept: map(extensions, (ext) => `.${ext}`).join(','),
      multiple: true,
    })
    return map(files || [], (file) => ({ file, filePath: file.name }))
  }

  const result = await tinker.showOpenDialog({
    title,
    filters: [{ name: 'Images', extensions }],
    properties: ['openFile', 'multiSelections'],
  })

  if (result.canceled || isEmpty(result.filePaths)) return []

  const loaded = await Promise.all(map(result.filePaths, loadImageFromPath))
  return compact(loaded)
}
