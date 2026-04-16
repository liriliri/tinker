const g = globalThis as Record<string, unknown>

export function expose(globals: Record<string, unknown>): void
export function expose(
  globalName: string,
  main: unknown,
  all?: Record<string, unknown>
): void
export function expose(
  globalNameOrMap: string | Record<string, unknown>,
  main?: unknown,
  all?: Record<string, unknown>
) {
  if (typeof globalNameOrMap === 'object') {
    Object.assign(g, globalNameOrMap)
    return
  }
  if (all) {
    Object.assign(main as Record<string, unknown>, all)
  }
  g[globalNameOrMap] = main
}
