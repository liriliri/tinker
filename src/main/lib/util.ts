import fs from 'fs-extra'

export async function loadMod(moduleName: string) {
  try {
    const mod = await import(moduleName)
    return mod.default || mod
  } catch {
    return null
  }
}

export function sanitizeShortcutAppName(name: string) {
  return name.replace(/[/\\:*?"<>|]/g, '-').trim() || 'Tinker Plugin'
}

export function toVbScriptStr(str: string) {
  return '"' + str.replace(/"/g, '""') + '"'
}

export async function pngToIco(pngPath: string, icoPath: string) {
  const pngData = await fs.readFile(pngPath)

  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)

  const entry = Buffer.alloc(16)
  entry.writeUInt8(0, 0)
  entry.writeUInt8(0, 1)
  entry.writeUInt8(0, 2)
  entry.writeUInt8(0, 3)
  entry.writeUInt16LE(1, 4)
  entry.writeUInt16LE(32, 6)
  entry.writeUInt32LE(pngData.length, 8)
  entry.writeUInt32LE(22, 12)

  const icoData = Buffer.concat([header, entry, pngData])
  await fs.writeFile(icoPath, icoData)
}
