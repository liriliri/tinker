import average from 'licia/average'
import clamp from 'licia/clamp'
import contain from 'licia/contain'
import map from 'licia/map'
import sortBy from 'licia/sortBy'
import type { BackgroundConfig } from '../types'

/** Rare pure green used as AI background key for edge flood-fill removal. */
const AI_CHROMA_KEY = {
  r: 0,
  g: 255,
  b: 0,
  hex: '#00FF00',
} as const

/**
 * Big Sur+ style recipe: craft + concept first, then canvas constraints.
 * Explicitly bans pre-baked squircle / backing plate.
 */
function buildOpaqueBackgroundHint(bg: BackgroundConfig) {
  if (bg.transparent) {
    return 'solid background edge-to-edge'
  }
  if (bg.useGradient) {
    return `background linear gradient from ${bg.color} to ${bg.gradientEnd} at ${bg.gradientAngle}deg edge-to-edge (match closely)`
  }
  return `solid background ${bg.color} edge-to-edge (match closely)`
}

const AI_ICON_CRAFT = [
  'Premium macOS / iOS app icon, Big Sur+ style',
  'visually delightful, memorable metaphor, charming personality — not generic or barren',
  'crisp vector geometry with a few witty signature details, balanced composition',
  'flat solid fills with clear color contrast; optional subtle one-direction wash only',
  'almost no shadow, max faint contact shade',
  'polished and distinctive, not clipart/plastic/noisy mush',
].join(', ')

const AI_ICON_OPAQUE_CONSTRAINTS = [
  'glyph drawn directly on background',
  'no backing plate/badge/sticker',
  'no text, no mockup, no UI chrome',
  'no pre-baked squircle',
  'App Store ready, centered',
].join(', ')

const AI_ICON_TRANSPARENT_CONSTRAINTS = [
  `single solid flat backdrop ${AI_CHROMA_KEY.hex} filling the whole canvas`,
  'freeform cutout mark (irregular silhouette ok)',
  'glyph floats directly on the green — no backing plate/badge/sticker/white pad',
  'no text, no mockup, no UI chrome',
  'no pre-baked squircle',
  'App Store ready, centered',
  `do not use ${AI_CHROMA_KEY.hex} inside the subject`,
].join(', ')

export function buildAiIconPrompt(
  userPrompt: string,
  transparentBg: boolean,
  background: BackgroundConfig
) {
  if (!transparentBg) {
    return [
      AI_ICON_CRAFT,
      userPrompt,
      `full-bleed 1024×1024 square canvas, ${buildOpaqueBackgroundHint(
        background
      )}`,
      AI_ICON_OPAQUE_CONSTRAINTS,
    ].join(', ')
  }
  return [AI_ICON_CRAFT, userPrompt, AI_ICON_TRANSPARENT_CONSTRAINTS].join(', ')
}

export function buildAiIconFileName(mimeType = 'image/png', forcePng = false) {
  const type = forcePng ? 'image/png' : mimeType
  const ext =
    contain(type, 'jpeg') || contain(type, 'jpg')
      ? 'jpg'
      : contain(type, 'webp')
      ? 'webp'
      : 'png'
  return `icon.${ext}`
}

const HARD_TOLERANCE = 55
const SOFT_TOLERANCE = 110
const FRINGE_PASSES = 3

function colorDist(
  r: number,
  g: number,
  b: number,
  keyR: number,
  keyG: number,
  keyB: number
) {
  const dr = r - keyR
  const dg = g - keyG
  const db = b - keyB
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

/** How strongly a pixel is "key green" vs its own RGB (handles AI-shifted greens). */
function greenDominance(r: number, g: number, b: number) {
  return g - Math.max(r, b)
}

function keyScore(
  r: number,
  g: number,
  b: number,
  keyR: number,
  keyG: number,
  keyB: number
) {
  const dist = colorDist(r, g, b, keyR, keyG, keyB)
  const distScore =
    dist <= HARD_TOLERANCE
      ? 1
      : dist >= SOFT_TOLERANCE
      ? 0
      : 1 - (dist - HARD_TOLERANCE) / (SOFT_TOLERANCE - HARD_TOLERANCE)

  // AI backgrounds are often #00cc00 / #33ff66 — catch by green excess.
  const excess = greenDominance(r, g, b)
  const keyExcess = Math.max(1, greenDominance(keyR, keyG, keyB))
  const excessRatio = clamp(excess / keyExcess, 0, 1.2)
  const excessScore =
    excess < 18
      ? 0
      : excess < 36
      ? (excess - 18) / 18
      : Math.min(1, excessRatio)

  return Math.max(distScore, excessScore * 0.92)
}

function median(values: number[]) {
  if (values.length === 0) return 0
  const sorted = sortBy(values, (value) => value)
  const mid = (sorted.length / 2) | 0
  return sorted.length % 2
    ? sorted[mid]
    : Math.round(average(sorted[mid - 1], sorted[mid]))
}

/** Sample border to recover the actual AI background (rarely pure #00FF00). */
function estimateKeyColor(
  data: Uint8ClampedArray,
  width: number,
  height: number
) {
  const samples: number[] = []

  const collect = (x: number, y: number) => {
    const i = (y * width + x) * 4
    if (greenDominance(data[i], data[i + 1], data[i + 2]) < 12) return
    samples.push(i)
  }

  const step = Math.max(1, Math.floor(Math.min(width, height) / 64))
  for (let x = 0; x < width; x += step) {
    collect(x, 0)
    collect(x, height - 1)
  }
  for (let y = step; y < height - 1; y += step) {
    collect(0, y)
    collect(width - 1, y)
  }

  if (samples.length < 8) {
    return { r: AI_CHROMA_KEY.r, g: AI_CHROMA_KEY.g, b: AI_CHROMA_KEY.b }
  }

  const channel = (offset: number) =>
    median(map(samples, (i) => data[i + offset]))
  return { r: channel(0), g: channel(1), b: channel(2) }
}

function despillPixel(
  data: Uint8ClampedArray,
  i: number,
  keyR: number,
  keyG: number,
  keyB: number
) {
  const r = data[i]
  const g = data[i + 1]
  const b = data[i + 2]
  const maxRb = Math.max(r, b)
  const excess = g - maxRb
  if (excess <= 0) return

  // Pull green toward non-green channels; bias by key purity.
  const keyPull = clamp(greenDominance(keyR, keyG, keyB) / 255, 0.35, 1)
  data[i + 1] = clamp(Math.round(g - excess * keyPull), 0, 255)

  // Neutralize leftover key tint on R/B toward local luminance.
  const tint = Math.min(r, b, data[i + 1])
  if (keyR <= keyB) {
    data[i] = clamp(Math.round(r * 0.65 + tint * 0.35), 0, 255)
  } else {
    data[i + 2] = clamp(Math.round(b * 0.65 + tint * 0.35), 0, 255)
  }
}

/**
 * Remove chroma-key background connected to image edges (outside-in).
 * Softens boundary pixels for cleaner alpha.
 */
function removeChromaKeyFromEdges(imageData: ImageData): number {
  const { width, height, data } = imageData
  const total = width * height
  const estimated = estimateKeyColor(data, width, height)
  const keyR = estimated.r
  const keyG = estimated.g
  const keyB = estimated.b

  const visited = new Uint8Array(total)
  const queue = new Int32Array(total)
  let head = 0
  let tail = 0
  let removed = 0

  const enqueue = (x: number, y: number, minScore = 0.02) => {
    const idx = y * width + x
    if (visited[idx]) return
    const i = idx * 4
    const score = keyScore(data[i], data[i + 1], data[i + 2], keyR, keyG, keyB)
    if (score <= minScore) return
    visited[idx] = 1
    queue[tail++] = idx
  }

  for (let x = 0; x < width; x++) {
    enqueue(x, 0)
    enqueue(x, height - 1)
  }
  for (let y = 1; y < height - 1; y++) {
    enqueue(0, y)
    enqueue(width - 1, y)
  }

  const floodFromQueue = (minNeighborScore = 0.02) => {
    while (head < tail) {
      const idx = queue[head++]
      const i = idx * 4
      const score = keyScore(
        data[i],
        data[i + 1],
        data[i + 2],
        keyR,
        keyG,
        keyB
      )
      if (score <= 0) continue

      if (score >= 0.72) {
        data[i + 3] = 0
        removed++
      } else {
        data[i + 3] = Math.round(data[i + 3] * (1 - score))
        if (data[i + 3] < 12) {
          data[i + 3] = 0
          removed++
        } else {
          despillPixel(data, i, keyR, keyG, keyB)
        }
      }

      const x = idx % width
      const y = (idx / width) | 0
      if (x > 0) enqueue(x - 1, y, minNeighborScore)
      if (x < width - 1) enqueue(x + 1, y, minNeighborScore)
      if (y > 0) enqueue(x, y - 1, minNeighborScore)
      if (y < height - 1) enqueue(x, y + 1, minNeighborScore)
    }
  }

  floodFromQueue(0.02)

  // Clear enclosed key pockets (e.g. donut holes) that never touch the border.
  for (let idx = 0; idx < total; idx++) {
    if (visited[idx]) continue
    const i = idx * 4
    if (data[i + 3] === 0) continue
    if (keyScore(data[i], data[i + 1], data[i + 2], keyR, keyG, keyB) < 0.85)
      continue
    visited[idx] = 1
    queue[tail++] = idx
    floodFromQueue(0.15)
  }

  // Multi-pass fringe cleanup: eat leftover green halo around the cutout.
  for (let pass = 0; pass < FRINGE_PASSES; pass++) {
    const doomed: number[] = []
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x
        const i = idx * 4
        if (data[i + 3] === 0) continue

        let transparentNeighbors = 0
        if (x > 0 && data[(idx - 1) * 4 + 3] === 0) transparentNeighbors++
        if (x < width - 1 && data[(idx + 1) * 4 + 3] === 0)
          transparentNeighbors++
        if (y > 0 && data[(idx - width) * 4 + 3] === 0) transparentNeighbors++
        if (y < height - 1 && data[(idx + width) * 4 + 3] === 0)
          transparentNeighbors++
        if (transparentNeighbors === 0) continue

        const score = keyScore(
          data[i],
          data[i + 1],
          data[i + 2],
          keyR,
          keyG,
          keyB
        )
        const excess = greenDominance(data[i], data[i + 1], data[i + 2])

        // Strong key / many transparent neighbors → drop entirely.
        if (score >= 0.28 || (excess >= 20 && transparentNeighbors >= 2)) {
          doomed.push(idx)
          continue
        }

        if (score > 0 || excess > 8) {
          const fade = Math.max(score, clamp(excess / 48, 0, 1))
          data[i + 3] = Math.round(
            data[i + 3] * (1 - fade) * (1 - transparentNeighbors * 0.12)
          )
          despillPixel(data, i, keyR, keyG, keyB)
          if (data[i + 3] < 18) doomed.push(idx)
        } else {
          despillPixel(data, i, keyR, keyG, keyB)
        }
      }
    }

    for (const idx of doomed) {
      const i = idx * 4
      if (data[i + 3] === 0) continue
      data[i + 3] = 0
      removed++
    }
  }

  // Models often wrap the subject in a white/off-white plate after the green.
  removed += removePaperPlate(data, width, height)

  smoothAlphaMatte(data, width, height, keyR, keyG, keyB)

  return removed
}

/** Bright, low-chroma pixels typical of AI "white sticker pad" plates. */
function paperScore(r: number, g: number, b: number) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const chroma = max - min
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b

  // Soft light-gray pads (still plate-like, not subject color).
  if (lum >= 175 && chroma <= 28) {
    const lumScore = clamp((lum - 175) / 70, 0, 1)
    const chromaScore = 1 - chroma / 28
    return lumScore * 0.55 + chromaScore * 0.45
  }

  // Near-white / cream.
  if (lum >= 210 && chroma <= 45) {
    const lumScore = clamp((lum - 210) / 45, 0, 1)
    const chromaScore = 1 - chroma / 45
    return Math.min(1, lumScore * 0.5 + chromaScore * 0.5 + 0.15)
  }

  return 0
}

/**
 * After green keying, flood from transparent exterior into connected white /
 * off-white plates so the freeform subject is left without a paper pad.
 */
function removePaperPlate(
  data: Uint8ClampedArray,
  width: number,
  height: number
) {
  const total = width * height
  const visited = new Uint8Array(total)
  const queue = new Int32Array(total)
  let head = 0
  let tail = 0
  let removed = 0

  const tryEnqueue = (idx: number) => {
    if (visited[idx]) return
    const i = idx * 4
    if (data[i + 3] === 0) {
      visited[idx] = 1
      queue[tail++] = idx
      return
    }
    const score = paperScore(data[i], data[i + 1], data[i + 2])
    if (score < 0.35) return
    visited[idx] = 1
    queue[tail++] = idx
  }

  // Seed from current holes (already keyed green) and image border.
  for (let idx = 0; idx < total; idx++) {
    if (data[idx * 4 + 3] === 0) tryEnqueue(idx)
  }
  for (let x = 0; x < width; x++) {
    tryEnqueue(x)
    tryEnqueue((height - 1) * width + x)
  }
  for (let y = 1; y < height - 1; y++) {
    tryEnqueue(y * width)
    tryEnqueue(y * width + width - 1)
  }

  while (head < tail) {
    const idx = queue[head++]
    const i = idx * 4
    const x = idx % width
    const y = (idx / width) | 0

    if (data[i + 3] > 0) {
      const score = paperScore(data[i], data[i + 1], data[i + 2])
      if (score >= 0.55) {
        data[i + 3] = 0
        removed++
      } else if (score >= 0.35) {
        data[i + 3] = Math.round(data[i + 3] * (1 - score))
        if (data[i + 3] < 20) {
          data[i + 3] = 0
          removed++
        }
      }
    }

    if (x > 0) tryEnqueue(idx - 1)
    if (x < width - 1) tryEnqueue(idx + 1)
    if (y > 0) tryEnqueue(idx - width)
    if (y < height - 1) tryEnqueue(idx + width)
  }

  // Extra fringe pass: light pads touching transparency.
  for (let pass = 0; pass < 2; pass++) {
    const doomed: number[] = []
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x
        const i = idx * 4
        if (data[i + 3] === 0) continue

        let nearClear = false
        if (x > 0 && data[(idx - 1) * 4 + 3] < 16) nearClear = true
        else if (x < width - 1 && data[(idx + 1) * 4 + 3] < 16) nearClear = true
        else if (y > 0 && data[(idx - width) * 4 + 3] < 16) nearClear = true
        else if (y < height - 1 && data[(idx + width) * 4 + 3] < 16)
          nearClear = true
        if (!nearClear) continue

        const score = paperScore(data[i], data[i + 1], data[i + 2])
        if (score < 0.3) continue
        if (score >= 0.45) {
          doomed.push(idx)
        } else {
          data[i + 3] = Math.round(data[i + 3] * (1 - score * 0.9))
          if (data[i + 3] < 24) doomed.push(idx)
        }
      }
    }
    for (const idx of doomed) {
      const i = idx * 4
      if (data[i + 3] === 0) continue
      data[i + 3] = 0
      removed++
    }
  }

  return removed
}

function copyAlpha(data: Uint8ClampedArray, total: number) {
  const alpha = new Float32Array(total)
  for (let i = 0; i < total; i++) alpha[i] = data[i * 4 + 3]
  return alpha
}

function writeAlpha(data: Uint8ClampedArray, alpha: Float32Array) {
  for (let i = 0; i < alpha.length; i++) {
    data[i * 4 + 3] = clamp(Math.round(alpha[i]), 0, 255)
  }
}

/** 3x3 min (erode) / max (dilate) on alpha — kills 1px spikes and fills pinholes. */
function morphAlpha(
  src: Float32Array,
  width: number,
  height: number,
  mode: 'erode' | 'dilate'
) {
  const dst = new Float32Array(src.length)
  const isErode = mode === 'erode'
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let value = isErode ? 255 : 0
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy
        if (yy < 0 || yy >= height) continue
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx
          if (xx < 0 || xx >= width) continue
          const sample = src[yy * width + xx]
          value = isErode ? Math.min(value, sample) : Math.max(value, sample)
        }
      }
      dst[y * width + x] = value
    }
  }
  return dst
}

/** Separable Gaussian blur (approx σ≈1.1) on alpha for anti-aliased edges. */
function blurAlpha(src: Float32Array, width: number, height: number) {
  // kernel: [1, 4, 6, 4, 1] / 16
  const tmp = new Float32Array(src.length)
  const dst = new Float32Array(src.length)

  for (let y = 0; y < height; y++) {
    const row = y * width
    for (let x = 0; x < width; x++) {
      const x0 = x > 1 ? x - 2 : 0
      const x1 = x > 0 ? x - 1 : 0
      const x3 = x < width - 1 ? x + 1 : width - 1
      const x4 = x < width - 2 ? x + 2 : width - 1
      tmp[row + x] =
        (src[row + x0] +
          src[row + x1] * 4 +
          src[row + x] * 6 +
          src[row + x3] * 4 +
          src[row + x4]) /
        16
    }
  }

  for (let y = 0; y < height; y++) {
    const y0 = y > 1 ? y - 2 : 0
    const y1 = y > 0 ? y - 1 : 0
    const y3 = y < height - 1 ? y + 1 : height - 1
    const y4 = y < height - 2 ? y + 2 : height - 1
    for (let x = 0; x < width; x++) {
      dst[y * width + x] =
        (tmp[y0 * width + x] +
          tmp[y1 * width + x] * 4 +
          tmp[y * width + x] * 6 +
          tmp[y3 * width + x] * 4 +
          tmp[y4 * width + x]) /
        16
    }
  }

  return dst
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/**
 * Post-process matte: morphological open/close → Gaussian feather → contrast
 * remap. Removes spikes while keeping a soft anti-aliased outline.
 */
function smoothAlphaMatte(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  keyR: number,
  keyG: number,
  keyB: number
) {
  let alpha = copyAlpha(data, width * height)

  // Opening: drop thin spikes sticking out of the silhouette.
  alpha = morphAlpha(alpha, width, height, 'erode')
  alpha = morphAlpha(alpha, width, height, 'dilate')

  // Closing: fill tiny edge notches that read as jaggies.
  alpha = morphAlpha(alpha, width, height, 'dilate')
  alpha = morphAlpha(alpha, width, height, 'erode')

  // Feather then re-harden slightly so edges stay crisp but anti-aliased.
  alpha = blurAlpha(alpha, width, height)
  alpha = blurAlpha(alpha, width, height)

  for (let i = 0; i < alpha.length; i++) {
    // Bias low to pull back residual green fringe; keep mid band for AA.
    alpha[i] = smoothstep(0.18, 0.82, alpha[i] / 255) * 255
  }

  writeAlpha(data, alpha)

  // Final despill only on the soft fringe.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      const i = idx * 4
      const a = data[i + 3]
      if (a === 0 || a === 255) continue

      let nearHole = false
      if (x > 0 && data[(idx - 1) * 4 + 3] < 40) nearHole = true
      else if (x < width - 1 && data[(idx + 1) * 4 + 3] < 40) nearHole = true
      else if (y > 0 && data[(idx - width) * 4 + 3] < 40) nearHole = true
      else if (y < height - 1 && data[(idx + width) * 4 + 3] < 40)
        nearHole = true
      if (!nearHole) continue

      despillPixel(data, i, keyR, keyG, keyB)
    }
  }
}

export async function chromaKeyImageFile(
  file: File,
  fileName = 'ai-icon.png'
): Promise<File> {
  const bitmap = await createImageBitmap(file)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('Failed to create canvas context')

    ctx.drawImage(bitmap, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const removed = removeChromaKeyFromEdges(imageData)
    const ratio = removed / (canvas.width * canvas.height)

    // Keep original when key clearly failed (almost nothing / almost everything).
    if (ratio < 0.02 || ratio > 0.97) {
      return file
    }

    ctx.putImageData(imageData, 0, 0)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result)
        else reject(new Error('Failed to encode PNG'))
      }, 'image/png')
    })
    return new File([blob], fileName, { type: 'image/png' })
  } finally {
    bitmap.close()
  }
}
