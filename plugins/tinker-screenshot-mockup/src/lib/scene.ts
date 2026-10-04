import { Frame, Group, Image, Rect, Ellipse } from 'leafer-ui'
import clamp from 'licia/clamp'
import find from 'licia/find'
import max from 'licia/max'
import min from 'licia/min'
import { getDevice } from './devices'
import { leaferGradientFill } from './gradients'
import type {
  BackgroundConfig,
  CanvasSize,
  DeviceMeta,
  SceneObject,
} from '../types'

const CHECKER_LIGHT = '#808080'
const CHECKER_DARK = '#666666'
const checkerboardCache = new Map<string, string>()

const MIN_VISIBLE_RATIO = 0.3

const PHONE = {
  metal: '#76726f',
  metalDark: '#5c5956',
  metalLight: '#e8e6e4',
  panel: '#010101',
}

const TABLET = {
  metal: '#83878a',
  metalDark: '#6e7275',
  panel: '#0d0d0d',
}

const LAPTOP = {
  frameW: 618,
  frameH: 418,
  metal: '#83878a',
  metalDark: '#75797c',
  metalShadow: '#3a3d3f',
  notch: '#9a9ea1',
  panel: '#0d0d0d',
  chin: '#262626',
}

function deviceDisplaySize(
  device: DeviceMeta,
  canvas: CanvasSize,
  scale: number
) {
  const maxW = canvas.width * 0.7
  const maxH = canvas.height * 0.85
  const fit = min(maxW / device.width, maxH / device.height)
  return {
    displayW: device.width * fit * scale,
    displayH: device.height * fit * scale,
  }
}

/** Keep at least MIN_VISIBLE_RATIO of the device overlapping the artboard. */
export function clampCenterToCanvas(
  cx: number,
  cy: number,
  displayW: number,
  displayH: number,
  canvasW: number,
  canvasH: number
) {
  const minOverlapW = min(displayW * MIN_VISIBLE_RATIO, canvasW)
  const minOverlapH = min(displayH * MIN_VISIBLE_RATIO, canvasH)
  return {
    x: clamp(
      cx,
      minOverlapW - displayW / 2,
      canvasW - minOverlapW + displayW / 2
    ),
    y: clamp(
      cy,
      minOverlapH - displayH / 2,
      canvasH - minOverlapH + displayH / 2
    ),
  }
}

const CAMERA_LENS_FILL = {
  type: 'radial' as const,
  from: 'top-left' as const,
  to: 'bottom-right' as const,
  stops: [
    { offset: 0, color: '#6074bf' },
    { offset: 0.4, color: '#24555e' },
    { offset: 1, color: '#513785' },
  ],
}

type RectProps = NonNullable<ConstructorParameters<typeof Rect>[0]>

function artboardRect(canvas: CanvasSize, props: RectProps) {
  return new Rect({
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height,
    draggable: false,
    editable: false,
    ...props,
  })
}

function buildBackground(bg: BackgroundConfig, canvas: CanvasSize) {
  if (bg.type === 'solid' || (bg.type === 'image' && !bg.imageUrl)) {
    return artboardRect(canvas, { id: 'background', fill: bg.solidColor })
  }

  if (bg.type === 'transparent') {
    const key = `${canvas.width}x${canvas.height}`
    let url = checkerboardCache.get(key)
    if (!url) {
      const board = document.createElement('canvas')
      board.width = canvas.width
      board.height = canvas.height
      const ctx = board.getContext('2d')
      if (ctx) {
        const size = 20
        for (let y = 0; y < canvas.height; y += size) {
          for (let x = 0; x < canvas.width; x += size) {
            const odd = ((x / size) | 0) + ((y / size) | 0)
            ctx.fillStyle = odd % 2 === 0 ? CHECKER_LIGHT : CHECKER_DARK
            ctx.fillRect(x, y, size, size)
          }
        }
      }
      url = board.toDataURL('image/png')
      checkerboardCache.set(key, url)
    }
    return new Image({
      id: 'checkerboard',
      url,
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
      draggable: false,
      editable: false,
    })
  }

  if (bg.type === 'image' && bg.imageUrl) {
    return artboardRect(canvas, {
      id: 'background',
      fill: {
        type: 'image',
        url: bg.imageUrl,
        mode: 'cover',
        align: 'center',
      },
    })
  }

  return artboardRect(canvas, {
    id: 'background',
    fill: leaferGradientFill(
      bg.gradientAngle,
      bg.gradientColors,
      canvas.width,
      canvas.height
    ),
  })
}

function findChildById(frame: Frame, id: string) {
  const children = frame.children
  if (!children) return undefined
  return find(children, (child) => child.id === id) as Rect | undefined
}

export function applyGradientBackground(
  frame: Frame,
  bg: BackgroundConfig,
  canvas: CanvasSize
) {
  const rect = findChildById(frame, 'background')
  if (!rect) return false
  rect.width = canvas.width
  rect.height = canvas.height
  rect.fill = leaferGradientFill(
    bg.gradientAngle,
    bg.gradientColors,
    canvas.width,
    canvas.height
  )
  return true
}

function deviceShadow(obj: SceneObject, size: number) {
  if (!obj.shadow.enabled) return undefined
  const scale = max(0.5, size / 400)
  return {
    x: obj.shadow.offsetX * scale,
    y: obj.shadow.offsetY * scale,
    blur: obj.shadow.blur * scale,
    color: obj.shadow.color,
    box: true as const,
  }
}

function addRect(group: Group, props: RectProps) {
  group.add(
    new Rect({
      draggable: false,
      editable: false,
      ...props,
    })
  )
}

function addEllipse(
  group: Group,
  props: NonNullable<ConstructorParameters<typeof Ellipse>[0]>
) {
  group.add(
    new Ellipse({
      draggable: false,
      editable: false,
      ...props,
    })
  )
}

function addScreenshot(
  parent: Frame | Group,
  url: string | null,
  x: number,
  y: number,
  width: number,
  height: number,
  cornerRadius: number | number[],
  shadow?: ReturnType<typeof deviceShadow>
) {
  const screen = new Frame({
    x,
    y,
    width,
    height,
    overflow: 'hide',
    cornerRadius,
    fill: '#010101',
    shadow,
    draggable: false,
    editable: false,
  })
  if (url) {
    screen.add(
      new Rect({
        width,
        height,
        fill: {
          type: 'image',
          url,
          mode: 'cover',
          align: 'center',
        },
        draggable: false,
        editable: false,
      })
    )
  }
  parent.add(screen)
}

function newGroup(obj: SceneObject, w: number, h: number) {
  return new Group({
    id: obj.id,
    width: w,
    height: h,
    rotation: obj.rotation,
    around: 'center',
    draggable: true,
    editable: true,
  })
}

function buildPhone(obj: SceneObject, w: number, h: number): Group {
  const k = w / (getDevice('phone')?.width || 1)
  const group = newGroup(obj, w, h)

  if (obj.frameStyle === 'none') {
    addScreenshot(
      group,
      obj.screenshotUrl,
      0,
      0,
      w,
      h,
      obj.borderRadius,
      deviceShadow(obj, min(w, h))
    )
    return group
  }

  addRect(group, {
    x: -2 * k,
    y: 115 * k,
    width: 3 * k,
    height: 32 * k,
    cornerRadius: 2 * k,
    fill: PHONE.metalDark,
  })
  addRect(group, {
    x: -2 * k,
    y: 175 * k,
    width: 3 * k,
    height: 62 * k,
    cornerRadius: 2 * k,
    fill: PHONE.metalDark,
  })
  addRect(group, {
    x: -2 * k,
    y: 255 * k,
    width: 3 * k,
    height: 62 * k,
    cornerRadius: 2 * k,
    fill: PHONE.metalDark,
  })
  addRect(group, {
    x: w - k,
    y: 200 * k,
    width: 3 * k,
    height: 100 * k,
    cornerRadius: 2 * k,
    fill: PHONE.metalDark,
  })

  addRect(group, {
    width: w,
    height: h,
    cornerRadius: 68 * k,
    fill: PHONE.metal,
    stroke: PHONE.metalDark,
    strokeWidth: max(1, k),
    innerShadow: {
      x: 0,
      y: 0,
      blur: 4 * k,
      spread: 2 * k,
      color: PHONE.metalLight,
    },
    shadow: deviceShadow(obj, min(w, h)),
  })
  addRect(group, {
    x: 7 * k,
    y: 7 * k,
    width: w - 14 * k,
    height: h - 14 * k,
    cornerRadius: 61 * k,
    fill: PHONE.panel,
  })

  const stripe = 7 * k
  for (const y of [85 * k, h - 92 * k]) {
    addRect(group, {
      x: 0,
      y,
      width: stripe,
      height: stripe,
      fill: 'rgba(1,1,1,0.25)',
    })
    addRect(group, {
      x: w - stripe,
      y,
      width: stripe,
      height: stripe,
      fill: 'rgba(1,1,1,0.25)',
    })
  }
  addRect(group, {
    x: w - 92 * k,
    y: 0,
    width: 6 * k,
    height: 6 * k,
    fill: 'rgba(1,1,1,0.25)',
  })
  addRect(group, {
    x: 86 * k,
    y: h - 6 * k,
    width: 6 * k,
    height: 6 * k,
    fill: 'rgba(1,1,1,0.25)',
  })

  addScreenshot(
    group,
    obj.screenshotUrl,
    19 * k,
    19 * k,
    390 * k,
    830 * k,
    49 * k
  )

  addRect(group, {
    x: w / 2 - 60 * k,
    y: 29 * k,
    width: 120 * k,
    height: 35 * k,
    cornerRadius: 20 * k,
    fill: PHONE.panel,
  })
  addRect(group, {
    x: w / 2 - 60 * k,
    y: 30 * k,
    width: 74 * k,
    height: 33 * k,
    cornerRadius: 17 * k,
    fill: PHONE.panel,
  })
  addEllipse(group, {
    x: w / 2 + 36 * k - 4.5 * k,
    y: 42 * k,
    width: 9 * k,
    height: 9 * k,
    fill: CAMERA_LENS_FILL,
  })

  return group
}

function buildTablet(obj: SceneObject, w: number, h: number): Group {
  const k = w / (getDevice('tablet')?.width || 1)
  const group = newGroup(obj, w, h)

  if (obj.frameStyle === 'none') {
    addScreenshot(
      group,
      obj.screenshotUrl,
      0,
      0,
      w,
      h,
      obj.borderRadius,
      deviceShadow(obj, min(w, h))
    )
    return group
  }

  addRect(group, {
    x: w - 42 * k,
    y: -2 * k,
    width: 36 * k,
    height: 2 * k,
    fill: TABLET.metalDark,
  })
  addRect(group, {
    x: w - k,
    y: 63 * k,
    width: 2 * k,
    height: 32 * k,
    fill: TABLET.metalDark,
  })
  addRect(group, {
    x: w - k,
    y: 100 * k,
    width: 2 * k,
    height: 32 * k,
    fill: TABLET.metalDark,
  })

  addRect(group, {
    width: w,
    height: h,
    cornerRadius: 36 * k,
    fill: TABLET.metal,
    innerShadow: {
      x: 0,
      y: 0,
      blur: 1 * k,
      spread: 3 * k,
      color: TABLET.metal,
    },
    shadow: deviceShadow(obj, min(w, h)),
  })
  addRect(group, {
    x: 4 * k,
    y: 4 * k,
    width: w - 8 * k,
    height: h - 8 * k,
    cornerRadius: 32 * k,
    fill: TABLET.panel,
    stroke: TABLET.metalDark,
    strokeWidth: max(1, k),
    strokeAlign: 'outside',
  })

  addScreenshot(
    group,
    obj.screenshotUrl,
    27 * k,
    27 * k,
    506 * k,
    724 * k,
    11 * k
  )

  const sensorY = 12 * k
  const sensor = 10 * k
  for (const x of [w / 2 - 50 * k, w / 2 - 30 * k, w / 2 + 40 * k]) {
    addEllipse(group, {
      x,
      y: sensorY,
      width: sensor,
      height: sensor,
      fill: '#1a1a1a',
    })
  }
  addEllipse(group, {
    x: w / 2 - 3 * k,
    y: 14 * k,
    width: 6 * k,
    height: 6 * k,
    fill: CAMERA_LENS_FILL,
  })

  return group
}

function buildPc(obj: SceneObject, w: number, h: number): Group {
  const k = w / (getDevice('pc')?.width || 1)
  const group = newGroup(obj, w, h)

  if (obj.frameStyle === 'none') {
    addScreenshot(
      group,
      obj.screenshotUrl,
      0,
      0,
      w,
      h * 0.92,
      obj.borderRadius,
      deviceShadow(obj, min(w, h))
    )
    return group
  }

  const frameW = LAPTOP.frameW * k
  const frameH = LAPTOP.frameH * k
  const frameX = (w - frameW) / 2

  addRect(group, {
    x: frameX,
    y: 0,
    width: frameW,
    height: frameH,
    cornerRadius: 20 * k,
    fill: LAPTOP.panel,
    stroke: LAPTOP.metalDark,
    strokeWidth: 2 * k,
    shadow: deviceShadow(obj, min(w, h)),
  })
  addRect(group, {
    x: frameX + 2 * k,
    y: frameH - 26 * k,
    width: frameW - 4 * k,
    height: 24 * k,
    cornerRadius: [0, 0, 20 * k, 20 * k],
    fill: {
      type: 'linear',
      from: 'top',
      to: 'bottom',
      stops: [
        { offset: 0, color: LAPTOP.chin },
        { offset: 1, color: LAPTOP.panel },
      ],
    },
  })

  addScreenshot(
    group,
    obj.screenshotUrl,
    frameX + 9 * k,
    9 * k,
    600 * k,
    375 * k,
    [10 * k, 10 * k, 0, 0]
  )

  addRect(group, {
    x: frameX + frameW / 2 - 32 * k,
    y: 11 * k,
    width: 64 * k,
    height: 12 * k,
    cornerRadius: [0, 0, 4 * k, 4 * k],
    fill: LAPTOP.panel,
  })

  addRect(group, {
    x: 0,
    y: frameH - 10 * k,
    width: w,
    height: 24 * k,
    cornerRadius: [2 * k, 2 * k, 12 * k, 12 * k],
    fill: {
      type: 'radial',
      from: 'center',
      to: 'bottom',
      stops: [
        { offset: 0, color: LAPTOP.metal },
        { offset: 0.85, color: LAPTOP.metal },
        { offset: 1, color: LAPTOP.metalDark },
      ],
    },
    stroke: '#4e5254',
    strokeWidth: max(1, k),
    innerShadow: {
      x: 0,
      y: -2 * k,
      blur: 8 * k,
      color: LAPTOP.metalShadow,
    },
  })
  addRect(group, {
    x: w / 2 - 60 * k,
    y: frameH - 10 * k,
    width: 120 * k,
    height: 10 * k,
    cornerRadius: [0, 0, 10 * k, 10 * k],
    fill: LAPTOP.notch,
    innerShadow: {
      x: 0,
      y: 0,
      blur: 4 * k,
      spread: 2 * k,
      color: LAPTOP.metalDark,
    },
  })

  return group
}

function buildDevice(obj: SceneObject, displayW: number, displayH: number) {
  switch (obj.deviceId) {
    case 'tablet':
      return buildTablet(obj, displayW, displayH)
    case 'pc':
      return buildPc(obj, displayW, displayH)
    case 'phone':
    default:
      return buildPhone(obj, displayW, displayH)
  }
}

function buildDeviceGroups(canvas: CanvasSize, objects: SceneObject[]) {
  const groups: Group[] = []
  for (const obj of objects) {
    const device = getDevice(obj.deviceId)
    if (!device) continue

    const { displayW, displayH } = deviceDisplaySize(device, canvas, obj.scale)
    const group = buildDevice(obj, displayW, displayH)
    const pos = clampCenterToCanvas(
      (obj.x / 100) * canvas.width,
      (obj.y / 100) * canvas.height,
      displayW,
      displayH,
      canvas.width,
      canvas.height
    )
    group.x = pos.x
    group.y = pos.y
    groups.push(group)
  }
  return groups
}

export function prepareScene(
  canvas: CanvasSize,
  background: BackgroundConfig,
  objects: SceneObject[]
) {
  return {
    bgNode: buildBackground(background, canvas),
    groups: buildDeviceGroups(canvas, objects),
  }
}

export function applyScene(
  frame: Frame,
  canvas: CanvasSize,
  background: BackgroundConfig,
  prepared: { bgNode: Rect | Image; groups: Group[] }
) {
  frame.width = canvas.width
  frame.height = canvas.height
  frame.fill = background.type === 'transparent' ? 'transparent' : undefined
  frame.clear()
  frame.add(prepared.bgNode)
  for (const group of prepared.groups) {
    frame.add(group)
  }
}
