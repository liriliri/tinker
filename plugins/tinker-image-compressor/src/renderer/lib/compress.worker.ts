import type {
  ImageData,
  CompressOptions,
  CompressResult,
} from '../types/codecs'

interface CompressMessage {
  type: 'compress'
  id: string
  imageData: ImageData
  options: CompressOptions
}

interface CompressResultMessage {
  type: 'result'
  id: string
  result: CompressResult
}

interface CompressErrorMessage {
  type: 'error'
  id: string
  error: string
}

type WorkerMessage = CompressResultMessage | CompressErrorMessage

// Store loaded modules
let mozjpegModule: any = null
let oxipngModule: any = null
let webpModule: any = null

async function loadMozJpeg() {
  if (mozjpegModule) return mozjpegModule

  const moduleFactory = (await import('../lib/codecs/mozjpeg/mozjpeg_enc.js'))
    .default

  // Fetch and provide WASM binary directly
  const wasmUrl = new URL(
    '../lib/codecs/mozjpeg/mozjpeg_enc.wasm',
    import.meta.url
  ).href
  const wasmResponse = await fetch(wasmUrl)
  const wasmBinary = await wasmResponse.arrayBuffer()

  mozjpegModule = await moduleFactory({
    wasmBinary,
  } as any)
  return mozjpegModule
}

async function loadOxipng() {
  if (oxipngModule) return oxipngModule

  const initOxipng = (await import('../lib/codecs/oxipng/squoosh_oxipng.js'))
    .default
  const wasmUrl = new URL(
    '../lib/codecs/oxipng/squoosh_oxipng_bg.wasm',
    import.meta.url
  ).href
  await initOxipng(wasmUrl)
  oxipngModule = await import('../lib/codecs/oxipng/squoosh_oxipng.js')
  return oxipngModule
}

async function loadWebP() {
  if (webpModule) return webpModule

  const moduleFactory = (await import('../lib/codecs/webp/webp_enc.js')).default

  // Fetch and provide WASM binary directly
  const wasmUrl = new URL('../lib/codecs/webp/webp_enc.wasm', import.meta.url)
    .href
  const wasmResponse = await fetch(wasmUrl)
  const wasmBinary = await wasmResponse.arrayBuffer()

  webpModule = await moduleFactory({
    wasmBinary,
  } as any)
  return webpModule
}

async function compressJpeg(
  imageData: ImageData,
  quality: number
): Promise<Uint8Array> {
  const module = await loadMozJpeg()

  const result = module.encode(
    imageData.data,
    imageData.width,
    imageData.height,
    {
      quality,
      baseline: false,
      arithmetic: false,
      progressive: true,
      optimize_coding: true,
      smoothing: 0,
      color_space: 3, // YCbCr
      quant_table: 3,
      trellis_multipass: false,
      trellis_opt_zero: false,
      trellis_opt_table: false,
      trellis_loops: 1,
      auto_subsample: true,
      chroma_subsample: 2,
      separate_chroma_quality: false,
      chroma_quality: 75,
    }
  )

  return result
}

async function compressPng(
  imageData: ImageData,
  level: number
): Promise<Uint8Array> {
  const module = await loadOxipng()

  const result = module.optimise(
    imageData.data,
    imageData.width,
    imageData.height,
    level,
    false
  )

  return result
}

async function compressWebP(
  imageData: ImageData,
  quality: number
): Promise<Uint8Array> {
  const module = await loadWebP()

  const result = module.encode(
    imageData.data,
    imageData.width,
    imageData.height,
    {
      quality,
      target_size: 0,
      target_PSNR: 0,
      method: 4,
      sns_strength: 50,
      filter_strength: 60,
      filter_sharpness: 0,
      filter_type: 1,
      partitions: 0,
      segments: 4,
      pass: 1,
      show_compressed: 0,
      preprocessing: 0,
      autofilter: 0,
      partition_limit: 0,
      alpha_compression: 1,
      alpha_filtering: 1,
      alpha_quality: 100,
      lossless: 0,
      exact: 0,
      image_hint: 0,
      emulate_jpeg_size: 0,
      thread_level: 0,
      low_memory: 0,
      near_lossless: 100,
      use_delta_palette: 0,
      use_sharp_yuv: 0,
    }
  )

  if (!result) {
    throw new Error('WebP encoding failed')
  }

  return result
}

async function compress(
  imageData: ImageData,
  options: CompressOptions
): Promise<CompressResult> {
  let data: Uint8Array

  switch (options.format) {
    case 'jpeg': {
      data = await compressJpeg(imageData, options.quality)
      break
    }
    case 'png': {
      // PNG quality is 0-6, map from 0-100
      const level = Math.round((options.quality / 100) * 6)
      data = await compressPng(imageData, level)
      break
    }
    case 'webp': {
      data = await compressWebP(imageData, options.quality)
      break
    }
    default:
      throw new Error(`Unsupported format: ${options.format}`)
  }

  return {
    data,
    size: data.length,
  }
}

self.onmessage = async (e: MessageEvent<CompressMessage>) => {
  const { type, id, imageData, options } = e.data

  if (type === 'compress') {
    try {
      const result = await compress(imageData, options)
      self.postMessage({
        type: 'result',
        id,
        result,
      } as WorkerMessage)
    } catch (error) {
      self.postMessage({
        type: 'error',
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      } as WorkerMessage)
    }
  }
}
