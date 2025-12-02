import { IpcGetPlugins, IPlugin } from 'common/types'
import { handleEvent } from 'share/main/lib/util'
import singleton from 'licia/singleton'

let plugins: IPlugin[] | null = null
const getPlugins: IpcGetPlugins = singleton(async () => {
  if (!plugins) {
    plugins = []
  }

  return plugins
})

export function init() {
  handleEvent('getPlugins', getPlugins)
}
