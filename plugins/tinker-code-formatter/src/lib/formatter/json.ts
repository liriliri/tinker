import Base from './base'

export const formatter = new (class extends Base<'json'> {
  async beautify(): Promise<string> {
    const tabWidth = this.getOptionValue('tab', 4)
    const indent = tabWidth === 0 ? '' : ' '.repeat(tabWidth)
    return JSON.stringify(JSON.parse(this.code), null, indent)
  }
})()
