import { IpcDragMain } from 'common/types'
import mainObj from 'share/preload/main'
import { invoke } from 'share/preload/util'

export default Object.assign(mainObj, {
  dragMain: invoke<IpcDragMain>('dragMain'),
})
