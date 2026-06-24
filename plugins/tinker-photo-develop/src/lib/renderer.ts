import type { Adjustments } from '../types'
import { isRgbCurveModeActive } from './adjustments'
import { toGpuAdjustments } from './adjustmentScales'
import { buildCurveLut } from './curves'
import {
  computeWorkingDimensions,
  getRasterSourceSize,
  rasterizeImage,
  type RasterImageSource,
} from './imageLoad'
import { FRAGMENT_SHADER, VERTEX_SHADER } from './shaders'

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) {
    throw new Error('Failed to create shader')
  }

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) || 'Unknown shader error'
    gl.deleteShader(shader)
    throw new Error(log)
  }

  return shader
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string
): WebGLProgram {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource)
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
  const program = gl.createProgram()

  if (!program) {
    throw new Error('Failed to create program')
  }

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) || 'Unknown program error'
    gl.deleteProgram(program)
    throw new Error(log)
  }

  return program
}

function assertNoGlError(gl: WebGLRenderingContext, message: string) {
  const error = gl.getError()
  if (error === gl.NO_ERROR) return
  throw new Error(`${message} (WebGL error ${error})`)
}

function createSharpnessBlurredCanvas(
  source: RasterImageSource,
  scale = 0.5
): HTMLCanvasElement {
  const { width: sourceWidth, height: sourceHeight } =
    getRasterSourceSize(source)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(sourceWidth * scale))
  canvas.height = Math.max(1, Math.round(sourceHeight * scale))

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to create sharpness blur canvas context')
  }

  ctx.filter = 'blur(1px)'
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)

  return canvas
}

function createBlurredCanvas(source: RasterImageSource): HTMLCanvasElement {
  const scale = 0.25
  const { width: sourceWidth, height: sourceHeight } =
    getRasterSourceSize(source)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(sourceWidth * scale))
  canvas.height = Math.max(1, Math.round(sourceHeight * scale))

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to create blur canvas context')
  }

  ctx.filter = 'blur(4px)'
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)

  return canvas
}

function createLutTexture(gl: WebGLRenderingContext): WebGLTexture {
  const texture = gl.createTexture()
  if (!texture) {
    throw new Error('Failed to create LUT texture')
  }

  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    256,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    buildCurveLut([
      { x: 0, y: 0 },
      { x: 255, y: 255 },
    ])
  )

  return texture
}

function updateLutTexture(
  gl: WebGLRenderingContext,
  texture: WebGLTexture,
  points: { x: number; y: number }[]
) {
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texSubImage2D(
    gl.TEXTURE_2D,
    0,
    0,
    0,
    256,
    1,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    buildCurveLut(points)
  )
}

export class WebGLRenderer {
  readonly canvas: HTMLCanvasElement
  private gl: WebGLRenderingContext
  private program: WebGLProgram
  private texture: WebGLTexture | null = null
  private blurredTexture: WebGLTexture | null = null
  private sharpnessBlurTexture: WebGLTexture | null = null
  private positionBuffer: WebGLBuffer
  private texCoordBuffer: WebGLBuffer
  private exposureLocation: WebGLUniformLocation
  private brightnessLocation: WebGLUniformLocation
  private contrastLocation: WebGLUniformLocation
  private highlightsLocation: WebGLUniformLocation
  private shadowsLocation: WebGLUniformLocation
  private whitesLocation: WebGLUniformLocation
  private blacksLocation: WebGLUniformLocation
  private temperatureLocation: WebGLUniformLocation
  private tintLocation: WebGLUniformLocation
  private vibranceLocation: WebGLUniformLocation
  private saturationLocation: WebGLUniformLocation
  private hslHueLocation: WebGLUniformLocation
  private hslSatLocation: WebGLUniformLocation
  private hslLumLocation: WebGLUniformLocation
  private hslActiveLocation: WebGLUniformLocation
  private vignetteAmountLocation: WebGLUniformLocation
  private vignetteMidpointLocation: WebGLUniformLocation
  private vignetteRoundnessLocation: WebGLUniformLocation
  private vignetteFeatherLocation: WebGLUniformLocation
  private grainAmountLocation: WebGLUniformLocation
  private grainSizeLocation: WebGLUniformLocation
  private grainRoughnessLocation: WebGLUniformLocation
  private grainScaleLocation: WebGLUniformLocation
  private imageSizeLocation: WebGLUniformLocation
  private sharpnessLocation: WebGLUniformLocation
  private sharpnessThresholdLocation: WebGLUniformLocation
  private lumaNoiseReductionLocation: WebGLUniformLocation
  private colorNoiseReductionLocation: WebGLUniformLocation
  private detailScaleLocation: WebGLUniformLocation
  private sharpnessBlurLocation: WebGLUniformLocation
  private imageLocation: WebGLUniformLocation
  private blurredImageLocation: WebGLUniformLocation
  private lumaLutLocation: WebGLUniformLocation
  private redLutLocation: WebGLUniformLocation
  private greenLutLocation: WebGLUniformLocation
  private blueLutLocation: WebGLUniformLocation
  private rgbCurvesActiveLocation: WebGLUniformLocation
  private lumaLutTexture: WebGLTexture
  private redLutTexture: WebGLTexture
  private greenLutTexture: WebGLTexture
  private blueLutTexture: WebGLTexture
  private imageWidth = 0
  private imageHeight = 0

  constructor() {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    })

    if (!gl) {
      throw new Error('WebGL is not supported')
    }

    this.canvas = canvas
    this.gl = gl
    this.program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER)

    const positionLocation = gl.getAttribLocation(this.program, 'aPosition')
    const texCoordLocation = gl.getAttribLocation(this.program, 'aTexCoord')
    this.exposureLocation = gl.getUniformLocation(this.program, 'uExposure')!
    this.brightnessLocation = gl.getUniformLocation(
      this.program,
      'uBrightness'
    )!
    this.contrastLocation = gl.getUniformLocation(this.program, 'uContrast')!
    this.highlightsLocation = gl.getUniformLocation(
      this.program,
      'uHighlights'
    )!
    this.shadowsLocation = gl.getUniformLocation(this.program, 'uShadows')!
    this.whitesLocation = gl.getUniformLocation(this.program, 'uWhites')!
    this.blacksLocation = gl.getUniformLocation(this.program, 'uBlacks')!
    this.temperatureLocation = gl.getUniformLocation(
      this.program,
      'uTemperature'
    )!
    this.tintLocation = gl.getUniformLocation(this.program, 'uTint')!
    this.vibranceLocation = gl.getUniformLocation(this.program, 'uVibrance')!
    this.saturationLocation = gl.getUniformLocation(
      this.program,
      'uSaturation'
    )!
    this.hslHueLocation = gl.getUniformLocation(this.program, 'uHslHue')!
    this.hslSatLocation = gl.getUniformLocation(this.program, 'uHslSat')!
    this.hslLumLocation = gl.getUniformLocation(this.program, 'uHslLum')!
    this.hslActiveLocation = gl.getUniformLocation(this.program, 'uHslActive')!
    this.vignetteAmountLocation = gl.getUniformLocation(
      this.program,
      'uVignetteAmount'
    )!
    this.vignetteMidpointLocation = gl.getUniformLocation(
      this.program,
      'uVignetteMidpoint'
    )!
    this.vignetteRoundnessLocation = gl.getUniformLocation(
      this.program,
      'uVignetteRoundness'
    )!
    this.vignetteFeatherLocation = gl.getUniformLocation(
      this.program,
      'uVignetteFeather'
    )!
    this.grainAmountLocation = gl.getUniformLocation(
      this.program,
      'uGrainAmount'
    )!
    this.grainSizeLocation = gl.getUniformLocation(this.program, 'uGrainSize')!
    this.grainRoughnessLocation = gl.getUniformLocation(
      this.program,
      'uGrainRoughness'
    )!
    this.grainScaleLocation = gl.getUniformLocation(
      this.program,
      'uGrainScale'
    )!
    this.imageSizeLocation = gl.getUniformLocation(this.program, 'uImageSize')!
    this.sharpnessLocation = gl.getUniformLocation(this.program, 'uSharpness')!
    this.sharpnessThresholdLocation = gl.getUniformLocation(
      this.program,
      'uSharpnessThreshold'
    )!
    this.lumaNoiseReductionLocation = gl.getUniformLocation(
      this.program,
      'uLumaNoiseReduction'
    )!
    this.colorNoiseReductionLocation = gl.getUniformLocation(
      this.program,
      'uColorNoiseReduction'
    )!
    this.detailScaleLocation = gl.getUniformLocation(
      this.program,
      'uDetailScale'
    )!
    this.sharpnessBlurLocation = gl.getUniformLocation(
      this.program,
      'uSharpnessBlur'
    )!
    this.imageLocation = gl.getUniformLocation(this.program, 'uImage')!
    this.blurredImageLocation = gl.getUniformLocation(
      this.program,
      'uBlurredImage'
    )!
    this.lumaLutLocation = gl.getUniformLocation(this.program, 'uLumaLut')!
    this.redLutLocation = gl.getUniformLocation(this.program, 'uRedLut')!
    this.greenLutLocation = gl.getUniformLocation(this.program, 'uGreenLut')!
    this.blueLutLocation = gl.getUniformLocation(this.program, 'uBlueLut')!
    this.rgbCurvesActiveLocation = gl.getUniformLocation(
      this.program,
      'uRgbCurvesActive'
    )!

    this.lumaLutTexture = createLutTexture(gl)
    this.redLutTexture = createLutTexture(gl)
    this.greenLutTexture = createLutTexture(gl)
    this.blueLutTexture = createLutTexture(gl)

    this.positionBuffer = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    )

    this.texCoordBuffer = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]),
      gl.STATIC_DRAW
    )

    gl.useProgram(this.program)
    gl.enableVertexAttribArray(positionLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    gl.enableVertexAttribArray(texCoordLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer)
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0)

    gl.uniform1i(this.imageLocation, 0)
    gl.uniform1i(this.blurredImageLocation, 1)
    gl.uniform1i(this.lumaLutLocation, 2)
    gl.uniform1i(this.redLutLocation, 3)
    gl.uniform1i(this.greenLutLocation, 4)
    gl.uniform1i(this.blueLutLocation, 5)
    gl.uniform1i(this.sharpnessBlurLocation, 6)
  }

  async loadImage(file: File): Promise<{
    width: number
    height: number
    downscaled: boolean
    originalWidth: number
    originalHeight: number
  }> {
    const url = URL.createObjectURL(file)

    try {
      const img = new Image()
      img.src = url

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load image'))
      })

      const { gl } = this
      const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number
      const working = computeWorkingDimensions(
        img.naturalWidth,
        img.naturalHeight,
        maxSize
      )

      let source: RasterImageSource = img
      if (working.scale < 1) {
        source = rasterizeImage(img, working.width, working.height)
      }

      this.disposeTextures()

      const texture = gl.createTexture()
      if (!texture) {
        throw new Error('Failed to create texture')
      }

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        source
      )
      assertNoGlError(gl, 'Failed to upload image texture')

      const blurredCanvas = createBlurredCanvas(source)
      const blurredTexture = gl.createTexture()
      if (!blurredTexture) {
        throw new Error('Failed to create blurred texture')
      }

      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, blurredTexture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        blurredCanvas
      )
      assertNoGlError(gl, 'Failed to upload blurred texture')

      const sharpnessBlurCanvas = createSharpnessBlurredCanvas(source)
      const sharpnessBlurTexture = gl.createTexture()
      if (!sharpnessBlurTexture) {
        throw new Error('Failed to create sharpness blur texture')
      }

      gl.activeTexture(gl.TEXTURE6)
      gl.bindTexture(gl.TEXTURE_2D, sharpnessBlurTexture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        sharpnessBlurCanvas
      )
      assertNoGlError(gl, 'Failed to upload sharpness blur texture')

      this.texture = texture
      this.blurredTexture = blurredTexture
      this.sharpnessBlurTexture = sharpnessBlurTexture
      this.imageWidth = working.width
      this.imageHeight = working.height
      this.canvas.width = this.imageWidth
      this.canvas.height = this.imageHeight

      return {
        width: this.imageWidth,
        height: this.imageHeight,
        downscaled: working.scale < 1,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
      }
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  render(adjustments: Adjustments) {
    if (!this.texture || !this.blurredTexture || !this.sharpnessBlurTexture) {
      return
    }

    const gpu = toGpuAdjustments(adjustments, this.imageWidth, this.imageHeight)
    const { gl } = this
    const { curves } = adjustments

    updateLutTexture(gl, this.lumaLutTexture, curves.luma)
    updateLutTexture(gl, this.redLutTexture, curves.red)
    updateLutTexture(gl, this.greenLutTexture, curves.green)
    updateLutTexture(gl, this.blueLutTexture, curves.blue)

    gl.viewport(0, 0, this.imageWidth, this.imageHeight)
    gl.useProgram(this.program)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.blurredTexture)
    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, this.lumaLutTexture)
    gl.activeTexture(gl.TEXTURE3)
    gl.bindTexture(gl.TEXTURE_2D, this.redLutTexture)
    gl.activeTexture(gl.TEXTURE4)
    gl.bindTexture(gl.TEXTURE_2D, this.greenLutTexture)
    gl.activeTexture(gl.TEXTURE5)
    gl.bindTexture(gl.TEXTURE_2D, this.blueLutTexture)
    gl.activeTexture(gl.TEXTURE6)
    gl.bindTexture(gl.TEXTURE_2D, this.sharpnessBlurTexture)
    gl.uniform1f(this.exposureLocation, gpu.exposure)
    gl.uniform1f(this.brightnessLocation, gpu.brightness)
    gl.uniform1f(this.contrastLocation, gpu.contrast)
    gl.uniform1f(this.highlightsLocation, gpu.highlights)
    gl.uniform1f(this.shadowsLocation, gpu.shadows)
    gl.uniform1f(this.whitesLocation, gpu.whites)
    gl.uniform1f(this.blacksLocation, gpu.blacks)
    gl.uniform1f(this.temperatureLocation, gpu.temperature)
    gl.uniform1f(this.tintLocation, gpu.tint)
    gl.uniform1f(this.vibranceLocation, gpu.vibrance)
    gl.uniform1f(this.saturationLocation, gpu.saturation)
    gl.uniform1fv(this.hslHueLocation, gpu.hslHue)
    gl.uniform1fv(this.hslSatLocation, gpu.hslSat)
    gl.uniform1fv(this.hslLumLocation, gpu.hslLum)
    gl.uniform1f(this.hslActiveLocation, gpu.hslActive)
    gl.uniform1f(this.vignetteAmountLocation, gpu.vignetteAmount)
    gl.uniform1f(this.vignetteMidpointLocation, gpu.vignetteMidpoint)
    gl.uniform1f(this.vignetteRoundnessLocation, gpu.vignetteRoundness)
    gl.uniform1f(this.vignetteFeatherLocation, gpu.vignetteFeather)
    gl.uniform1f(this.grainAmountLocation, gpu.grainAmount)
    gl.uniform1f(this.grainSizeLocation, gpu.grainSize)
    gl.uniform1f(this.grainRoughnessLocation, gpu.grainRoughness)
    gl.uniform1f(this.grainScaleLocation, gpu.grainScale)
    gl.uniform2f(this.imageSizeLocation, this.imageWidth, this.imageHeight)
    gl.uniform1f(this.sharpnessLocation, gpu.sharpness)
    gl.uniform1f(this.sharpnessThresholdLocation, gpu.sharpnessThreshold)
    gl.uniform1f(this.lumaNoiseReductionLocation, gpu.lumaNoiseReduction)
    gl.uniform1f(this.colorNoiseReductionLocation, gpu.colorNoiseReduction)
    gl.uniform1f(this.detailScaleLocation, gpu.detailScale)
    gl.uniform1f(
      this.rgbCurvesActiveLocation,
      isRgbCurveModeActive(adjustments) ? 1 : 0
    )
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  async exportBlob(
    adjustments: Adjustments,
    mimeType: string = 'image/png'
  ): Promise<Blob> {
    this.render(adjustments)

    const quality = mimeType === 'image/jpeg' ? 0.92 : undefined
    const blob = await new Promise<Blob | null>((resolve) => {
      this.canvas.toBlob(resolve, mimeType, quality)
    })

    if (!blob) {
      throw new Error('Failed to export image')
    }

    return blob
  }

  get hasImage() {
    return this.texture !== null
  }

  dispose() {
    this.disposeTextures()

    const { gl } = this
    gl.deleteTexture(this.lumaLutTexture)
    gl.deleteTexture(this.redLutTexture)
    gl.deleteTexture(this.greenLutTexture)
    gl.deleteTexture(this.blueLutTexture)
    gl.deleteBuffer(this.positionBuffer)
    gl.deleteBuffer(this.texCoordBuffer)
    gl.deleteProgram(this.program)
  }

  private disposeTextures() {
    if (this.texture) {
      this.gl.deleteTexture(this.texture)
      this.texture = null
    }

    if (this.blurredTexture) {
      this.gl.deleteTexture(this.blurredTexture)
      this.blurredTexture = null
    }

    if (this.sharpnessBlurTexture) {
      this.gl.deleteTexture(this.sharpnessBlurTexture)
      this.sharpnessBlurTexture = null
    }

    this.imageWidth = 0
    this.imageHeight = 0
  }
}
