export type KeyAction =
  | 'digit'
  | 'dot'
  | 'operator'
  | 'equals'
  | 'clear'
  | 'toggleSign'
  | 'percent'
  | 'wrap'
  | 'append'
  | 'constant'
  | 'memoryClear'
  | 'memoryAdd'
  | 'memorySubtract'
  | 'memoryRecall'
  | 'toggleSecond'
  | 'toggleDegree'

export type KeyKind = 'number' | 'operator' | 'function' | 'control' | 'memory'

export type KeyConfig = {
  id: string
  label: string
  action: KeyAction
  value?: string
  altLabel?: string
  altAction?: KeyAction
  altValue?: string
  kind?: KeyKind
  wide?: boolean
}

export const KEY_ROWS: KeyConfig[][] = [
  [
    { id: 'leftParen', label: '(', action: 'append', value: '(' },
    { id: 'rightParen', label: ')', action: 'append', value: ')' },
    { id: 'mc', label: 'mc', action: 'memoryClear', kind: 'memory' },
    { id: 'mPlus', label: 'm+', action: 'memoryAdd', kind: 'memory' },
    { id: 'mMinus', label: 'm-', action: 'memorySubtract', kind: 'memory' },
    { id: 'mr', label: 'mr', action: 'memoryRecall', kind: 'memory' },
    { id: 'ac', label: 'AC', action: 'clear', kind: 'control' },
    { id: 'sign', label: '+/-', action: 'toggleSign', kind: 'control' },
    { id: 'percent', label: '%', action: 'percent', kind: 'control' },
    {
      id: 'divide',
      label: '/',
      action: 'operator',
      value: '/',
      kind: 'operator',
    },
  ],
  [
    { id: 'second', label: '2nd', action: 'toggleSecond', kind: 'control' },
    {
      id: 'square',
      label: 'x^2',
      action: 'wrap',
      value: 'square',
      kind: 'function',
    },
    {
      id: 'cube',
      label: 'x^3',
      action: 'wrap',
      value: 'cube',
      kind: 'function',
    },
    {
      id: 'power',
      label: 'x^y',
      action: 'operator',
      value: '^',
      kind: 'function',
    },
    {
      id: 'exp',
      label: 'e^x',
      action: 'append',
      value: 'exp(',
      kind: 'function',
    },
    {
      id: 'pow10',
      label: '10^x',
      action: 'append',
      value: '10^(',
      kind: 'function',
    },
    { id: '7', label: '7', action: 'digit', value: '7', kind: 'number' },
    { id: '8', label: '8', action: 'digit', value: '8', kind: 'number' },
    { id: '9', label: '9', action: 'digit', value: '9', kind: 'number' },
    {
      id: 'multiply',
      label: '*',
      action: 'operator',
      value: '*',
      kind: 'operator',
    },
  ],
  [
    {
      id: 'reciprocal',
      label: '1/x',
      action: 'wrap',
      value: 'reciprocal',
      kind: 'function',
    },
    {
      id: 'sqrt',
      label: 'sqrt',
      action: 'wrap',
      value: 'sqrt',
      kind: 'function',
    },
    {
      id: 'cbrt',
      label: 'cbrt',
      action: 'wrap',
      value: 'cbrt',
      kind: 'function',
    },
    {
      id: 'nthRoot',
      label: 'yroot',
      action: 'append',
      value: 'nthRoot(',
      kind: 'function',
    },
    {
      id: 'ln',
      label: 'ln',
      action: 'append',
      value: 'log(',
      kind: 'function',
    },
    {
      id: 'log10',
      label: 'log10',
      action: 'append',
      value: 'log10(',
      kind: 'function',
    },
    { id: '4', label: '4', action: 'digit', value: '4', kind: 'number' },
    { id: '5', label: '5', action: 'digit', value: '5', kind: 'number' },
    { id: '6', label: '6', action: 'digit', value: '6', kind: 'number' },
    {
      id: 'minus',
      label: '-',
      action: 'operator',
      value: '-',
      kind: 'operator',
    },
  ],
  [
    {
      id: 'factorial',
      label: 'x!',
      action: 'wrap',
      value: 'factorial',
      kind: 'function',
    },
    {
      id: 'sin',
      label: 'sin',
      action: 'append',
      value: 'sin(',
      altLabel: 'asin',
      altAction: 'append',
      altValue: 'asin(',
      kind: 'function',
    },
    {
      id: 'cos',
      label: 'cos',
      action: 'append',
      value: 'cos(',
      altLabel: 'acos',
      altAction: 'append',
      altValue: 'acos(',
      kind: 'function',
    },
    {
      id: 'tan',
      label: 'tan',
      action: 'append',
      value: 'tan(',
      altLabel: 'atan',
      altAction: 'append',
      altValue: 'atan(',
      kind: 'function',
    },
    { id: 'e', label: 'e', action: 'constant', value: 'e', kind: 'function' },
    { id: 'ee', label: 'EE', action: 'append', value: 'e', kind: 'function' },
    { id: '1', label: '1', action: 'digit', value: '1', kind: 'number' },
    { id: '2', label: '2', action: 'digit', value: '2', kind: 'number' },
    { id: '3', label: '3', action: 'digit', value: '3', kind: 'number' },
    {
      id: 'plus',
      label: '+',
      action: 'operator',
      value: '+',
      kind: 'operator',
    },
  ],
  [
    {
      id: 'toggleDegree',
      label: 'Rad',
      action: 'toggleDegree',
      kind: 'control',
    },
    {
      id: 'sinh',
      label: 'sinh',
      action: 'append',
      value: 'sinh(',
      altLabel: 'asinh',
      altAction: 'append',
      altValue: 'asinh(',
      kind: 'function',
    },
    {
      id: 'cosh',
      label: 'cosh',
      action: 'append',
      value: 'cosh(',
      altLabel: 'acosh',
      altAction: 'append',
      altValue: 'acosh(',
      kind: 'function',
    },
    {
      id: 'tanh',
      label: 'tanh',
      action: 'append',
      value: 'tanh(',
      altLabel: 'atanh',
      altAction: 'append',
      altValue: 'atanh(',
      kind: 'function',
    },
    {
      id: 'pi',
      label: 'pi',
      action: 'constant',
      value: 'pi',
      kind: 'function',
    },
    {
      id: 'rand',
      label: 'Rand',
      action: 'append',
      value: 'random()',
      kind: 'function',
    },
    {
      id: '0',
      label: '0',
      action: 'digit',
      value: '0',
      kind: 'number',
      wide: true,
    },
    { id: 'dot', label: '.', action: 'dot', kind: 'number' },
    { id: 'equal', label: '=', action: 'equals', kind: 'operator' },
  ],
]
