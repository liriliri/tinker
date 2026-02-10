export function formatSpeed(speed: number): string {
  if (speed >= 1000) {
    return `${(speed / 1000).toFixed(2)} GHz`
  }
  return `${speed} MHz`
}
