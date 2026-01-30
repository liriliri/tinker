const calculateRotatedRectDimensions = (
  width: number,
  height: number,
  angleDegrees: number
) => {
  const angleRadians = (angleDegrees * Math.PI) / 180
  const newWidth =
    Math.abs(width * Math.cos(angleRadians)) +
    Math.abs(height * Math.sin(angleRadians))
  const newHeight =
    Math.abs(width * Math.sin(angleRadians)) +
    Math.abs(height * Math.cos(angleRadians))

  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight),
  }
}

const svgToDataUrl = (svgStr: string) => {
  const encoded = encodeURIComponent(svgStr)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22')
  return `data:image/svg+xml,${encoded}`
}

export const textToSvg = ({
  text,
  color,
  angleDegrees,
  fontSize,
}: {
  text: string
  color: string
  angleDegrees: number
  fontSize: number
}) => {
  if (typeof document === 'undefined' || !document.body) return null

  const div = document.createElement('div')
  div.style.cssText =
    'text-align:center;white-space:nowrap;line-height:100px;' +
    `transform: rotate(${angleDegrees}deg);` +
    'position:absolute;top:0;left:0;opacity:0;pointer-events:none;'

  const span = document.createElement('span')
  span.style.color = color
  span.style.fontSize = `${fontSize}px`
  span.style.fontFamily = 'sans-serif'
  span.textContent = text

  div.append(span)
  document.body.append(div)
  const { width, height } = div.getBoundingClientRect()
  document.body.removeChild(div)

  const result = calculateRotatedRectDimensions(width, height, angleDegrees)
  const divHtml = `
    <div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;white-space:nowrap;line-height:${result.height}px;transform:rotate(${angleDegrees}deg);">
      <span style="color:${color};font-size:${fontSize}px;font-family:sans-serif;">${text}</span>
    </div>
  `

  const data = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${result.width} ${result.height}" width="${result.width}" height="${result.height}">
    <foreignObject width="100%" height="100%">
      ${divHtml}
    </foreignObject>
  </svg>`

  return svgToDataUrl(data)
}
