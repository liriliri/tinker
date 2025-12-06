import { contextBridge } from 'electron'
import mainObj from './main'

window.addEventListener('DOMContentLoaded', () => {
  updateTheme()
  mainObj.on('changeTheme', updateTheme)
})

async function updateTheme() {
  const theme = await mainObj.getTheme()
  if (theme === 'dark') {
    document.body.classList.add('dark')
  } else {
    document.body.classList.remove('dark')
  }
}

const tinkerObj = {
  getTheme: mainObj.getTheme,
  getLanguage: mainObj.getLanguage,
  on: mainObj.on,
}

contextBridge.exposeInMainWorld('tinker', tinkerObj)

declare global {
  const tinker: typeof tinkerObj
}
