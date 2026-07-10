import splitPath from 'licia/splitPath'
import {
  createPluginMcpApi,
  formatMcpError,
  type PluginMcp,
} from 'share/lib/mcp'
import { fileExists } from 'share/lib/util'
import type { Store } from './store'
import { getFormatExtension, getCompressionRatio } from './lib/compress'
import pkg from '../package.json'

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    compress_images: compressImages,
  })
}

async function compressImages(store: Store, args: Record<string, unknown>) {
  const paths = args.paths as string[]
  const quality = (args.quality as number | undefined) ?? store.quality
  const keepExif = (args.keepExif as boolean | undefined) ?? store.keepExif
  const overwriteOriginal =
    (args.overwriteOriginal as boolean | undefined) ?? store.overwriteOriginal
  const save = (args.save as boolean | undefined) ?? true
  const outputDirectory = args.outputDirectory as string | undefined

  for (const filePath of paths) {
    if (!(await fileExists(filePath))) {
      return `Error: Image file not found: ${filePath}`
    }
  }

  if (save && !overwriteOriginal) {
    if (!outputDirectory) {
      return 'Error: outputDirectory is required when overwriteOriginal is false.'
    }

    if (!(await fileExists(outputDirectory))) {
      return `Error: Output directory not found: ${outputDirectory}`
    }
  }

  try {
    store.clear()
    store.setQuality(quality)
    store.setKeepExif(keepExif)
    store.setOverwriteOriginal(overwriteOriginal)

    const files: Array<{ file: File; filePath: string }> = []
    for (const filePath of paths) {
      const buffer = await tinker.readFile(filePath)
      const fileName = splitPath(filePath).name
      const file = new File([buffer], fileName, { type: 'image/*' })
      files.push({ file, filePath })
    }

    await store.loadImages(files)
    await store.compressAll()

    if (save) {
      await store.saveAll(outputDirectory)
    }

    return {
      settings: {
        quality: store.quality,
        overwriteOriginal: store.overwriteOriginal,
        keepExif: store.keepExif,
        outputDirectory: outputDirectory ?? null,
      },
      totalOriginalSize: store.totalOriginalSize,
      totalCompressedSize: store.totalCompressedSize,
      totalCompressionRatio: store.totalCompressionRatio,
      images: store.images.map((image) => {
        const extension = getFormatExtension(image.originalFormat)
        const fileName = image.fileName.replace(/\.[^.]+$/, `.${extension}`)
        const savedPath =
          image.isSaved && outputDirectory
            ? `${outputDirectory}/${fileName}`
            : image.isSaved && image.filePath
            ? image.filePath
            : null

        return {
          fileName: image.fileName,
          filePath: image.filePath ?? null,
          savedPath,
          originalFormat: image.originalFormat,
          originalSize: image.originalSize,
          compressedSize: image.compressedSize || null,
          compressionRatio:
            image.originalSize && image.compressedSize
              ? getCompressionRatio(image.originalSize, image.compressedSize)
              : null,
          isSaved: image.isSaved,
        }
      }),
    }
  } catch (error) {
    return formatMcpError(error, 'Failed to compress images')
  }
}
