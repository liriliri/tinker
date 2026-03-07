export function pad(n: number): string {
  return String(Math.floor(n)).padStart(2, '0')
}

export function formatMs(ms: number): string {
  const cs = Math.floor(ms / 10) % 100
  const s = Math.floor(ms / 1000) % 60
  const m = Math.floor(ms / 60000)
  return `${pad(m)}:${pad(s)}.${pad(cs)}`
}
