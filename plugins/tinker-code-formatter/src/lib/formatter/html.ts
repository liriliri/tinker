import Base from './base'
import { format } from 'prettier/standalone'
import html from 'prettier/plugins/html'

export const formatter = new (class extends Base<'html'> {
  async beautify(): Promise<string> {
    return format(this.code, {
      plugins: [html],
      parser: 'html',
      tabWidth: this.getOptionValue('tab', 4),
    })
  }
})()
