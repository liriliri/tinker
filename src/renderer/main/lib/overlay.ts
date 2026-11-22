import uniqId from 'licia/uniqId'
import LunaModal from 'luna-modal'
import { notify as notifyLocal } from 'share/renderer/lib/util'
import { IOverlayModalType, IOverlayNotifyOptions } from 'common/types'
import store from '../store'

function pluginOpen() {
  return !!store.plugin
}

export async function notify(content: string, options?: IOverlayNotifyOptions) {
  if (pluginOpen()) {
    const routed = await main.overlayNotify(content, options)
    if (routed) {
      return
    }
  }
  notifyLocal(content, options)
}

function routeModal(type: IOverlayModalType, message: string) {
  return main.overlayModal({
    id: uniqId('overlay-modal-'),
    type,
    message,
  })
}

const origAlert = LunaModal.alert.bind(LunaModal)
const origConfirm = LunaModal.confirm.bind(LunaModal)

export async function confirm(message: string): Promise<boolean> {
  if (pluginOpen()) {
    const result = await routeModal('confirm', message)
    if (result !== undefined) {
      return result === true
    }
  }
  return origConfirm(message)
}

export async function alert(message: string): Promise<void> {
  if (pluginOpen()) {
    const result = await routeModal('alert', message)
    if (result !== undefined) {
      return
    }
  }
  await origAlert(message)
}

LunaModal.alert = alert
LunaModal.confirm = confirm
