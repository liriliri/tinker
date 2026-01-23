import { create, all } from 'mathjs'

const math = create(all, {
  number: 'BigNumber',
  precision: 64,
})

const toNumber = (value: unknown): number => {
  if (math.isBigNumber(value)) {
    return value.toNumber()
  }
  if (typeof value === 'number') {
    return value
  }
  return Number(value)
}

const rad = (value: unknown): number => {
  return (toNumber(value) * Math.PI) / 180
}

const inverseRad = (value: number): number => {
  return (value * 180) / Math.PI
}

export const createScope = (isDegree: boolean) => {
  if (!isDegree) {
    return {}
  }
  return {
    sin: (value: unknown) => Math.sin(rad(value)),
    cos: (value: unknown) => Math.cos(rad(value)),
    tan: (value: unknown) => Math.tan(rad(value)),
    asin: (value: unknown) => inverseRad(Math.asin(toNumber(value))),
    acos: (value: unknown) => inverseRad(Math.acos(toNumber(value))),
    atan: (value: unknown) => inverseRad(Math.atan(toNumber(value))),
    sinh: (value: unknown) => Math.sinh(rad(value)),
    cosh: (value: unknown) => Math.cosh(rad(value)),
    tanh: (value: unknown) => Math.tanh(rad(value)),
    asinh: (value: unknown) => inverseRad(Math.asinh(toNumber(value))),
    acosh: (value: unknown) => inverseRad(Math.acosh(toNumber(value))),
    atanh: (value: unknown) => inverseRad(Math.atanh(toNumber(value))),
  }
}

export const formatResult = (value: unknown): string => {
  if (math.isBigNumber(value)) {
    return value.toString()
  }
  if (typeof value === 'number') {
    return math.format(value, { notation: 'auto', precision: 14 })
  }
  if (typeof value === 'string') {
    return value
  }
  return String(value)
}

export default math
