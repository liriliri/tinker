import * as window from 'share/main/lib/window'
import { getMainStore } from '../lib/store'

const store = getMainStore()

export function showWin() {
  const win = window.create({
    name: 'main',
    minWidth: 960,
    minHeight: 640,
    ...store.get('bounds'),
    maximized: store.get('maximized'),
    onSavePos: () => window.savePos(win, store, true),
    menu: true,
  })

  window.loadPage(win)
}
