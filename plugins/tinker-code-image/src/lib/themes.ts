import { CSSProperties } from 'react'
import { createCssVariablesTheme } from './theme-css-variables'

export type SyntaxColors = {
  foreground: string
  constant?: string
  string?: string
  comment?: string
  keyword?: string
  parameter?: string
  function?: string
  stringExpression?: string
  punctuation?: string
  number?: string
  property?: string
}

export type FrameColors = {
  background: string
  titleBar: string
  title: string
}

export interface Theme {
  id: string
  name: string
  syntax: {
    light: SyntaxColors
    dark: SyntaxColors
  }
  frame: {
    light: FrameColors
    dark: FrameColors
  }
}

export const THEMES: { [index: string]: Theme } = {
  candy: {
    id: 'candy',
    name: 'Candy',
    syntax: {
      light: {
        foreground: '#434447',
        constant: '#2286A6',
        string: '#B2762E',
        comment: '#8D949B',
        keyword: '#DC155E',
        parameter: '#009033',
        function: '#009033',
        stringExpression: '#B2762E',
        punctuation: '#d15a8b',
        number: '#676DFF',
        property: '#2286A6',
      },
      dark: {
        foreground: '#FFFFFF',
        constant: '#1AC8FF',
        string: '#DFD473',
        comment: '#807796',
        keyword: '#FF659C',
        parameter: '#1AC8FF',
        function: '#73DFA5',
        stringExpression: '#DFD473',
        punctuation: '#FF659C',
        number: '#7A7FFD',
        property: '#1AC8FF',
      },
    },
    frame: {
      light: {
        background: '#ffffff',
        titleBar: '#f3e5f5',
        title: '#6b7280',
      },
      dark: {
        background: '#1e1e2e',
        titleBar: '#2d2d44',
        title: '#b4b4c8',
      },
    },
  },
  breeze: {
    id: 'breeze',
    name: 'Breeze',
    syntax: {
      light: {
        foreground: '#434447',
        constant: '#0B7880',
        parameter: '#C44170',
        function: '#C44170',
        keyword: '#496EB8',
        stringExpression: '#886594',
        punctuation: '#C44170',
        string: '#886594',
        comment: '#8C828B',
        number: '#24805E',
        property: '#0B7880',
      },
      dark: {
        foreground: '#FFFFFF',
        constant: '#49E8F2',
        parameter: '#F8518D',
        function: '#F8518D',
        keyword: '#6599FF',
        stringExpression: '#E9AEFE',
        punctuation: '#F8518D',
        string: '#E9AEFE',
        comment: '#8A757D',
        number: '#55E7B2',
        property: '#49E8F2',
      },
    },
    frame: {
      light: {
        background: '#ffffff',
        titleBar: '#e8eaf6',
        title: '#6b7280',
      },
      dark: {
        background: '#1a1a2e',
        titleBar: '#2a2a44',
        title: '#b4b4d8',
      },
    },
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson',
    syntax: {
      light: {
        foreground: '#685B5B',
        constant: '#C94F0A',
        string: '#836250',
        comment: '#978A8A',
        keyword: '#BE3B3B',
        parameter: '#9E7070',
        function: '#9E7070',
        stringExpression: '#836250',
        punctuation: '#BE3B3B',
        number: '#C94F0A',
        property: '#D15510',
      },
      dark: {
        foreground: '#FEFDFD',
        constant: '#D15510',
        string: '#EBB99D',
        comment: '#895E60',
        keyword: '#EB6F6F',
        parameter: '#C88E8E',
        function: '#C88E8E',
        stringExpression: '#EBB99D',
        punctuation: '#EB6F6F',
        number: '#FDA97A',
        property: '#D15510',
      },
    },
    frame: {
      light: {
        background: '#ffffff',
        titleBar: '#ffebee',
        title: '#6b7280',
      },
      dark: {
        background: '#2d1f1f',
        titleBar: '#3d2828',
        title: '#d4a5a5',
      },
    },
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    syntax: {
      light: {
        foreground: '#434447',
        constant: '#766599',
        string: '#5F758F',
        comment: '#78808C',
        keyword: '#587678',
        parameter: '#2F788F',
        function: '#2F788F',
        stringExpression: '#5F758F',
        punctuation: '#587678',
        number: '#2D8264',
        property: '#766599',
      },
      dark: {
        foreground: '#FFFFFF',
        constant: '#9681C2',
        string: '#6D86A4',
        comment: '#4A4C56',
        keyword: '#7DA9AB',
        parameter: '#51D0F8',
        function: '#51D0F8',
        stringExpression: '#6D86A4',
        punctuation: '#7DA9AB',
        number: '#75D2B1',
        property: '#9681C2',
      },
    },
    frame: {
      light: {
        background: '#ffffff',
        titleBar: '#e0f2f1',
        title: '#6b7280',
      },
      dark: {
        background: '#161622',
        titleBar: '#1e1e33',
        title: '#9ca3af',
      },
    },
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    syntax: {
      light: {
        foreground: '#737568',
        constant: '#AD5A78',
        string: '#8C703C',
        comment: '#7A7055',
        keyword: '#A1642C',
        parameter: '#807410',
        function: '#807410',
        stringExpression: '#8C703C',
        punctuation: '#A1642C',
        number: '#856F00',
        property: '#AD5A78',
      },
      dark: {
        foreground: '#FFFFFF',
        constant: '#E978A1',
        string: '#F9D38C',
        comment: '#878572',
        keyword: '#FFAF65',
        parameter: '#E2D66B',
        function: '#E2D66B',
        stringExpression: '#F9D38C',
        punctuation: '#FFAF65',
        number: '#E7CF55',
        property: '#E978A1',
      },
    },
    frame: {
      light: {
        background: '#ffffff',
        titleBar: '#fff3e0',
        title: '#6b7280',
      },
      dark: {
        background: '#2a2219',
        titleBar: '#3a2f1f',
        title: '#d4c5a5',
      },
    },
  },
  mono: {
    id: 'mono',
    name: 'Mono',
    syntax: {
      light: {
        foreground: '#111111',
        constant: '#666666',
        parameter: '#666666',
        stringExpression: '#666666',
        keyword: '#666666',
        function: '#111111',
        punctuation: '#666666',
        string: '#666666',
        comment: '#999999',
        number: '#111111',
        property: '#666666',
      },
      dark: {
        foreground: '#ffffff',
        constant: '#a7a7a7',
        parameter: '#a7a7a7',
        stringExpression: '#a7a7a7',
        keyword: '#a7a7a7',
        function: '#ffffff',
        punctuation: '#a7a7a7',
        string: '#a7a7a7',
        comment: '#666666',
        number: '#ffffff',
        property: '#a7a7a7',
      },
    },
    frame: {
      light: {
        background: '#ffffff',
        titleBar: '#f3f4f6',
        title: '#6b7280',
      },
      dark: {
        background: '#181818',
        titleBar: '#282828',
        title: '#9ca3af',
      },
    },
  },
  raindrop: {
    id: 'raindrop',
    name: 'Raindrop',
    syntax: {
      light: {
        foreground: '#687077',
        constant: '#007BA1',
        string: '#507683',
        comment: '#6E7780',
        keyword: '#008DAC',
        parameter: '#4F9488',
        function: '#4F9488',
        stringExpression: '#507683',
        punctuation: '#008DAC',
        number: '#7459E1',
        property: '#007BA1',
      },
      dark: {
        foreground: '#E4F2FF',
        constant: '#008BB7',
        string: '#9DD8EB',
        comment: '#6C808B',
        keyword: '#2ED9FF',
        parameter: '#1AD6B5',
        function: '#1AD6B5',
        stringExpression: '#9DD8EB',
        punctuation: '#2ED9FF',
        number: '#9984EE',
        property: '#008BB7',
      },
    },
    frame: {
      light: {
        background: '#ffffff',
        titleBar: '#e1f5fe',
        title: '#006fa1',
      },
      dark: {
        background: '#0d1f2d',
        titleBar: '#152936',
        title: '#9DD8EB',
      },
    },
  },
  meadow: {
    id: 'meadow',
    name: 'Meadow',
    syntax: {
      light: {
        foreground: '#54594D',
        constant: '#B6781B',
        string: '#837E50',
        comment: '#72806E',
        keyword: '#049649',
        parameter: '#798B52',
        function: '#798B52',
        stringExpression: '#837E50',
        punctuation: '#049649',
        number: '#2C8801',
        property: '#B6781B',
      },
      dark: {
        foreground: '#FFFFFF',
        constant: '#E4B165',
        string: '#E9EB9D',
        comment: '#708B6C',
        keyword: '#6DD79F',
        parameter: '#B3D767',
        function: '#B3D767',
        stringExpression: '#E9EB9D',
        punctuation: '#6DD79F',
        number: '#46B114',
        property: '#E4B165',
      },
    },
    frame: {
      light: {
        background: '#ffffff',
        titleBar: '#e8f5e9',
        title: '#2e7d32',
      },
      dark: {
        background: '#1a2418',
        titleBar: '#243020',
        title: '#B3D767',
      },
    },
  },
  falcon: {
    id: 'falcon',
    name: 'Falcon',
    syntax: {
      light: {
        foreground: '#464C65',
        constant: '#839AA7',
        string: '#506483',
        comment: '#9DA4AD',
        keyword: '#5C827D',
        parameter: '#6A7C9F',
        function: '#6A7C9F',
        stringExpression: '#46615D',
        punctuation: '#5C827D',
        number: '#AE6A65',
        property: '#839AA7',
      },
      dark: {
        foreground: '#FFFFFF',
        constant: '#799DB1',
        string: '#6A8697',
        comment: '#6D7E88',
        keyword: '#9AB6B2',
        parameter: '#6D88BB',
        function: '#6D88BB',
        stringExpression: '#789083',
        punctuation: '#9AB6B2',
        number: '#BD9C9C',
        property: '#799DB1',
      },
    },
    frame: {
      light: {
        background: '#ffffff',
        titleBar: '#e3f2fd',
        title: '#546e7a',
      },
      dark: {
        background: '#1c1f2e',
        titleBar: '#242736',
        title: '#799DB1',
      },
    },
  },
  sand: {
    id: 'sand',
    name: 'Sand',
    syntax: {
      light: {
        foreground: '#262217',
        constant: '#A28C4E',
        string: '#A28C4E',
        comment: '#C4B39C',
        keyword: '#906937',
        parameter: '#DA8744',
        function: '#DA8744',
        stringExpression: '#C57416',
        punctuation: '#DA8744',
        number: '#A28C4E',
        property: '#A28C4E',
      },
      dark: {
        foreground: '#FFFFFF',
        constant: '#C2B181',
        string: '#C2B181',
        comment: '#837E77',
        keyword: '#D3B48C',
        parameter: '#F4A361',
        function: '#F4A361',
        stringExpression: '#EED5B8',
        punctuation: '#F4A361',
        number: '#C2B181',
        property: '#C2B181',
      },
    },
    frame: {
      light: {
        background: '#ffffff',
        titleBar: '#fef5e7',
        title: '#8d6e3f',
      },
      dark: {
        background: '#252218',
        titleBar: '#342d20',
        title: '#EED5B8',
      },
    },
  },
  ice: {
    id: 'ice',
    name: 'Ice',
    syntax: {
      light: {
        foreground: '#1C1B29',
        constant: '#00B0E9',
        string: '#6ABAD8',
        comment: '#BDC0C1',
        keyword: '#81909D',
        parameter: '#1E3C78',
        function: '#1E3C78',
        stringExpression: '#7BBCD8',
        punctuation: '#1E3C78',
        number: '#00B0E9',
        property: '#00B0E9',
      },
      dark: {
        foreground: '#FFFFFF',
        constant: '#92DEF6',
        string: '#92DEF6',
        comment: '#5C6A70',
        keyword: '#BFC4C9',
        parameter: '#778CB6',
        function: '#778CB6',
        stringExpression: '#89C3DC',
        punctuation: '#778CB6',
        number: '#00B0E9',
        property: '#00B0E9',
      },
    },
    frame: {
      light: {
        background: '#ffffff',
        titleBar: '#e0f7fa',
        title: '#006064',
      },
      dark: {
        background: '#0f1419',
        titleBar: '#161d24',
        title: '#92DEF6',
      },
    },
  },
}

export function convertToShikiTheme(syntaxObject: SyntaxColors): CSSProperties {
  return {
    '--shiki-foreground': syntaxObject.foreground,
    '--shiki-token-constant': syntaxObject.constant,
    '--shiki-token-string': syntaxObject.string,
    '--shiki-token-comment': syntaxObject.comment,
    '--shiki-token-keyword': syntaxObject.keyword,
    '--shiki-token-parameter': syntaxObject.parameter,
    '--shiki-token-function': syntaxObject.function,
    '--shiki-token-string-expression': syntaxObject.stringExpression,
    '--shiki-token-punctuation': syntaxObject.punctuation,
    '--shiki-token-number': syntaxObject.number,
    '--shiki-token-property': syntaxObject.property,
  } as CSSProperties
}

export const shikiTheme = createCssVariablesTheme({
  name: 'css-variables',
  variablePrefix: '--shiki-',
  variableDefaults: {},
  fontStyle: true,
})
