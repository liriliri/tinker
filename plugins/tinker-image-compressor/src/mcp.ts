import splitPath from 'licia/splitPath'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import { fileExists } from 'share/lib/util'
import type { Store } from './store'
import { getFormatExtension, getCompressionRatio } from './lib/compress'
import pkg from '../package.json'

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    compress: compressImages,
  })
}

async function compressImages(
  store: Store,
  args: {
    paths: string[]
    quality?: number
    keepExif?: boolean
    overwriteOriginal?: boolean
    save?: boolean
    outputDirectory?: string
  }
) {
  const quality = args.quality ?? store.quality
  const keepExif = args.keepExif ?? store.keepExif
  const overwriteOriginal = args.overwriteOriginal ?? store.overwriteOriginal
  const save = args.save ?? true
  const { paths, outputDirectory } = args

  for (const filePath of paths) {
    if (!(await fileExists(filePath))) {
      throw new Error(`Image file not found: ${filePath}`)
    }
  }

  if (save && !overwriteOriginal) {
    if (!outputDirectory) {
      throw new Error(
        'outputDirectory is required when overwriteOriginal is false.'
      )
    }

    if (!(await fileExists(outputDirectory))) {
      throw new Error(`Output directory not found: ${outputDirectory}`)
    }
  }

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
}
