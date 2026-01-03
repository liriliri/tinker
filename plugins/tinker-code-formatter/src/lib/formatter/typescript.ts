import Base from './base'
import { format } from 'prettier/standalone'
import typescript from 'prettier/plugins/typescript'
import estree from 'prettier/plugins/estree'

export const formatter = new (class extends Base<'typescript'> {
  async beautify(): Promise<string> {
    return format(this.code, {
      plugins: [typescript, estree],
      parser: 'typescript',
      tabWidth: this.getOptionValue('tab', 4),
    })
  }
})()
