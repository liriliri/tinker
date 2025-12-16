// Adapted from https://github.com/shikijs/shiki/blob/main/packages/shiki/src/theme-css-variables.ts

import type { ThemeRegistration } from 'shiki'

export interface CssVariablesThemeOptions {
  name?: string
  variablePrefix?: string
  variableDefaults?: Record<string, string>
  fontStyle?: boolean
}

export function createCssVariablesTheme(
  options: CssVariablesThemeOptions = {}
): ThemeRegistration {
  const {
    name = 'css-variables',
    variablePrefix = '--shiki-',
    fontStyle = true,
  } = options

  const variable = (name: string) => {
    if (options.variableDefaults?.[name])
      return `var(${variablePrefix}${name}, ${options.variableDefaults[name]})`
    return `var(${variablePrefix}${name})`
  }

  const theme: ThemeRegistration = {
    name,
    type: 'dark',
    colors: {
      'editor.foreground': variable('foreground'),
      'editor.background': variable('background'),
    },
    tokenColors: [
      {
        scope: [
          'keyword.operator.accessor',
          'meta.group.braces.round.function.arguments',
          'meta.template.expression',
          'markup.fenced_code meta.embedded.block',
        ],
        settings: {
          foreground: variable('foreground'),
        },
      },
      {
        scope: ['string', 'markup.fenced_code', 'markup.inline'],
        settings: {
          foreground: variable('token-string'),
        },
      },
      {
        scope: ['comment'],
        settings: {
          foreground: variable('token-comment'),
        },
      },
      {
        scope: [
          'constant.numeric',
          'constant.language',
          'constant.other.placeholder',
          'variable.other.constant',
        ],
        settings: {
          foreground: variable('token-constant'),
        },
      },
      {
        scope: [
          'keyword',
          'storage.modifier',
          'storage.type',
          'punctuation.separator.key-value',
        ],
        settings: {
          foreground: variable('token-keyword'),
        },
      },
      {
        scope: 'variable.parameter.function',
        settings: {
          foreground: variable('token-parameter'),
        },
      },
      {
        scope: [
          'support.function',
          'entity.name.function',
          'meta.function-call',
        ],
        settings: {
          foreground: variable('token-function'),
        },
      },
      {
        scope: ['entity.name.tag', 'string.quoted', 'string.template'],
        settings: {
          foreground: variable('token-string-expression'),
        },
      },
      {
        scope: ['punctuation.definition.arguments', 'punctuation.separator'],
        settings: {
          foreground: variable('token-punctuation'),
        },
      },
      {
        scope: ['constant.numeric.decimal', 'constant.language.boolean'],
        settings: { foreground: variable('token-number') },
      },
      {
        scope: ['support.variable.property'],
        settings: { foreground: variable('token-property') },
      },
    ],
  }

  if (!fontStyle) {
    theme.tokenColors = theme.tokenColors?.map((tokenColor) => {
      if (tokenColor.settings?.fontStyle)
        // @ts-expect-error force delete readonly property
        delete tokenColor.settings.fontStyle
      return tokenColor
    })
  }

  return theme
}
