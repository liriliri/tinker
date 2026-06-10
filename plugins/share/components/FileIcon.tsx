import { useState, useEffect } from 'react'
import evalCss from 'licia/evalCss'
import splitPath from 'licia/splitPath'
import iconTheme from '../assets/vs-seti-icon-theme.json'
import { LANGUAGE_MAP } from '../lib/fileType'
import { getFileIcon } from '../lib/util'

interface SetiIconTheme {
  iconDefinitions: Record<string, { fontCharacter: string; fontColor?: string }>
  fileExtensions: Record<string, string>
  fileNames: Record<string, string>
  languageIds: Record<string, string>
}

const { iconDefinitions, fileExtensions, fileNames, languageIds } =
  iconTheme as SetiIconTheme

const woffUrl = new URL('../assets/seti.woff', import.meta.url).href

const darkDefs: Record<
  string,
  { char: string; darkColor: string; lightColor?: string }
> = {}
for (const [key, def] of Object.entries(iconDefinitions)) {
  if (key.endsWith('_light')) continue
  const lightDef = iconDefinitions[key + '_light']
  darkDefs[key] = {
    char: def.fontCharacter,
    darkColor: def.fontColor ?? 'currentColor',
    lightColor: lightDef?.fontColor,
  }
}

evalCss(
  [
    `@font-face{font-family:seti;src:url(${woffUrl}) format("woff");font-weight:normal;font-style:normal;}`,
    `.seti-icon{font-family:seti;display:inline-block;text-align:center;}`,
    ...Object.entries(darkDefs).flatMap(([key, def]) => {
      const rules = [
        `.seti-icon-${key}::before{content:"${def.char}";color:${def.darkColor};}`,
      ]
      if (def.lightColor) {
        rules.push(
          `.seti--light .seti-icon-${key}::before{color:${def.lightColor};}`
        )
      }
      return rules
    }),
  ].join('\n')
)

function resolveIconKey(name: string): string | null {
  const lower = name.toLowerCase()
  if (lower in fileNames) return fileNames[lower]

  const { ext } = splitPath(name)
  const candidates = [
    ext ? ext.slice(1).toLowerCase() : '',
    lower.startsWith('.') ? lower.slice(1) : '',
  ].filter(Boolean)

  for (const key of candidates) {
    if (key in fileExtensions) return fileExtensions[key]
    const langId = LANGUAGE_MAP[key]
    if (langId && langId in languageIds) return languageIds[langId]
  }
  return null
}

export interface FileIconProps {
  name: string
  path?: string
  isDark: boolean
  size?: number
  className?: string
}

export default function FileIcon({
  name,
  path,
  isDark,
  size = 16,
  className,
}: FileIconProps) {
  const key = resolveIconKey(name)
  if (key) {
    return (
      <span
        className={`seti-icon seti-icon-${key} ${isDark ? '' : 'seti--light'} ${
          className || ''
        }`}
        style={{
          fontSize: size,
          width: size,
          height: size,
          lineHeight: `${size}px`,
        }}
      />
    )
  }
  return <NativeIcon path={path || name} size={size} className={className} />
}

function NativeIcon({
  path,
  size,
  className,
}: {
  path: string
  size: number
  className?: string
}) {
  const [icon, setIcon] = useState('')
  useEffect(() => {
    getFileIcon(path).then((i) => i && setIcon(i))
  }, [path])

  const style = { width: size, height: size }
  if (icon) {
    return <img src={icon} alt="" className={className || ''} style={style} />
  }
  return (
    <span
      className={className || ''}
      style={{ ...style, display: 'inline-block' }}
    />
  )
}
