import Base from './base'
import { format } from 'prettier/standalone'
import postcss from 'prettier/plugins/postcss'

export const formatter = new (class extends Base<'css'> {
  async beautify(): Promise<string> {
    return format(this.code, {
      plugins: [postcss],
      parser: 'css',
      tabWidth: this.getOptionValue('tab', 4),
    })
  }
})()
