import { create, all } from 'mathjs'
import find from 'licia/find'

const math = create(all, {
  number: 'BigNumber',
})

const MAX_NUM = 14
const DECIMAL_NUM = 7
const EXPONENTIAL_NUM = 4

type UnitConfig = {
  key: string
  unit: string
  calc: string
  init: string
}

type GroupConfig = {
  key: string
  list: string[]
}

type ConfigType = {
  key: string
  main: string
  unit: UnitConfig[]
  special: { from: string; to: string; func: string }[]
  group: GroupConfig[]
}

export const config: ConfigType[] = [
  {
    key: 'length',
    main: 'm',
    unit: [
      {
        key: 'km',
        unit: 'km',
        calc: 'x / 1000',
        init: 'x * 1000',
      },
      {
        key: 'm',
        unit: 'm',
        calc: 'x',
        init: 'x',
      },
      {
        key: 'dm',
        unit: 'dm',
        calc: 'x / 0.1',
        init: 'x * 0.1',
      },
      {
        key: 'cm',
        unit: 'cm',
        calc: 'x / 0.01',
        init: 'x * 0.01',
      },
      {
        key: 'mm',
        unit: 'mm',
        calc: 'x / 0.001',
        init: 'x * 0.001',
      },
      {
        key: 'um',
        unit: 'μm',
        calc: 'x / 0.000001',
        init: 'x * 0.000001',
      },
      {
        key: 'in',
        unit: 'in',
        calc: 'x / (0.3048 / 12)',
        init: 'x * (0.3048 / 12)',
      },
      {
        key: 'ft',
        unit: 'ft',
        calc: 'x / 0.3048',
        init: 'x * 0.3048',
      },
      {
        key: 'yd',
        unit: 'yd',
        calc: 'x / (0.3048 * 3)',
        init: 'x * (0.3048 * 3)',
      },
      {
        key: 'mi',
        unit: 'mi',
        calc: 'x / (0.3048 * 3 * 1760)',
        init: 'x * (0.3048 * 3 * 1760)',
      },
    ],
    special: [],
    group: [
      {
        key: 'metric_system',
        list: ['km', 'm', 'dm', 'cm', 'mm', 'um'],
      },
      {
        key: 'imperial_units',
        list: ['in', 'ft', 'yd', 'mi'],
      },
    ],
  },
  {
    key: 'area',
    main: 'm_2',
    unit: [
      {
        key: 'km_2',
        unit: 'km²',
        calc: 'x / 1000000',
        init: 'x * 1000000',
      },
      {
        key: 'm_2',
        unit: 'm²',
        calc: 'x',
        init: 'x',
      },
      {
        key: 'cm_2',
        unit: 'cm²',
        calc: 'x / 0.0001',
        init: 'x * 0.0001',
      },
      {
        key: 'acre',
        unit: 'acre',
        calc: 'x / ((0.3048^2) * (16.5^2) * 160)',
        init: 'x * ((0.3048^2) * (16.5^2) * 160)',
      },
      {
        key: 'ft_2',
        unit: 'ft²',
        calc: 'x / (0.3048^2)',
        init: 'x * (0.3048^2)',
      },
    ],
    special: [],
    group: [
      {
        key: 'metric_system',
        list: ['km_2', 'm_2', 'cm_2'],
      },
      {
        key: 'imperial_units',
        list: ['acre', 'ft_2'],
      },
    ],
  },
  {
    key: 'volume',
    main: 'l',
    unit: [
      {
        key: 'l',
        unit: 'L',
        calc: 'x',
        init: 'x',
      },
      {
        key: 'ml',
        unit: 'mL',
        calc: 'x * 1000',
        init: 'x / 1000',
      },
      {
        key: 'gal',
        unit: 'gal',
        calc: 'x / 3.78541',
        init: 'x * 3.78541',
      },
    ],
    special: [],
    group: [
      {
        key: 'metric_system',
        list: ['l', 'ml'],
      },
      {
        key: 'imperial_units',
        list: ['gal'],
      },
    ],
  },
  {
    key: 'weight',
    main: 'kg',
    unit: [
      {
        key: 'kg',
        unit: 'kg',
        calc: 'x',
        init: 'x',
      },
      {
        key: 'g',
        unit: 'g',
        calc: 'x * 1000',
        init: 'x / 1000',
      },
      {
        key: 'mg',
        unit: 'mg',
        calc: 'x * 1000000',
        init: 'x / 1000000',
      },
      {
        key: 'lb',
        unit: 'lb',
        calc: 'x / 0.45359237',
        init: 'x * 0.45359237',
      },
      {
        key: 'oz',
        unit: 'oz',
        calc: 'x / (0.45359237 / 16)',
        init: 'x * (0.45359237 / 16)',
      },
    ],
    special: [],
    group: [
      {
        key: 'metric_system',
        list: ['kg', 'g', 'mg'],
      },
      {
        key: 'imperial_units',
        list: ['lb', 'oz'],
      },
    ],
  },
  {
    key: 'temperature',
    main: 'c',
    unit: [
      {
        key: 'c',
        unit: '°C',
        calc: 'x',
        init: 'x',
      },
      {
        key: 'f',
        unit: '°F',
        calc: '(x * 9 / 5) + 32',
        init: '(x - 32) * 5 / 9',
      },
      {
        key: 'k',
        unit: 'K',
        calc: 'x + 273.15',
        init: 'x - 273.15',
      },
    ],
    special: [],
    group: [
      {
        key: '',
        list: ['c', 'f', 'k'],
      },
    ],
  },
  {
    key: 'time',
    main: 's',
    unit: [
      {
        key: 'd',
        unit: 'd',
        calc: 'x / 86400',
        init: 'x * 86400',
      },
      {
        key: 'h',
        unit: 'h',
        calc: 'x / 3600',
        init: 'x * 3600',
      },
      {
        key: 'min',
        unit: 'min',
        calc: 'x / 60',
        init: 'x * 60',
      },
      {
        key: 's',
        unit: 's',
        calc: 'x',
        init: 'x',
      },
      {
        key: 'ms',
        unit: 'ms',
        calc: 'x * 1000',
        init: 'x / 1000',
      },
    ],
    special: [],
    group: [
      {
        key: '',
        list: ['d', 'h', 'min', 's', 'ms'],
      },
    ],
  },
  {
    key: 'byte',
    main: 'b',
    unit: [
      {
        key: 'b',
        unit: 'B',
        calc: 'x',
        init: 'x',
      },
      {
        key: 'kb',
        unit: 'KB',
        calc: 'x / (2^10)',
        init: 'x * (2^10)',
      },
      {
        key: 'mb',
        unit: 'MB',
        calc: 'x / (2^20)',
        init: 'x * (2^20)',
      },
      {
        key: 'gb',
        unit: 'GB',
        calc: 'x / (2^30)',
        init: 'x * (2^30)',
      },
      {
        key: 'tb',
        unit: 'TB',
        calc: 'x / (2^40)',
        init: 'x * (2^40)',
      },
    ],
    special: [],
    group: [
      {
        key: '',
        list: ['b', 'kb', 'mb', 'gb', 'tb'],
      },
    ],
  },
]

export const getType = (name: string): ConfigType => {
  const type = find(config, (t) => name === t.key)
  if (!type) {
    throw new Error(`${name} type not found`)
  }
  return type
}

export const getUnit = (type: string, unitKey: string): UnitConfig => {
  const unit = find(getType(type).unit, (u) => unitKey === u.key)
  if (!unit) {
    throw new Error(`${type} - ${unitKey} unit not found`)
  }
  return unit
}

export const getGroupByUnit = (type: string, unit: string): string => {
  const group = find(getType(type).group, (g) => g.list.includes(unit))
  return group ? group.key : ''
}

const getSpecial = (name: string, from: string, to: string): string | null => {
  const type = getType(name)
  if (type.special.length > 0) {
    for (const special of type.special) {
      if (special.from === from && special.to === to) {
        return special.func
      }
    }
  }
  return null
}

const exponential = (num: number, n: number): string => {
  const numExp = num.toExponential(n)
  return numExp.match(new RegExp('.0{' + n + '}e'))
    ? num.toExponential(0)
    : numExp
}

const format = (_num: string): string => {
  let num = Number(_num)

  const strNum = `${num}`
  let isFloat = false

  if (strNum.indexOf('.') > -1) {
    const match = strNum.match(/\.\d+e[+-](\d+)$/)
    if (match && match[1]) {
      isFloat = (match[1] as any) * 1 < MAX_NUM - 1
    } else {
      isFloat = true
    }
  }

  if (isFloat) {
    if (num > -1 && num < 1 && num !== 0) {
      if (Math.abs(num) < 0.00001) {
        return exponential(num, EXPONENTIAL_NUM)
      } else {
        num = Number(num.toFixed(DECIMAL_NUM))
      }
    } else {
      const arr = strNum.split('.')
      const intPart = arr[0]
      const decPart = arr[1]

      if (strNum.length > MAX_NUM) {
        if (intPart.length >= MAX_NUM) {
          return exponential(num, EXPONENTIAL_NUM)
        } else {
          if (intPart.length < DECIMAL_NUM - 1) {
            num = Number(num.toFixed(DECIMAL_NUM))
          } else {
            num = Number(num.toFixed(MAX_NUM - intPart.length - 1))
          }
        }
      } else {
        if (decPart.length > DECIMAL_NUM) {
          num = Number(num.toFixed(DECIMAL_NUM))
        }
      }
    }
  } else {
    if (strNum.length > MAX_NUM) {
      return exponential(num, EXPONENTIAL_NUM)
    }
  }
  return `${num}`
}

export const calculate = (
  type: string,
  num: string,
  from: string,
  to: string
): string => {
  const fromUnit = getUnit(type, from)
  if (from === to) {
    return format(num)
  }
  const toUnit = getUnit(type, to)

  const special = getSpecial(type, from, to)

  const calc = (input: string, expression: string) => {
    return math.evaluate(expression.replaceAll('x', input)).toString()
  }

  if (special !== null) {
    num = calc(num, special)
  } else {
    num = calc(calc(num, fromUnit.init), toUnit.calc)
  }
  return format(num)
}
