export function formatNumber(value: string): string {
  const num = parseFloat(value)
  if (isNaN(num)) return value

  const parts = num.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return parts.join('.')
}
