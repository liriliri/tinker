import Base from './base'
import { format } from 'prettier/standalone'
import babel from 'prettier/plugins/babel'
import estree from 'prettier/plugins/estree'

export const formatter = new (class extends Base<'javascript'> {
  async beautify(): Promise<string> {
    return format(this.code, {
      plugins: [babel, estree],
      parser: 'babel',
      tabWidth: this.getOptionValue('tab', 4),
    })
  }
})()
