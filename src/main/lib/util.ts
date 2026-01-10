export async function loadMod(moduleName: string) {
  try {
    const mod = await import(moduleName)
    return mod.default || mod
  } catch {
    return null
  }
}
